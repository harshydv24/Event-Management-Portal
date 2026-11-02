import { Request, Response, NextFunction } from 'express';
import type { UserRole } from '../models/User.js';

/**
 * Role-Based Access Control middleware.
 * 
 * Checks that `req.user` exists and has one of the allowed roles.
 * Must be used AFTER the `verifyToken` middleware.
 * 
 * @param allowedRoles - Array of roles permitted to access the route
 * 
 * @example
 * router.post('/events', verifyToken, requireRole('club'), createEvent);
 * router.put('/events/:id/status', verifyToken, requireRole('department', 'club'), updateEventStatus);
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}.`,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware that ensures req.user exists (profile is in DB).
 * Use after verifyToken when a profile must exist.
 */
export const requireProfile = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(404).json({
      error: 'Not Found',
      message: 'User profile not found. Please complete registration.',
    });
    return;
  }
  next();
};
