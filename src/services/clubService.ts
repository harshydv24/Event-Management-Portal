import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Club } from '@/types';
import { withRateLimit, deviceKey } from '@/lib/rateLimiter';
import {
  validate,
  createClubSchema,
  updateClubSchema,
  firestoreIdSchema,
} from '@/lib/validationSchemas';

const COLLECTION = 'clubs';

/**
 * Create a new club in Firestore.
 *
 * Rate-limited under the **authenticated** tier.
 */
export const createClub = async (
  club: Omit<Club, 'id' | 'createdAt' | 'eventsCount'>
): Promise<Club> => {
  return withRateLimit(deviceKey('createClub'), 'authenticated', async () => {
    // Validate the full club object against strict schema
    validate(createClubSchema, club);

    const docData = {
      ...club,
      eventsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTION), docData);

    return {
      ...club,
      id: docRef.id,
      eventsCount: 0,
      createdAt: new Date().toISOString(),
    };
  });
};

/**
 * Create a club with a specific ID (used when linking to user's clubId).
 *
 * Rate-limited under the **authenticated** tier.
 */
export const createClubWithId = async (
  clubId: string,
  club: Omit<Club, 'id' | 'createdAt' | 'eventsCount'>
): Promise<Club> => {
  // Validate inputs
  validate(firestoreIdSchema, clubId);

  return withRateLimit(deviceKey('createClubWithId'), 'authenticated', async () => {
    // Validate the full club object against strict schema
    validate(createClubSchema, club);

    const docData = {
      ...club,
      eventsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, COLLECTION, clubId), docData);

    return {
      ...club,
      id: clubId,
      eventsCount: 0,
      createdAt: new Date().toISOString(),
    };
  });
};

/**
 * Get all clubs from Firestore.
 *
 * Rate-limited under the **public** tier.
 */
export const getAllClubs = async (): Promise<Club[]> => {
  return withRateLimit(deviceKey('getAllClubs'), 'public', async () => {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        description: data.description,
        logo: data.logo,
        facultyAdvisor: data.facultyAdvisor,
        president: data.president,
        coreTeam: data.coreTeam || [],
        eventsCount: data.eventsCount || 0,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as Club;
    });
  });
};

/**
 * Get a single club's details.
 *
 * Rate-limited under the **public** tier.
 */
export const getClubDetails = async (clubId: string): Promise<Club | null> => {
  // Validate clubId
  validate(firestoreIdSchema, clubId);

  return withRateLimit(deviceKey('getClubDetails'), 'public', async () => {
    const docSnap = await getDoc(doc(db, COLLECTION, clubId));

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name,
      description: data.description,
      logo: data.logo,
      facultyAdvisor: data.facultyAdvisor,
      president: data.president,
      coreTeam: data.coreTeam || [],
      eventsCount: data.eventsCount || 0,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as Club;
  });
};

/**
 * Update an existing club.
 *
 * Rate-limited under the **authenticated** tier.
 */
export const updateClub = async (
  clubId: string,
  updates: Partial<Club>
): Promise<void> => {
  // Validate inputs
  validate(firestoreIdSchema, clubId);
  validate(updateClubSchema, updates);

  return withRateLimit(deviceKey('updateClub'), 'authenticated', async () => {
    const { id, ...updateData } = updates as Club & { id?: string };
    await updateDoc(doc(db, COLLECTION, clubId), {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  });
};

/**
 * Delete a club.
 *
 * Rate-limited under the **authenticated** tier.
 */
export const deleteClub = async (clubId: string): Promise<void> => {
  // Validate clubId
  validate(firestoreIdSchema, clubId);

  return withRateLimit(deviceKey('deleteClub'), 'authenticated', async () => {
    await deleteDoc(doc(db, COLLECTION, clubId));
  });
};
