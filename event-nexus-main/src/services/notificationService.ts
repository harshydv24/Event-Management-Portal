import api from '@/api/client';
import { Notification, UserRole } from '@/types';

/**
 * Create a new notification.
 */
export const createNotification = async (
  data: Omit<Notification, 'id' | 'createdAt'>
): Promise<void> => {
  await api.post('/notifications', data);
};

/**
 * Get all notifications for the current user.
 */
export const getNotifications = async (_userId: string): Promise<Notification[]> => {
  // userId is no longer needed — the backend derives it from the auth token
  const response = await api.get<{ notifications: Notification[] }>('/notifications');
  return response.notifications;
};

/**
 * Mark a single notification as read.
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  await api.put(`/notifications/${notificationId}/read`);
};

/**
 * Mark all notifications as read for the current user.
 */
export const markAllNotificationsAsRead = async (_userId: string): Promise<void> => {
  // userId is no longer needed — the backend derives it from the auth token
  await api.put('/notifications/read-all');
};

/**
 * Create a notification for a specific user.
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
 */
export const createNotificationsForRole = async (
  role: UserRole,
  message: string,
  relatedEventId?: string
): Promise<void> => {
  await api.post('/notifications/broadcast', { role, message, relatedEventId });
};

/**
 * Create notifications for all users belonging to a specific club.
 */
export const notifyClub = async (
  clubId: string,
  message: string,
  relatedEventId?: string
): Promise<void> => {
  await api.post('/notifications/broadcast', { clubId, message, relatedEventId });
};

