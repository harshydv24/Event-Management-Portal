import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import api from '@/api/client';
import { User, UserRole } from '@/types';
import { AppError, logError } from '@/lib/errorUtils';
import {
  assertRateLimit,
  recordAttempt,
  resetRateLimit,
  deviceKey,
  accountKey,
} from '@/lib/rateLimiter';
import {
  validate,
  signupSchema,
  loginSchema,
  firestoreIdSchema,
  updateProfileSchema,
} from '@/lib/validationSchemas';

export interface FirebaseUserProfile {
  email: string;
  name: string;
  role: UserRole;
  uid?: string; // university ID for students
  clubId?: string;
  createdAt: unknown;
  updatedAt: unknown;
}

/**
 * Register a new user with Firebase Auth and sync the profile to the backend.
 *
 * 1. Creates Firebase Auth account (client-side)
 * 2. Calls POST /api/auth/sync to create MongoDB profile
 * 3. Sends email verification
 *
 * Rate-limited under the **auth** tier (per-device + per-account).
 */
export const registerUser = async (
  email: string,
  password: string,
  name: string,
  role: UserRole,
  universityId?: string
): Promise<User> => {
  // Validate inputs against strict schema — reject invalid data
  validate(signupSchema, { email, password, name, role, universityId });

  const dKey = deviceKey('signup');
  const aKey = accountKey(email, 'signup');

  // Check both device-level and account-level limits
  assertRateLimit(dKey, 'auth');
  assertRateLimit(aKey, 'auth');

  try {
    // Step 1: Create Firebase Auth account
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
    const firebaseUser = credential.user;

    await updateProfile(firebaseUser, { displayName: name.trim() });

    // Step 2: Sync profile to Express backend / MongoDB
    const syncResponse = await api.post<{ user: User }>('/auth/sync', {
      email: email.trim(),
      name: name.trim(),
      role,
      universityId: role === 'student' ? universityId?.trim() : undefined,
    });

    // Step 3: Send email verification
    await sendEmailVerification(firebaseUser);

    // Record success & clear backoff
    recordAttempt(dKey, 'auth', true);
    recordAttempt(aKey, 'auth', true);
    resetRateLimit(aKey);

    return {
      id: firebaseUser.uid,
      email: syncResponse.user.email,
      name: syncResponse.user.name,
      role: syncResponse.user.role,
      uid: syncResponse.user.uid,
      clubId: syncResponse.user.clubId,
    };
  } catch (error) {
    // Record failure to increment backoff
    recordAttempt(dKey, 'auth', false);
    recordAttempt(aKey, 'auth', false);
    logError('registerUser', error);
    throw error;
  }
};

/**
 * Log in an existing user and retrieve their profile from the backend.
 *
 * 1. Signs in with Firebase Auth (client-side)
 * 2. Calls GET /api/auth/profile to fetch the MongoDB profile
 * 3. Validates role matches
 *
 * Rate-limited under the **auth** tier (per-device + per-account).
 */
export const loginUser = async (
  email: string,
  password: string,
  role: UserRole
): Promise<User> => {
  // Validate inputs against strict schema — reject invalid data
  validate(loginSchema, { email, password, role });

  const dKey = deviceKey('login');
  const aKey = accountKey(email, 'login');

  // Check both device-level and account-level limits
  assertRateLimit(dKey, 'auth');
  assertRateLimit(aKey, 'auth');

  try {
    // Step 1: Sign in with Firebase Auth
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password.trim());
    const firebaseUser = credential.user;

    // Step 2: Fetch profile from backend
    const profileResponse = await api.get<{ user: User }>('/auth/profile');
    const profile = profileResponse.user;

    // Step 3: Validate role matches
    if (profile.role !== role) {
      await signOut(auth);
      throw new AppError(
        `Role mismatch: profile=${profile.role}, requested=${role}`,
        'Invalid role. Please select the correct login portal.',
      );
    }

    // Record success & clear backoff for this account
    recordAttempt(dKey, 'auth', true);
    recordAttempt(aKey, 'auth', true);
    resetRateLimit(aKey);

    return {
      id: firebaseUser.uid,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      uid: profile.uid,
      clubId: profile.clubId,
    };
  } catch (error) {
    // Record failure to increment backoff
    recordAttempt(dKey, 'auth', false);
    recordAttempt(aKey, 'auth', false);
    logError('loginUser', error);
    throw error;
  }
};

/**
 * Log out the current user.
 */
export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

/**
 * Fetch a user's profile from the backend.
 */
export const getUserProfile = async (userId: string): Promise<User | null> => {
  // Validate userId
  validate(firestoreIdSchema, userId);

  try {
    const response = await api.get<{ user: User }>('/auth/profile');
    return response.user;
  } catch (error: unknown) {
    const status = (error as { statusCode?: number }).statusCode;
    if (status === 404 || status === 403) return null;
    throw error;
  }
};

/**
 * Update a user's profile via the backend.
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<Pick<User, 'name' | 'uid'>>
): Promise<void> => {
  // Validate inputs
  validate(firestoreIdSchema, userId);
  validate(updateProfileSchema, updates);

  await api.put('/auth/profile', updates);
};
