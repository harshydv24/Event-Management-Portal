import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Notification, UserRole } from '@/types';

const COLLECTION = 'notifications';

/**
 * Create a new notification.
 */
export const createNotification = async (
  data: Omit<Notification, 'id' | 'createdAt'>
): Promise<void> => {
  await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
  });
};

/**
 * Get all notifications for a specific user, ordered by newest first.
 */
export const getNotifications = async (userId: string): Promise<Notification[]> => {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      userId: data.userId,
      role: data.role,
      message: data.message,
      relatedEventId: data.relatedEventId,
      isRead: data.isRead ?? false,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as Notification;
  });
};

/**
 * Mark a single notification as read.
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  await updateDoc(doc(db, COLLECTION, notificationId), {
    isRead: true,
  });
};

/**
 * Mark all notifications as read for a given user.
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    where('isRead', '==', false)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.docs.forEach((docSnap) => {
    batch.update(docSnap.ref, { isRead: true });
  });
  await batch.commit();
};

/**
 * Create a notification for a specific user (by their Firebase Auth UID).
 */
export const createNotificationForUser = async (
  userId: string,
  role: UserRole,
  message: string,
  relatedEventId?: string
): Promise<void> => {
  await createNotification({
    userId,
    role,
    message,
    relatedEventId,
    isRead: false,
  });
};

/**
 * Create notifications for all users with a specific role.
 * Fetches users from the 'users' collection, then batch-creates notifications.
 */
export const createNotificationsForRole = async (
  role: UserRole,
  message: string,
  relatedEventId?: string
): Promise<void> => {
  const usersQuery = query(
    collection(db, 'users'),
    where('role', '==', role)
  );
  const usersSnapshot = await getDocs(usersQuery);

  const batch = writeBatch(db);
  usersSnapshot.docs.forEach((userDoc) => {
    const notifRef = doc(collection(db, COLLECTION));
    batch.set(notifRef, {
      userId: userDoc.id,
      role,
      message,
      relatedEventId: relatedEventId || null,
      isRead: false,
      createdAt: serverTimestamp(),
    });
  });

  if (!usersSnapshot.empty) {
    await batch.commit();
  }
};
