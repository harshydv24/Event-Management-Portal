import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  clubId: string;
  clubName: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

const COLLECTION = 'announcements';

/**
 * Post a new announcement.
 */
export const postAnnouncement = async (
  announcement: Omit<Announcement, 'id' | 'createdAt'>
): Promise<Announcement> => {
  if (!announcement.title?.trim()) throw new Error('Announcement title is required');
  if (!announcement.content?.trim()) throw new Error('Announcement content is required');

  const docData = {
    ...announcement,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, COLLECTION), docData);

  return {
    ...announcement,
    id: docRef.id,
    createdAt: new Date().toISOString(),
  };
};

/**
 * Fetch all announcements, optionally filtered by club.
 */
export const fetchAnnouncements = async (clubId?: string): Promise<Announcement[]> => {
  let q;

  if (clubId) {
    q = query(
      collection(db, COLLECTION),
      where('clubId', '==', clubId),
      orderBy('createdAt', 'desc')
    );
  } else {
    q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  }

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as Record<string, unknown>;
    const createdAtField = data.createdAt as { toDate?: () => Date } | undefined;
    return {
      id: docSnap.id,
      title: data.title as string,
      content: data.content as string,
      clubId: data.clubId as string,
      clubName: data.clubName as string,
      authorId: data.authorId as string,
      authorName: data.authorName as string,
      createdAt: createdAtField?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as Announcement;
  });
};
