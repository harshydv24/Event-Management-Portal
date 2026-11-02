import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.js';
import { requireRole, requireProfile } from '../middlewares/rbac.js';
import {
  createClub,
  createClubWithId,
  getAllClubs,
  getClubById,
  updateClub,
  deleteClub,
} from '../controllers/clubController.js';

const router = Router();

// GET /api/clubs — List all clubs (any authenticated user)
router.get('/', verifyToken, requireProfile, getAllClubs);

// GET /api/clubs/:id — Get a single club
router.get('/:id', verifyToken, requireProfile, getClubById);

// POST /api/clubs — Create a new club (department or club users)
router.post('/', verifyToken, requireProfile, requireRole('department', 'club'), createClub);

// POST /api/clubs/:id — Create a club with a specific ID (department or club)
router.post('/:id', verifyToken, requireProfile, requireRole('department', 'club'), createClubWithId);

// PUT /api/clubs/:id — Update a club (department or owning club)
router.put('/:id', verifyToken, requireProfile, requireRole('department', 'club'), updateClub);

// DELETE /api/clubs/:id — Delete a club (department only)
router.delete('/:id', verifyToken, requireProfile, requireRole('department'), deleteClub);

export default router;
