import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
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
 * Register a new user with Firebase Auth and create a Firestore profile.
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
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
    const firebaseUser = credential.user;

    await updateProfile(firebaseUser, { displayName: name.trim() });

    // Build profile data — Firestore does NOT accept undefined values
    const profileData: Record<string, unknown> = {
      email: email.trim(),
      name: name.trim(),
      role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Only add fields that have values (Firestore rejects undefined)
    if (role === 'student' && universityId?.trim()) {
      profileData.uid = universityId.trim();
    }
    if (role === 'club') {
      profileData.clubId = crypto.randomUUID();
    }

    await setDoc(doc(db, 'users', firebaseUser.uid), profileData);

    // Send email verification
    await sendEmailVerification(firebaseUser);

    // Record success & clear backoff
    recordAttempt(dKey, 'auth', true);
    recordAttempt(aKey, 'auth', true);
    resetRateLimit(aKey);

    return {
      id: firebaseUser.uid,
      email: email.trim(),
      name: name.trim(),
      role,
      uid: role === 'student' ? universityId?.trim() : undefined,
      clubId: profileData.clubId as string | undefined,
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
 * Log in an existing user and retrieve their Firestore profile.
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
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password.trim());
    const firebaseUser = credential.user;

    const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

    if (!profileDoc.exists()) {
      throw new AppError(
        'User profile not found in database.',
        'Unable to find your account. Please contact support.',
      );
    }

    const profile = profileDoc.data() as FirebaseUserProfile;

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
 * Fetch a user's profile from Firestore.
 */
export const getUserProfile = async (userId: string): Promise<User | null> => {
  // Validate userId
  validate(firestoreIdSchema, userId);

  const profileDoc = await getDoc(doc(db, 'users', userId));

  if (!profileDoc.exists()) return null;

  const profile = profileDoc.data() as FirebaseUserProfile;
  return {
    id: userId,
    email: profile.email,
    name: profile.name,
    role: profile.role,
    uid: profile.uid,
    clubId: profile.clubId,
  };
};

/**
 * Update a user's profile in Firestore.
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<Pick<User, 'name' | 'uid'>>
): Promise<void> => {
  // Validate inputs
  validate(firestoreIdSchema, userId);
  validate(updateProfileSchema, updates);

  await updateDoc(doc(db, 'users', userId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};
