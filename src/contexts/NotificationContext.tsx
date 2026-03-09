import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/config/firebase';
import * as notificationService from '@/services/notificationService';
import { Notification } from '@/types';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Real-time listener for notifications
  useEffect(() => {
    let unsubNotifications: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubNotifications) {
        unsubNotifications();
        unsubNotifications = null;
      }

      if (!firebaseUser) {
        setNotifications([]);
        setIsLoading(false);
        return;
      }

      const notifQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', firebaseUser.uid),
        orderBy('createdAt', 'desc')
      );

      unsubNotifications = onSnapshot(
        notifQuery,
        (snapshot) => {
          const notifData = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              userId: data.userId,
              role: data.role,
              message: data.message,
              relatedEventId: data.relatedEventId || undefined,
              isRead: data.isRead ?? false,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            } as Notification;
          });
          setNotifications(notifData);
          setIsLoading(false);
        },
        (error) => {
          console.error('Error listening to notifications:', error);
          setIsLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubNotifications) unsubNotifications();
    };
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    await notificationService.markNotificationAsRead(notificationId);
  }, []);

  const markAllAsRead = useCallback(async () => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      await notificationService.markAllNotificationsAsRead(userId);
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
