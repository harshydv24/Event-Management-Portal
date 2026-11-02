/**
 * Client-side Rate Limiter
 *
 * Implements a sliding-window counter with optional exponential backoff.
 * State is persisted to localStorage so limits survive page refreshes.
 *
 * NOTE: Client-side rate limiting is a UX safeguard, not a security boundary.
 * Firebase's own server-side Auth rate limits and Firestore Security Rules
 * provide the actual protection layer.
 */

import {
  type RateLimitTier,
  type RateLimitTierConfig,
  RATE_LIMIT_TIERS,
} from '@/config/rateLimitConfig';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  /** Whether the action is allowed. */
  allowed: boolean;
  /** Milliseconds the caller must wait before retrying (0 when allowed). */
  retryAfterMs: number;
  /** Number of remaining attempts in the current window. */
  remainingAttempts: number;
}

interface StoredEntry {
  /** Timestamps (epoch ms) of each attempt within the window. */
  timestamps: number[];
  /** Number of consecutive failures (used for backoff calculation). */
  consecutiveFailures: number;
  /** Timestamp of the last recorded failure (epoch ms). */
  lastFailureAt: number;
}

// ---------------------------------------------------------------------------
// Custom error
// ---------------------------------------------------------------------------

export class RateLimitError extends Error {
  /** Milliseconds until the next attempt is allowed. */
  public readonly retryAfterMs: number;

  constructor(retryAfterMs: number, message?: string) {
    const waitSec = Math.ceil(retryAfterMs / 1000);
    const displayMsg =
      message ??
      `Too many attempts. Please wait ${formatWaitTime(waitSec)} before trying again.`;
    super(displayMsg);
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STORAGE_PREFIX = 'rl_';
const DEVICE_ID_KEY = `${STORAGE_PREFIX}device_id`;

/** Format seconds into a human-readable string like "32 seconds" or "2 minutes". */
function formatWaitTime(seconds: number): string {
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

/**
 * Get or create a stable device fingerprint.
 *
 * Since this is a pure client-side app we cannot access the user's real IP.
 * A random UUID stored in localStorage approximates per-device tracking.
 */
function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    // localStorage unavailable (e.g. private browsing quota exceeded)
    return 'fallback-device';
  }
}

function storageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

function readEntry(key: string): StoredEntry {
  try {
    const raw = localStorage.getItem(storageKey(key));
    if (!raw) return { timestamps: [], consecutiveFailures: 0, lastFailureAt: 0 };
    return JSON.parse(raw) as StoredEntry;
  } catch {
    return { timestamps: [], consecutiveFailures: 0, lastFailureAt: 0 };
  }
}

function writeEntry(key: string, entry: StoredEntry): void {
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(entry));
  } catch {
    // Silently fail — rate limiting is best-effort on the client.
  }
}

function removeEntry(key: string): void {
  try {
    localStorage.removeItem(storageKey(key));
  } catch {
    // noop
  }
}

/** Prune timestamps outside the current window and return updated list. */
function pruneTimestamps(timestamps: number[], windowMs: number, now: number): number[] {
  const cutoff = now - windowMs;
  return timestamps.filter((t) => t > cutoff);
}

// ---------------------------------------------------------------------------
// Core engine
// ---------------------------------------------------------------------------

/**
 * Check whether an action identified by `key` is allowed under the given tier.
 */
export function checkRateLimit(
  key: string,
  tier: RateLimitTier,
): RateLimitResult {
  const config = RATE_LIMIT_TIERS[tier];
  const now = Date.now();
  const entry = readEntry(key);

  // Prune expired timestamps
  const active = pruneTimestamps(entry.timestamps, config.windowMs, now);

  // Check backoff first (auth tier)
  const backoffDelay = getBackoffDelay(key, config, now, entry);
  if (backoffDelay > 0) {
    return {
      allowed: false,
      retryAfterMs: backoffDelay,
      remainingAttempts: Math.max(0, config.maxAttempts - active.length),
    };
  }

  // Check window limit
  if (active.length >= config.maxAttempts) {
    // Earliest timestamp that will fall off the window
    const oldestInWindow = active[0];
    const retryAfterMs = oldestInWindow + config.windowMs - now;
    return {
      allowed: false,
      retryAfterMs: Math.max(0, retryAfterMs),
      remainingAttempts: 0,
    };
  }

  return {
    allowed: true,
    retryAfterMs: 0,
    remainingAttempts: config.maxAttempts - active.length - 1, // -1 for the imminent attempt
  };
}

/**
 * Record an attempt for the given key.
 *
 * @param success — Pass `true` on successful actions. For auth routes a
 *   successful attempt resets the consecutive-failure counter (and therefore
 *   the backoff). Passing `false` increments the failure counter.
 */
