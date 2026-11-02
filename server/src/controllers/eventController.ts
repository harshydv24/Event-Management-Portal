import { Request, Response, NextFunction } from 'express';
import Event from '../models/Event.js';
import type { IEventParticipant } from '../models/Event.js';
import { AppError } from '../middlewares/errorHandler.js';
import { randomUUID } from 'crypto';
import {
  emitEventCreated,
  emitEventUpdated,
  emitEventDeleted,
} from '../config/socket.js';

/**
 * POST /api/events
 * Create a new event. Club users only.
 */
export const createEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const eventData = {
      ...req.body,
      participants: [],
      status: 'pending_approval',
    };

    const event = await Event.create(eventData);
    emitEventCreated(event);
    res.status(201).json({ event });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/events
 * Get all events, ordered by newest first.
 */
export const getAllEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { clubId, status } = req.query;
    const filter: Record<string, unknown> = {};

    if (clubId) filter.clubId = clubId;
    if (status) filter.status = status;

    const events = await Event.find(filter).sort({ createdAt: -1 });
    res.json({ events });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/events/:id
 * Get a single event by ID.
 */
export const getEventById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      throw new AppError('Event not found', 'The event you are looking for does not exist.', 404);
    }

    res.json({ event });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/events/:id
 * Update an event. Club can update their own; department can update any.
 */
export const updateEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      throw new AppError('Event not found', 'The event does not exist.', 404);
    }

    // Authorization check: club users can only update their own club's events
    if (req.user!.role === 'club' && event.clubId !== req.user!.clubId) {
      throw new AppError(
        'Unauthorized',
        'You can only update events belonging to your club.',
        403
      );
    }

    const { id, _id, ...updateData } = req.body;
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (updatedEvent) {
      emitEventUpdated(updatedEvent);
    }

    res.json({ event: updatedEvent });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/events/:id/status
 * Update event status (approve, reject, complete).
 * Department can update any; club can update their own.
 */
export const updateEventStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, feedback } = req.body;

    const validStatuses = ['pending_approval', 'approved', 'rejected', 'venue_selected', 'completed'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid status', `Status must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      throw new AppError('Event not found', 'The event does not exist.', 404);
    }

    const updateData: Record<string, unknown> = { status };
    if (feedback !== undefined) {
      updateData.feedback = feedback;
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (updatedEvent) {
      emitEventUpdated(updatedEvent);
    }

    res.json({ event: updatedEvent });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/events/:id/venue
 * Select venue and time for an event. Department only.
 */
export const selectVenue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { venue, time } = req.body;

    if (!venue || !time) {
      throw new AppError('Missing fields', 'Venue and time are required.', 400);
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      throw new AppError('Event not found', 'The event does not exist.', 404);
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: { venue, time, status: 'venue_selected' } },
      { new: true }
    );

    if (updatedEvent) {
      emitEventUpdated(updatedEvent);
    }

    res.json({ event: updatedEvent });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/events/:id/register
 * Register an individual participant for an event.
 */
export const registerForEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      throw new AppError('Event not found', 'The event you are looking for is no longer available.', 404);
    }

    const participant = req.body;

    // Check for duplicate registration
    const alreadyRegistered = event.participants.some(
      (p) => p.studentId === participant.studentId
    );

    if (alreadyRegistered) {
      throw new AppError('Duplicate registration', 'You are already registered for this event.', 409);
    }

    const newParticipant = {
      ...participant,
      id: randomUUID(),
      registeredAt: new Date().toISOString(),
    };

    event.participants.push(newParticipant);
    await event.save();

    emitEventUpdated(event);

    res.status(201).json({ participant: newParticipant });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/events/:id/register-team
 * Register a team (multiple participants) for an event.
 */
export const registerTeamForEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      throw new AppError('Event not found', 'The event you are looking for is no longer available.', 404);
    }

    const { participants } = req.body;

    if (!Array.isArray(participants) || participants.length === 0) {
      throw new AppError('Invalid data', 'Participants array is required.', 400);
    }

    const newParticipants = participants.map((p: Record<string, unknown>) => ({
      ...p,
      id: randomUUID(),
      registeredAt: new Date().toISOString(),
    })) as IEventParticipant[];

    event.participants.push(...newParticipants);
    await event.save();

    emitEventUpdated(event);

    res.status(201).json({ participants: newParticipants });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/events/:id
 * Delete an event. Department or owning club only.
 */
export const deleteEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      throw new AppError('Event not found', 'The event does not exist.', 404);
    }

    // Authorization check
    if (
      req.user!.role === 'club' &&
      event.clubId !== req.user!.clubId
    ) {
      throw new AppError('Unauthorized', 'You can only delete events belonging to your club.', 403);
    }

    await Event.findByIdAndDelete(req.params.id);
    emitEventDeleted(req.params.id as string, event.clubId);

    res.json({ message: 'Event deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
