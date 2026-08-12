/**
 * Rate Limiting Configuration
 *
 * All thresholds are configurable via VITE_RL_* environment variables.
 * If not set, sensible defaults are used. See .env.example for full list.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BackoffConfig {
  /** Whether exponential backoff is enabled for this tier. */
  enabled: boolean;
  /** Initial delay in milliseconds after the first failure. */
  baseDelayMs: number;
  /** Maximum delay cap in milliseconds. */
  maxDelayMs: number;
  /** Multiplier applied to the delay on each consecutive failure. */
  multiplier: number;
}

export interface RateLimitTierConfig {
  /** Maximum number of attempts allowed within the window. */
  maxAttempts: number;
  /** Rolling time window in milliseconds. */
  windowMs: number;
  /** Optional exponential backoff settings (auth tier only). */
  backoff?: BackoffConfig;
  /** Track limits per account (email) in addition to per-device. Auth tier only. */
  perAccount?: boolean;
}

export type RateLimitTier = 'auth' | 'public' | 'authenticated' | 'resendEmail';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read an env var as a number, returning the fallback when missing or NaN. */
const envNum = (key: string, fallback: number): number => {
  const raw = import.meta.env[key];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? fallback : parsed;
};

// ---------------------------------------------------------------------------
// Tier configurations
// ---------------------------------------------------------------------------

/**
 * **Auth tier** — strictest.
 *
 * Applies to login, signup, and password-reset operations.
 * Uses per-device AND per-account limits with exponential backoff on failures.
 */
export const AUTH_RATE_LIMIT: RateLimitTierConfig = {
  maxAttempts: envNum('VITE_RL_AUTH_MAX_ATTEMPTS', 5),
  windowMs: envNum('VITE_RL_AUTH_WINDOW_MS', 15 * 60 * 1000), // 15 minutes
  perAccount: true,
  backoff: {
    enabled: true,
    baseDelayMs: envNum('VITE_RL_AUTH_BACKOFF_BASE_MS', 2_000),
    maxDelayMs: envNum('VITE_RL_AUTH_BACKOFF_MAX_MS', 5 * 60 * 1000), // 5 minutes
    multiplier: envNum('VITE_RL_AUTH_BACKOFF_MULTIPLIER', 2),
  },
};

/**
 * **Public tier** — moderate.
 *
 * Applies to unauthenticated read operations (fetching events, clubs, etc.).
 */
export const PUBLIC_RATE_LIMIT: RateLimitTierConfig = {
  maxAttempts: envNum('VITE_RL_PUBLIC_MAX_ATTEMPTS', 30),
  windowMs: envNum('VITE_RL_PUBLIC_WINDOW_MS', 60 * 1000), // 1 minute
};

/**
 * **Authenticated tier** — loosest.
 *
 * Applies to write operations by authenticated users (create event, register, etc.).
 */
export const AUTHENTICATED_RATE_LIMIT: RateLimitTierConfig = {
  maxAttempts: envNum('VITE_RL_AUTHENTICATED_MAX_ATTEMPTS', 60),
  windowMs: envNum('VITE_RL_AUTHENTICATED_WINDOW_MS', 60 * 1000), // 1 minute
};

/**
 * **Resend-email tier** — special case for verification email resends.
 *
 * Hard cap of 3 per 15-minute window, layered on top of the 60-second UI cooldown.
 */
export const RESEND_EMAIL_RATE_LIMIT: RateLimitTierConfig = {
  maxAttempts: envNum('VITE_RL_RESEND_EMAIL_MAX_ATTEMPTS', 3),
  windowMs: envNum('VITE_RL_RESEND_EMAIL_WINDOW_MS', 15 * 60 * 1000), // 15 minutes
};

// ---------------------------------------------------------------------------
// Lookup map
// ---------------------------------------------------------------------------

export const RATE_LIMIT_TIERS: Record<RateLimitTier, RateLimitTierConfig> = {
  auth: AUTH_RATE_LIMIT,
  public: PUBLIC_RATE_LIMIT,
  authenticated: AUTHENTICATED_RATE_LIMIT,
  resendEmail: RESEND_EMAIL_RATE_LIMIT,
};
