import { Request, Response, NextFunction } from 'express';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { AppError } from '../middlewares/errorHandler.js';
import type { UserRole } from '../models/User.js';
import {
  emitNotificationForUser,
  emitNotificationForRole,
  emitNotificationForClub,
} from '../config/socket.js';

/**
 * POST /api/notifications
 * Create a notification for a specific user.
 */
export const createNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, role, message, relatedEventId } = req.body;

    if (!userId || !role || !message) {
      throw new AppError('Missing fields', 'userId, role, and message are required.', 400);
    }

    const notification = await Notification.create({
      userId,
      role,
      message,
      relatedEventId: relatedEventId || null,
      isRead: false,
    });

    emitNotificationForUser(userId, notification);

    res.status(201).json({ notification });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/notifications/broadcast
 * Create notifications for all users with a specific role and/or clubId.
 */
export const broadcastNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { role, clubId, message, relatedEventId } = req.body as {
      role?: UserRole;
      clubId?: string;
      message: string;
      relatedEventId?: string;
    };

    if (!message || (!role && !clubId)) {
      throw new AppError('Missing fields', 'Message and either role or clubId are required.', 400);
    }

    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;
    if (clubId) filter.clubId = clubId;

    // Find all users matching the criteria
    const users = await User.find(filter);

    if (users.length === 0) {
      res.json({ message: 'No users found matching criteria.', count: 0 });
      return;
    }

    // Bulk insert notifications
    const notifications = users.map((user) => ({
      userId: user._id,
      role: user.role,
      message,
      relatedEventId: relatedEventId || null,
      isRead: false,
    }));

    await Notification.insertMany(notifications);

    if (clubId) {
      emitNotificationForClub(clubId, { role, clubId, message, relatedEventId });
    }
    if (role) {
      emitNotificationForRole(role, { role, message, relatedEventId });
    }
    // Also notify each user's direct socket room
    for (const u of users) {
      emitNotificationForUser(u._id, { role: u.role, message, relatedEventId });
    }

    res.status(201).json({
      message: `Notifications sent to ${users.length} user(s).`,
      count: users.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications
 * Get all notifications for the authenticated user.
 */
export const getMyNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const notifications = await Notification.find({ userId: req.user!._id })
      .sort({ createdAt: -1 });

    res.json({ notifications });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read.
 */
export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      throw new AppError('Not found', 'Notification not found.', 404);
    }

    // Users can only mark their own notifications
    if (notification.userId !== req.user!._id) {
      throw new AppError('Unauthorized', 'You can only modify your own notifications.', 403);
    }

    notification.isRead = true;
    await notification.save();

    res.json({ notification });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/notifications/read-all
 * Mark all of the authenticated user's notifications as read.
 */
export const markAllAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user!._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({
      message: 'All notifications marked as read.',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};
