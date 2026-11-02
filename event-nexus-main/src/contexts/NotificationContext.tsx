import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';
import * as notificationService from '@/services/notificationService';
import socketService from '@/services/socketService';
import { Notification } from '@/types';
import { logError } from '@/lib/errorUtils';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  /**
   * Fetch notifications from the backend API.
   * Replaces the Firestore onSnapshot real-time listener.
   */
  const fetchNotifications = useCallback(async (userId: string) => {
    try {
      const data = await notificationService.getNotifications(userId);
      setNotifications(data);
    } catch (error) {
      logError('NotificationContext:fetchNotifications', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for auth state changes and fetch notifications
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        setNotifications([]);
        setCurrentUserId(null);
        setIsLoading(false);
        return;
      }

      setCurrentUserId(firebaseUser.uid);
      fetchNotifications(firebaseUser.uid);
    });

    // Real-time notification listener via WebSocket
    const unsubSocket = socketService.onNotification(() => {
      if (currentUserId) {
        fetchNotifications(currentUserId);
      }
    });

    return () => {
      unsubAuth();
      unsubSocket();
    };
  }, [currentUserId, fetchNotifications]);

  // Background fallback poll (every 60s as a safety net in case of network drops)
  useEffect(() => {
    if (!currentUserId) return;

    const intervalId = setInterval(() => {
      fetchNotifications(currentUserId);
    }, 60000);

    return () => clearInterval(intervalId);
  }, [currentUserId, fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await notificationService.markNotificationAsRead(notificationId);
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (currentUserId) {
      await notificationService.markAllNotificationsAsRead(currentUserId);
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  }, [currentUserId]);

  const refreshNotifications = useCallback(async () => {
    if (currentUserId) {
      await fetchNotifications(currentUserId);
    }
  }, [currentUserId, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
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
