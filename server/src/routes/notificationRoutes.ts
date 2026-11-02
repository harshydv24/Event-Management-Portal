import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.js';
import { requireProfile } from '../middlewares/rbac.js';
import {
  createNotification,
  broadcastNotifications,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notificationController.js';

const router = Router();

// GET /api/notifications — Get current user's notifications
router.get('/', verifyToken, requireProfile, getMyNotifications);

// POST /api/notifications — Create a notification for a user
router.post('/', verifyToken, requireProfile, createNotification);

// POST /api/notifications/broadcast — Broadcast to all users with a role
router.post('/broadcast', verifyToken, requireProfile, broadcastNotifications);

// PUT /api/notifications/read-all — Mark all notifications as read
router.put('/read-all', verifyToken, requireProfile, markAllAsRead);

// PUT /api/notifications/:id/read — Mark a single notification as read
router.put('/:id/read', verifyToken, requireProfile, markAsRead);

export default router;