export function recordAttempt(
  key: string,
  tier: RateLimitTier,
  success: boolean,
): void {
  const config = RATE_LIMIT_TIERS[tier];
  const now = Date.now();
  const entry = readEntry(key);

  const active = pruneTimestamps(entry.timestamps, config.windowMs, now);
  active.push(now);

  const updatedEntry: StoredEntry = {
    timestamps: active,
    consecutiveFailures: success ? 0 : entry.consecutiveFailures + 1,
    lastFailureAt: success ? entry.lastFailureAt : now,
  };

  writeEntry(key, updatedEntry);
}

/**
 * Get the current backoff delay (in ms) for a key, or 0 if no backoff applies.
 */
function getBackoffDelay(
  key: string,
  config: RateLimitTierConfig,
  now: number,
  entry?: StoredEntry,
): number {
  if (!config.backoff?.enabled) return 0;

  const data = entry ?? readEntry(key);
  if (data.consecutiveFailures === 0 || data.lastFailureAt === 0) return 0;

  const { baseDelayMs, maxDelayMs, multiplier } = config.backoff;
  const delay = Math.min(
    baseDelayMs * Math.pow(multiplier, data.consecutiveFailures - 1),
    maxDelayMs,
  );

  const elapsed = now - data.lastFailureAt;
  return Math.max(0, delay - elapsed);
}

/**
 * Return the current backoff delay for a key under a given tier (public API).
 */
export function getBackoffDelayForKey(key: string, tier: RateLimitTier): number {
  const config = RATE_LIMIT_TIERS[tier];
  return getBackoffDelay(key, config, Date.now());
}

/**
 * Return the remaining number of attempts for a key under a given tier.
 */
export function getRemainingAttempts(key: string, tier: RateLimitTier): number {
  const config = RATE_LIMIT_TIERS[tier];
  const now = Date.now();
  const entry = readEntry(key);
  const active = pruneTimestamps(entry.timestamps, config.windowMs, now);
  return Math.max(0, config.maxAttempts - active.length);
}

/**
 * Reset all rate-limit state for a given key. Useful after a successful login
 * to clear the backoff for that account.
 */
export function resetRateLimit(key: string): void {
  removeEntry(key);
}

/**
 * Garbage-collect all expired rate-limit entries from localStorage.
 * Call this periodically (e.g. on app start) to prevent unbounded growth.
 */
export function clearExpiredEntries(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(STORAGE_PREFIX) || k === DEVICE_ID_KEY) continue;

      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const entry = JSON.parse(raw) as StoredEntry;
        // If all timestamps are older than the longest window (15 min) and
        // there are no active backoffs, remove the entry.
        const maxWindow = 15 * 60 * 1000;
        const now = Date.now();
        const hasActive = entry.timestamps.some((t) => t > now - maxWindow);
        const hasBackoff = entry.lastFailureAt > now - maxWindow;
        if (!hasActive && !hasBackoff) {
          keysToRemove.push(k);
        }
      } catch {
        // Corrupt entry — remove it.
        keysToRemove.push(k!);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // localStorage unavailable — nothing to clean.
  }
}

// ---------------------------------------------------------------------------
// High-level guard helpers (used by service files)
// ---------------------------------------------------------------------------

/**
 * Build the rate-limit key for a device-scoped operation.
 */
export function deviceKey(action: string): string {
  return `${getDeviceId()}:${action}`;
}

/**
 * Build the rate-limit key for an account-scoped operation.
 */
export function accountKey(email: string, action: string): string {
  return `account:${email.toLowerCase().trim()}:${action}`;
}

/**
 * Assert that an action is allowed under the given tier.
 * Throws `RateLimitError` when the limit is exceeded.
 *
 * @returns void — call `recordAttempt` after the actual operation completes.
 */
export function assertRateLimit(key: string, tier: RateLimitTier): void {
  const result = checkRateLimit(key, tier);
  if (!result.allowed) {
    throw new RateLimitError(result.retryAfterMs);
  }
}

/**
 * Convenience wrapper that checks rate limit, runs the operation, and records
 * the attempt. For non-auth tiers where success/failure tracking isn't needed.
 */
export async function withRateLimit<T>(
  key: string,
  tier: RateLimitTier,
  operation: () => Promise<T>,
): Promise<T> {
  assertRateLimit(key, tier);
  try {
    const result = await operation();
    recordAttempt(key, tier, true);
    return result;
  } catch (error) {
    recordAttempt(key, tier, false);
    throw error;
  }
}

// Clean up expired entries on module load
clearExpiredEntries();
