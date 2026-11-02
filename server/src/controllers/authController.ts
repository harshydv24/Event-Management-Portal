import { Request, Response, NextFunction } from 'express';
import User from '../models/User.js';
import { AppError } from '../middlewares/errorHandler.js';
import { randomUUID } from 'crypto';

/**
 * POST /api/auth/sync
 * 
 * Called after Firebase Auth signup to create the user profile in MongoDB.
 * The frontend signs up with Firebase Auth, then immediately calls this
 * endpoint to persist the user profile.
 */
export const syncProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const firebaseUid = req.firebaseUid;

    if (!firebaseUid) {
      throw new AppError('No Firebase UID', 'Authentication required.', 401);
    }

    const { email, name, role, universityId } = req.body;

    // Validate required fields
    if (!email || !name || !role) {
      throw new AppError(
        'Missing fields',
        'Email, name, and role are required.',
        400
      );
    }

    if (!['student', 'club', 'department'].includes(role)) {
      throw new AppError('Invalid role', 'Role must be student, club, or department.', 400);
    }

    // Check if user already exists
    const existingUser = await User.findById(firebaseUid);
    if (existingUser) {
      // Return the existing profile (idempotent)
      res.status(200).json({ user: existingUser });
      return;
    }

    // Build profile data
    const profileData: Record<string, unknown> = {
      _id: firebaseUid,
      email: email.trim(),
      name: name.trim(),
      role,
    };

    if (role === 'student' && universityId?.trim()) {
      profileData.uid = universityId.trim();
    }

    if (role === 'club') {
      profileData.clubId = randomUUID();
    }

    const user = await User.create(profileData);

    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/profile
 * 
 * Get the current user's profile from MongoDB.
 */
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Profile not found', 'User profile not found.', 404);
    }

    res.json({ user: req.user });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/auth/profile
 * 
 * Update the current user's profile.
 * Users can only update their own name and university ID.
 */
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Profile not found', 'User profile not found.', 404);
    }

    const { name, uid } = req.body;
    const updates: Record<string, unknown> = {};

    if (name !== undefined) {
      updates.name = name.trim();
    }

    if (uid !== undefined && req.user.role === 'student') {
      updates.uid = uid.trim();
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/users (Department only)
 * 
 * Get all users. Only accessible by department role.
 */
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { role } = req.query;

    const filter: Record<string, unknown> = {};
    if (role && ['student', 'club', 'department'].includes(role as string)) {
      filter.role = role;
    }

    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    next(error);
  }
};
