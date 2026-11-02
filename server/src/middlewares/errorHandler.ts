import { Request, Response, NextFunction } from 'express';

/**
 * Centralized error handling middleware.
 * Must be registered LAST in the Express middleware chain.
 */
export const errorHandler = (
  err: Error & { statusCode?: number; userMessage?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.userMessage || err.message || 'Internal Server Error';

  console.error(`[ERROR] ${statusCode} - ${err.message}`);
  if (statusCode === 500) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    error: statusCode >= 500 ? 'Internal Server Error' : 'Request Error',
    message,
  });
};

/**
 * Custom application error class with user-facing message support.
 */
export class AppError extends Error {
  statusCode: number;
  userMessage: string;

  constructor(message: string, userMessage: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.userMessage = userMessage;
    this.name = 'AppError';
  }
}
