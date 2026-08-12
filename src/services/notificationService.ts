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
import { withRateLimit, deviceKey } from '@/lib/rateLimiter';
import {
  validate,
  createNotificationSchema,
  notificationForUserSchema,
  notificationsForRoleSchema,
  firestoreIdSchema,
} from '@/lib/validationSchemas';

const COLLECTION = 'notifications';

/**
 * Create a new notification.
 *
 * Rate-limited under the **authenticated** tier.
 */
export const createNotification = async (
  data: Omit<Notification, 'id' | 'createdAt'>
): Promise<void> => {
  return withRateLimit(deviceKey('createNotification'), 'authenticated', async () => {
    // Validate the full notification object
    validate(createNotificationSchema, data);

    await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: serverTimestamp(),
    });
  });
};

/**
 * Get all notifications for a specific user, ordered by newest first.
 *
 * Rate-limited under the **authenticated** tier (user-scoped data).
 */
export const getNotifications = async (userId: string): Promise<Notification[]> => {
  // Validate userId
  validate(firestoreIdSchema, userId);

  return withRateLimit(deviceKey('getNotifications'), 'authenticated', async () => {
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
  });
};

/**
 * Mark a single notification as read.
 *
 * Rate-limited under the **authenticated** tier.
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  // Validate notificationId
  validate(firestoreIdSchema, notificationId);

  return withRateLimit(deviceKey('markNotificationAsRead'), 'authenticated', async () => {
    await updateDoc(doc(db, COLLECTION, notificationId), {
      isRead: true,
    });
  });
};

/**
 * Mark all notifications as read for a given user.
 *
 * Rate-limited under the **authenticated** tier.
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  // Validate userId
  validate(firestoreIdSchema, userId);

  return withRateLimit(deviceKey('markAllNotificationsAsRead'), 'authenticated', async () => {
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
  });
};

/**
 * Create a notification for a specific user (by their Firebase Auth UID).
 *
 * Rate-limited under the **authenticated** tier.
 */
export const createNotificationForUser = async (
  userId: string,
  role: UserRole,
  message: string,
  relatedEventId?: string
): Promise<void> => {
  // Validate inputs
  validate(notificationForUserSchema, { userId, role, message, relatedEventId });

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
 *
 * Rate-limited under the **authenticated** tier.
 */
export const createNotificationsForRole = async (
  role: UserRole,
  message: string,
  relatedEventId?: string
): Promise<void> => {
  // Validate inputs
  validate(notificationsForRoleSchema, { role, message, relatedEventId });

  return withRateLimit(deviceKey('createNotificationsForRole'), 'authenticated', async () => {
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
  });
};
