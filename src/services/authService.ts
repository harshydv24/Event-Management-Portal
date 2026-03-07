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
 */
export const registerUser = async (
  email: string,
  password: string,
  name: string,
  role: UserRole,
  universityId?: string
): Promise<User> => {
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

  return {
    id: firebaseUser.uid,
    email: email.trim(),
    name: name.trim(),
    role,
    uid: role === 'student' ? universityId?.trim() : undefined,
    clubId: profileData.clubId as string | undefined,
  };
};

/**
 * Log in an existing user and retrieve their Firestore profile.
 */
export const loginUser = async (
  email: string,
  password: string,
  role: UserRole
): Promise<User> => {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password.trim());
  const firebaseUser = credential.user;

  const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

  if (!profileDoc.exists()) {
    throw new Error('User profile not found in database.');
  }

  const profile = profileDoc.data() as FirebaseUserProfile;

  if (profile.role !== role) {
    await signOut(auth);
    throw new Error(`This account is registered as "${profile.role}", not "${role}".`);
  }

  return {
    id: firebaseUser.uid,
    email: profile.email,
    name: profile.name,
    role: profile.role,
    uid: profile.uid,
    clubId: profile.clubId,
  };
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
  await updateDoc(doc(db, 'users', userId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};
