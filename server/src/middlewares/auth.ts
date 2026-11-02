import { Request, Response, NextFunction } from 'express';
import admin from '../config/firebaseAdmin.js';
import User, { IUser } from '../models/User.js';

// Extend the Express Request type to include our user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      firebaseUid?: string;
    }
  }
}

/**
 * Authentication middleware that verifies Firebase ID tokens.
 * 
 * Extracts the Bearer token from the Authorization header,
 * verifies it using Firebase Admin SDK, and attaches the
 * user's MongoDB profile to `req.user`.
 */
export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header. Expected: Bearer <token>',
      });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];

    if (!idToken) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided.',
      });
      return;
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.firebaseUid = decodedToken.uid;

    // Fetch the user profile from MongoDB
    const user = await User.findById(decodedToken.uid);

    if (!user) {
      // User has a valid Firebase token but no profile in our DB yet
      // This can happen during signup flow — allow the request through
      // but without req.user set. Controllers can handle this case.
      req.firebaseUid = decodedToken.uid;
      next();
      return;
    }

    req.user = user;
    next();
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Token verification failed:', errMessage);

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token.',
    });
  }
};

/**
 * Optional auth middleware — does not fail if no token is present,
 * but attaches user if token is valid. Useful for public routes
 * that show extra data for logged-in users.
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
      next();
      return;
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.firebaseUid = decodedToken.uid;

    const user = await User.findById(decodedToken.uid);
    if (user) {
      req.user = user;
    }

    next();
  } catch {
    // Token invalid — proceed without user, since auth is optional
    next();
  }
};
