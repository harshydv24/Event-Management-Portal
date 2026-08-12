/**
 * Unit tests for the client-side rate limiter.
 *
 * These tests exercise the core engine (sliding-window counting, exponential
 * backoff, key isolation, reset behaviour, and expired-entry cleanup) without
 * touching Firebase or any UI components.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Provide a localStorage polyfill BEFORE any imports that touch it. The vitest
// jsdom environment may not always expose localStorage (depends on jsdom version
// and url config). This guarantees availability for both module‐load-time code
// and test code.
// ---------------------------------------------------------------------------

function createStorage(): Storage {
  let store: Record<string, string> = {};
  return {
    getItem(key: string) { return key in store ? store[key] : null; },
    setItem(key: string, value: string) { store[key] = String(value); },
    removeItem(key: string) { delete store[key]; },
    clear() { store = {}; },
    key(index: number) { return Object.keys(store)[index] ?? null; },
    get length() { return Object.keys(store).length; },
  };
}

// Install the stub if needed
if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: createStorage(),
    writable: true,
    configurable: true,
  });
}

// ---------------------------------------------------------------------------
// Mock the rateLimitConfig module with test-friendly values BEFORE importing
// the module under test.
// ---------------------------------------------------------------------------

vi.mock('@/config/rateLimitConfig', () => {
  const authConfig = {
    maxAttempts: 3,
    windowMs: 10_000, // 10 seconds — short for tests
    perAccount: true,
    backoff: {
      enabled: true,
      baseDelayMs: 1_000,
      maxDelayMs: 8_000,
      multiplier: 2,
    },
  };

  const publicConfig = {
    maxAttempts: 5,
    windowMs: 10_000,
  };

  const authenticatedConfig = {
    maxAttempts: 10,
    windowMs: 10_000,
  };

  const resendEmailConfig = {
    maxAttempts: 2,
    windowMs: 10_000,
  };

  return {
    AUTH_RATE_LIMIT: authConfig,
    PUBLIC_RATE_LIMIT: publicConfig,
    AUTHENTICATED_RATE_LIMIT: authenticatedConfig,
    RESEND_EMAIL_RATE_LIMIT: resendEmailConfig,
    RATE_LIMIT_TIERS: {
      auth: authConfig,
      public: publicConfig,
      authenticated: authenticatedConfig,
      resendEmail: resendEmailConfig,
    },
  };
});

// Now import the module under test
import {
  checkRateLimit,
  recordAttempt,
  resetRateLimit,
  assertRateLimit,
  withRateLimit,
  clearExpiredEntries,
  RateLimitError,
  getBackoffDelayForKey,
  getRemainingAttempts,
  deviceKey,
  accountKey,
} from '@/lib/rateLimiter';

// ---------------------------------------------------------------------------
// Clean localStorage between every test for isolation
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// 1. Basic sliding-window counting
// ---------------------------------------------------------------------------

describe('Sliding-window counting', () => {
  it('allows requests within the limit', () => {
    const key = 'test:window:allow';
    const r1 = checkRateLimit(key, 'public'); // limit = 5
    expect(r1.allowed).toBe(true);
    expect(r1.remainingAttempts).toBe(4); // 5 - 0 - 1 (imminent)

    recordAttempt(key, 'public', true);
    recordAttempt(key, 'public', true);

    const r2 = checkRateLimit(key, 'public');
    expect(r2.allowed).toBe(true);
    expect(r2.remainingAttempts).toBe(2); // 5 - 2 - 1
  });

  it('blocks when limit is exhausted', () => {
    const key = 'test:window:block';
    // Exhaust all 5 public attempts
    for (let i = 0; i < 5; i++) {
      recordAttempt(key, 'public', true);
    }

    const result = checkRateLimit(key, 'public');
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
    expect(result.remainingAttempts).toBe(0);
  });

  it('window expires and allows new requests', () => {
    const key = 'test:window:expire';

    // Manually write an entry with timestamps outside the 10s window
    const past = Date.now() - 15_000; // 15 seconds ago
    const entry = {
      timestamps: Array.from({ length: 5 }, () => past),
      consecutiveFailures: 0,
      lastFailureAt: 0,
    };
    localStorage.setItem(`rl_${key}`, JSON.stringify(entry));

    const result = checkRateLimit(key, 'public');
    expect(result.allowed).toBe(true);
    expect(result.remainingAttempts).toBe(4); // all old ones pruned
  });
});

// ---------------------------------------------------------------------------
// 2. Exponential backoff (auth tier)
// ---------------------------------------------------------------------------

describe('Exponential backoff', () => {
  it('applies backoff after failures', () => {
    const key = 'test:backoff:apply';

    // First failure — backoff = 1000ms (base)
    recordAttempt(key, 'auth', false);
    const delay1 = getBackoffDelayForKey(key, 'auth');
    expect(delay1).toBeGreaterThan(0);
    expect(delay1).toBeLessThanOrEqual(1_000);

    // Second failure — backoff = 2000ms (1000 × 2^1)
    recordAttempt(key, 'auth', false);
    const delay2 = getBackoffDelayForKey(key, 'auth');
    expect(delay2).toBeGreaterThan(0);
    expect(delay2).toBeLessThanOrEqual(2_000);
  });

  it('caps backoff at maxDelayMs', () => {
    const key = 'test:backoff:cap';

    // Simulate many consecutive failures
    for (let i = 0; i < 20; i++) {
      recordAttempt(key, 'auth', false);
    }

    const delay = getBackoffDelayForKey(key, 'auth');
    // maxDelayMs is 8000 in our test config
    expect(delay).toBeLessThanOrEqual(8_000);
  });

  it('resets backoff on success', () => {
    const key = 'test:backoff:reset';

    // Build up backoff
    recordAttempt(key, 'auth', false);
    recordAttempt(key, 'auth', false);
    expect(getBackoffDelayForKey(key, 'auth')).toBeGreaterThan(0);

    // Successful attempt resets consecutiveFailures
    recordAttempt(key, 'auth', true);
    const delay = getBackoffDelayForKey(key, 'auth');
    expect(delay).toBe(0);
  });

  it('blocks check when backoff is active', () => {
    const key = 'test:backoff:block';

    recordAttempt(key, 'auth', false);
    // Immediately after failure, backoff should block
    const result = checkRateLimit(key, 'auth');
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 3. Per-device and per-account key isolation
// ---------------------------------------------------------------------------

describe('Key isolation', () => {
  it('device keys are distinct from account keys', () => {
    const dKey = deviceKey('login');
    const aKey = accountKey('user@example.com', 'login');

    expect(dKey).not.toBe(aKey);

    // Exhaust device key under auth limit (3)
    for (let i = 0; i < 3; i++) {
      recordAttempt(dKey, 'auth', true);
    }

    // Account key should still be allowed (separate counter)
    const result = checkRateLimit(aKey, 'auth');
    expect(result.allowed).toBe(true);
  });

  it('different emails have separate rate limits', () => {
    const key1 = accountKey('alice@example.com', 'login');
    const key2 = accountKey('bob@example.com', 'login');

    // Exhaust alice's limit
    for (let i = 0; i < 3; i++) {
      recordAttempt(key1, 'auth', true);
    }

    expect(checkRateLimit(key1, 'auth').allowed).toBe(false);
    expect(checkRateLimit(key2, 'auth').allowed).toBe(true);
  });

  it('normalises email to lowercase', () => {
    const key1 = accountKey('USER@Example.COM', 'login');
    const key2 = accountKey('user@example.com', 'login');

    expect(key1).toBe(key2);
  });
});

// ---------------------------------------------------------------------------
// 4. resetRateLimit
// ---------------------------------------------------------------------------

describe('resetRateLimit', () => {
  it('clears all state for a key', () => {
    const key = 'test:reset:clear';

    recordAttempt(key, 'auth', false);
    recordAttempt(key, 'auth', false);
    expect(checkRateLimit(key, 'auth').allowed).toBe(false);

    resetRateLimit(key);

    const result = checkRateLimit(key, 'auth');
    expect(result.allowed).toBe(true);
    expect(getRemainingAttempts(key, 'auth')).toBe(3); // full limit
  });
});

// ---------------------------------------------------------------------------
// 5. assertRateLimit / RateLimitError
// ---------------------------------------------------------------------------

describe('assertRateLimit', () => {
  it('does not throw when allowed', () => {
    expect(() => assertRateLimit('test:assert:ok', 'public')).not.toThrow();
  });

  it('throws RateLimitError when blocked', () => {
    const key = 'test:assert:blocked';
    for (let i = 0; i < 5; i++) {
      recordAttempt(key, 'public', true);
    }

    expect(() => assertRateLimit(key, 'public')).toThrow(RateLimitError);
  });

  it('RateLimitError contains retryAfterMs', () => {
    const key = 'test:assert:retry';
    for (let i = 0; i < 5; i++) {
      recordAttempt(key, 'public', true);
    }

    try {
      assertRateLimit(key, 'public');
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(RateLimitError);
      expect((err as RateLimitError).retryAfterMs).toBeGreaterThan(0);
      expect((err as RateLimitError).message).toContain('Too many attempts');
    }
  });
});

// ---------------------------------------------------------------------------
// 6. withRateLimit helper
// ---------------------------------------------------------------------------

describe('withRateLimit', () => {
  it('runs the operation when allowed', async () => {
    const result = await withRateLimit('test:with:ok', 'public', async () => 42);
    expect(result).toBe(42);
  });

  it('records success after operation completes', async () => {
    const key = 'test:with:record';
    await withRateLimit(key, 'public', async () => 'ok');

    // One attempt consumed
    expect(getRemainingAttempts(key, 'public')).toBe(4);
  });

  it('records failure when operation throws', async () => {
    const key = 'test:with:fail';
    await expect(
      withRateLimit(key, 'auth', async () => {
        throw new Error('oops');
      }),
    ).rejects.toThrow('oops');

    // Should have recorded a failure (backoff should be active)
    expect(getBackoffDelayForKey(key, 'auth')).toBeGreaterThan(0);
  });

  it('throws RateLimitError when blocked (does not run operation)', async () => {
    const key = 'test:with:blocked';
    for (let i = 0; i < 5; i++) {
      recordAttempt(key, 'public', true);
    }

    const spy = vi.fn();
    await expect(withRateLimit(key, 'public', spy)).rejects.toThrow(RateLimitError);
    expect(spy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 7. clearExpiredEntries
// ---------------------------------------------------------------------------

describe('clearExpiredEntries', () => {
  it('removes entries with only expired timestamps', () => {
    const key = 'test:expire:old';
    const entry = {
      timestamps: [Date.now() - 20 * 60 * 1000], // 20 min ago
      consecutiveFailures: 0,
      lastFailureAt: 0,
    };
    localStorage.setItem(`rl_${key}`, JSON.stringify(entry));

    clearExpiredEntries();

    expect(localStorage.getItem(`rl_${key}`)).toBeNull();
  });

  it('keeps entries with active timestamps', () => {
    const key = 'test:expire:active';
    const entry = {
      timestamps: [Date.now()], // just now
      consecutiveFailures: 0,
      lastFailureAt: 0,
    };
    localStorage.setItem(`rl_${key}`, JSON.stringify(entry));

    clearExpiredEntries();

    expect(localStorage.getItem(`rl_${key}`)).not.toBeNull();
  });

  it('does not remove the device_id key', () => {
    localStorage.setItem('rl_device_id', 'test-uuid');

    clearExpiredEntries();

    expect(localStorage.getItem('rl_device_id')).toBe('test-uuid');
  });
});

// ---------------------------------------------------------------------------
// 8. getRemainingAttempts
// ---------------------------------------------------------------------------

describe('getRemainingAttempts', () => {
  it('returns full count for a fresh key', () => {
    expect(getRemainingAttempts('fresh-key', 'authenticated')).toBe(10);
  });

  it('decreases after recording attempts', () => {
    const key = 'test:remaining:dec';
    recordAttempt(key, 'authenticated', true);
    recordAttempt(key, 'authenticated', true);
    expect(getRemainingAttempts(key, 'authenticated')).toBe(8);
  });

  it('returns 0 when exhausted', () => {
    const key = 'test:remaining:zero';
    for (let i = 0; i < 10; i++) {
      recordAttempt(key, 'authenticated', true);
    }
    expect(getRemainingAttempts(key, 'authenticated')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 9. Tier isolation
// ---------------------------------------------------------------------------

describe('Tier isolation', () => {
  it('different tiers have independent limits for the same key prefix', () => {
    const key = 'test:tier';

    // Exhaust auth limit (3)
    for (let i = 0; i < 3; i++) {
      recordAttempt(`${key}:auth`, 'auth', true);
    }
    expect(checkRateLimit(`${key}:auth`, 'auth').allowed).toBe(false);

    // Public limit (5) for a different key suffix is still available
    expect(checkRateLimit(`${key}:public`, 'public').allowed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 10. localStorage resilience
// ---------------------------------------------------------------------------

describe('localStorage resilience', () => {
  it('handles corrupt localStorage entries gracefully', () => {
    localStorage.setItem('rl_corrupt', 'not-json-{{{');

    // Should not throw — falls back to empty entry
    const result = checkRateLimit('corrupt', 'public');
    expect(result.allowed).toBe(true);
  });
});
