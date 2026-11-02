import { Request, Response, NextFunction } from 'express';
import Announcement from '../models/Announcement.js';
import { AppError } from '../middlewares/errorHandler.js';
import { emitAnnouncementCreated } from '../config/socket.js';

/**
 * POST /api/announcements
 * Post a new announcement. Club or department users only.
 */
export const createAnnouncement = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const announcement = await Announcement.create(req.body);
    emitAnnouncementCreated(announcement);
    res.status(201).json({ announcement });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/announcements
 * Fetch all announcements, optionally filtered by clubId.
 */
export const getAnnouncements = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { clubId } = req.query;
    const filter: Record<string, unknown> = {};

    if (clubId) {
      filter.clubId = clubId;
    }

    const announcements = await Announcement.find(filter).sort({ createdAt: -1 });
    res.json({ announcements });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/announcements/:id
 * Delete an announcement. Author or department only.
 */
export const deleteAnnouncement = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      throw new AppError('Not found', 'Announcement not found.', 404);
    }

    // Authorization: only the author or department can delete
    if (
      req.user!.role !== 'department' &&
      announcement.authorId !== req.user!._id
    ) {
      throw new AppError('Unauthorized', 'You can only delete your own announcements.', 403);
    }

    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Announcement deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
