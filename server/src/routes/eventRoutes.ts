import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.js';
import { requireRole, requireProfile } from '../middlewares/rbac.js';
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  updateEventStatus,
  selectVenue,
  registerForEvent,
  registerTeamForEvent,
  deleteEvent,
} from '../controllers/eventController.js';

const router = Router();

// GET /api/events — List all events (any authenticated user)
router.get('/', verifyToken, requireProfile, getAllEvents);

// GET /api/events/:id — Get a single event
router.get('/:id', verifyToken, requireProfile, getEventById);

// POST /api/events — Create event (club only)
router.post('/', verifyToken, requireProfile, requireRole('club'), createEvent);

// PUT /api/events/:id — Update event (club or department)
router.put('/:id', verifyToken, requireProfile, requireRole('club', 'department'), updateEvent);

// PUT /api/events/:id/status — Update event status (department or club)
router.put('/:id/status', verifyToken, requireProfile, requireRole('department', 'club'), updateEventStatus);

// PUT /api/events/:id/venue — Select venue (department only)
router.put('/:id/venue', verifyToken, requireProfile, requireRole('department'), selectVenue);

// POST /api/events/:id/register — Register individual participant (any authenticated)
router.post('/:id/register', verifyToken, requireProfile, registerForEvent);

// POST /api/events/:id/register-team — Register a team (any authenticated)
router.post('/:id/register-team', verifyToken, requireProfile, registerTeamForEvent);

// DELETE /api/events/:id — Delete event (department or owning club)
router.delete('/:id', verifyToken, requireProfile, requireRole('department', 'club'), deleteEvent);

export default router;
