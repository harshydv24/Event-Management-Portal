import { Request, Response, NextFunction } from 'express';
import Club from '../models/Club.js';
import { AppError } from '../middlewares/errorHandler.js';
import { emitClubUpdated } from '../config/socket.js';

/**
 * POST /api/clubs
 * Create a new club. Department or club users only.
 */
export const createClub = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const clubData = {
      ...req.body,
      eventsCount: 0,
    };

    const club = await Club.create(clubData);
    emitClubUpdated(club);
    res.status(201).json({ club });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/clubs/:id
 * Create a club with a specific ID (used when linking to user's clubId).
 */
export const createClubWithId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const clubId = req.params.id;

    // Check if club already exists
    const existing = await Club.findById(clubId);
    if (existing) {
      throw new AppError('Club exists', 'A club with this ID already exists.', 409);
    }

    const clubData = {
      _id: clubId,
      ...req.body,
      eventsCount: 0,
    };

    const club = await Club.create(clubData);
    emitClubUpdated(club);
    res.status(201).json({ club });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/clubs
 * Get all clubs, ordered by newest first.
 */
export const getAllClubs = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const clubs = await Club.find().sort({ createdAt: -1 });
    res.json({ clubs });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/clubs/:id
 * Get a single club's details.
 */
export const getClubById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      throw new AppError('Club not found', 'The club does not exist.', 404);
    }

    res.json({ club });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/clubs/:id
 * Update a club. Department can update any; club users can update their own.
 */
export const updateClub = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      throw new AppError('Club not found', 'The club does not exist.', 404);
    }

    // Authorization: club users can only update their own club
    if (req.user!.role === 'club' && req.user!.clubId !== req.params.id) {
      throw new AppError('Unauthorized', 'You can only update your own club.', 403);
    }

    const { id, _id, ...updateData } = req.body;
    const updatedClub = await Club.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (updatedClub) {
      emitClubUpdated(updatedClub);
    }

    res.json({ club: updatedClub });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/clubs/:id
 * Delete a club. Department only.
 */
export const deleteClub = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      throw new AppError('Club not found', 'The club does not exist.', 404);
    }

    await Club.findByIdAndDelete(req.params.id);
    res.json({ message: 'Club deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
