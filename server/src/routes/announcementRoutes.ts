import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.js';
import { requireRole, requireProfile } from '../middlewares/rbac.js';
import {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
} from '../controllers/announcementController.js';

const router = Router();

// GET /api/announcements — List announcements (any authenticated user)
router.get('/', verifyToken, requireProfile, getAnnouncements);

// POST /api/announcements — Create announcement (club or department)
router.post('/', verifyToken, requireProfile, requireRole('club', 'department'), createAnnouncement);

// DELETE /api/announcements/:id — Delete announcement (author or department)
router.delete('/:id', verifyToken, requireProfile, requireRole('club', 'department'), deleteAnnouncement);

export default router;
