/**
 * Centralized error utilities for safe error handling.
 *
 * - `AppError`              — custom error that separates internal detail from a user-safe message.
 * - `sanitizeErrorMessage`  — extracts a user-safe string from *any* caught error.
 * - `logError`              — logs full error details for debugging (swap to a service like Sentry later).
 */

// ---------------------------------------------------------------------------
// AppError
// ---------------------------------------------------------------------------

/**
 * Application-level error that carries both an internal message (for logs)
 * and a separate user-facing message that is safe to display in the UI.
 */
export class AppError extends Error {
  /** Message that is safe to show to the end-user. */
  readonly userMessage: string;

  constructor(internalMessage: string, userMessage: string) {
    super(internalMessage);
    this.name = 'AppError';
    this.userMessage = userMessage;
  }
}

// ---------------------------------------------------------------------------
// Firebase error-code → friendly message map
// ---------------------------------------------------------------------------

const FIREBASE_ERROR_MAP: Record<string, string> = {
  'auth/email-already-in-use': 'An account with this email already exists. Try logging in instead.',
  'auth/weak-password': 'Password must be at least 6 characters long.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Invalid credentials. Please check your email and password.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Please check your internet connection.',
  'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
  'auth/requires-recent-login': 'Please log in again to complete this action.',
  'permission-denied': 'You do not have permission to perform this action.',
  'unavailable': 'The service is temporarily unavailable. Please try again later.',
  'not-found': 'The requested resource was not found.',
  'already-exists': 'This resource already exists.',
  'resource-exhausted': 'Too many requests. Please wait a moment and try again.',
  'deadline-exceeded': 'The request took too long. Please try again.',
};

/**
 * Known safe messages that can be forwarded to the user as-is.
 * These are messages we throw intentionally in service code.
 */
const KNOWN_SAFE_MESSAGES: string[] = [
  'The event you are looking for is no longer available.',
  'You are already registered for this event.',
  'Unable to find your account. Please contact support.',
  'Invalid role. Please select the correct login portal.',
];

// ---------------------------------------------------------------------------
// sanitizeErrorMessage
// ---------------------------------------------------------------------------

/**
 * Extract a user-safe error message from any caught value.
 *
 * Resolution order:
 * 1. `AppError.userMessage`
 * 2. `RateLimitError.message` / `ValidationError.message` (known safe types)
 * 3. Firebase error code lookup
 * 4. Known safe message match
 * 5. Fallback generic string
 */
export function sanitizeErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (!error) return fallback;

  // 1. Our own AppError — always has a safe userMessage
  if (error instanceof AppError) {
    return error.userMessage;
  }

  // 2. Known library error types that produce safe messages
  //    (RateLimitError / ValidationError — checked by name to avoid circular imports)
  if (error instanceof Error) {
    if (error.name === 'RateLimitError' || error.name === 'ValidationError') {
      return error.message;
    }
  }

  // 3. Firebase error codes
  const firebaseCode = (error as { code?: string }).code;
  if (firebaseCode && FIREBASE_ERROR_MAP[firebaseCode]) {
    return FIREBASE_ERROR_MAP[firebaseCode];
  }

  // 4. Known safe messages we've explicitly authored
  if (error instanceof Error && KNOWN_SAFE_MESSAGES.includes(error.message)) {
    return error.message;
  }

  // 5. Fallback — never leak the raw message
  return fallback;
}

// ---------------------------------------------------------------------------
// logError
// ---------------------------------------------------------------------------

/**
 * Log full error details for developer debugging.
 *
 * In development: logs to `console.error`.
 * In production: this is the single place to swap in Sentry / Datadog / etc.
 *
 * @param context  A short label describing where the error occurred (e.g. "loginUser").
 * @param error    The raw error value.
 */
export function logError(context: string, error: unknown): void {
  // Always log full details — this is never shown to users
  console.error(`[${context}]`, error);
}
