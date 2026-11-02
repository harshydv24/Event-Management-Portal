import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.js';
import { requireRole, requireProfile } from '../middlewares/rbac.js';
import {
  syncProfile,
  getProfile,
  updateProfile,
  getAllUsers,
} from '../controllers/authController.js';

const router = Router();

// POST /api/auth/sync — Create profile in MongoDB after Firebase Auth signup
router.post('/sync', verifyToken, syncProfile);

// GET /api/auth/profile — Get current user's profile
router.get('/profile', verifyToken, requireProfile, getProfile);

// PUT /api/auth/profile — Update current user's profile
router.put('/profile', verifyToken, requireProfile, updateProfile);

// GET /api/auth/users — Get all users (department only)
router.get('/users', verifyToken, requireProfile, requireRole('department'), getAllUsers);

export default router;
