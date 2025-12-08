/**
 * Rate Limiting & Throttling Utilities
 * For anti-flood protection
 */

// =====================================================
// THROTTLE UTILITY (UI side)
// =====================================================

interface ThrottleState {
  lastCall: number;
  blocked: boolean;
  attempts: number;
  lockoutUntil: number | null;
}

const throttleStates: Map<string, ThrottleState> = new Map();

/**
 * Check if an action is allowed based on throttle rules
 * @param key Unique identifier for the action (e.g., 'login', 'register')
 * @param options Throttle options
 * @returns Object with allowed status and wait time
 */
export function checkThrottle(
  key: string,
  options: {
    minInterval?: number; // Minimum time between calls in ms (default: 1000)
    maxAttempts?: number; // Max attempts before lockout (default: 5)
    lockoutDuration?: number; // Lockout duration in ms (default: 30000)
    windowDuration?: number; // Time window for counting attempts in ms (default: 60000)
  } = {}
): { allowed: boolean; waitMs: number; attemptsLeft: number } {
  const {
    minInterval = 1000,
    maxAttempts = 5,
    lockoutDuration = 30000,
    windowDuration = 60000,
  } = options;

  const now = Date.now();
  let state = throttleStates.get(key);

  // Initialize state if not exists
  if (!state) {
    state = {
      lastCall: 0,
      blocked: false,
      attempts: 0,
      lockoutUntil: null,
    };
    throttleStates.set(key, state);
  }

  // Check if currently locked out
  if (state.lockoutUntil && now < state.lockoutUntil) {
    return {
      allowed: false,
      waitMs: state.lockoutUntil - now,
      attemptsLeft: 0,
    };
  }

  // Reset lockout if expired
  if (state.lockoutUntil && now >= state.lockoutUntil) {
    state.lockoutUntil = null;
    state.attempts = 0;
    state.blocked = false;
  }

  // Check minimum interval
  const timeSinceLastCall = now - state.lastCall;
  if (timeSinceLastCall < minInterval) {
    return {
      allowed: false,
      waitMs: minInterval - timeSinceLastCall,
      attemptsLeft: maxAttempts - state.attempts,
    };
  }

  // Reset attempts if window expired
  if (timeSinceLastCall > windowDuration) {
    state.attempts = 0;
  }

  // Increment attempts
  state.attempts++;
  state.lastCall = now;

  // Check if should lockout
  if (state.attempts >= maxAttempts) {
    state.lockoutUntil = now + lockoutDuration;
    state.blocked = true;
    return {
      allowed: false,
      waitMs: lockoutDuration,
      attemptsLeft: 0,
    };
  }

  return {
    allowed: true,
    waitMs: 0,
    attemptsLeft: maxAttempts - state.attempts,
  };
}

/**
 * Record a successful action (reset attempt counter)
 */
export function recordSuccess(key: string): void {
  const state = throttleStates.get(key);
  if (state) {
    state.attempts = 0;
    state.blocked = false;
    state.lockoutUntil = null;
  }
}

/**
 * Clear throttle state for a key
 */
export function clearThrottle(key: string): void {
  throttleStates.delete(key);
}

// =====================================================
// DEBOUNCE UTILITY
// =====================================================

const debounceTimers: Map<string, NodeJS.Timeout> = new Map();

/**
 * Debounce a function call
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  key: string,
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  return (...args: Parameters<T>) => {
    const existingTimer = debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      fn(...args);
      debounceTimers.delete(key);
    }, delay);

    debounceTimers.set(key, timer);
  };
}

// =====================================================
// LOCAL STORAGE RATE LIMIT (Persistent across sessions)
// =====================================================

interface StoredRateLimit {
  attempts: number;
  firstAttempt: number;
  lockoutUntil: number | null;
}

const RATE_LIMIT_PREFIX = 'rl_';

/**
 * Check persistent rate limit (survives page refresh)
 */
export function checkPersistentRateLimit(
  key: string,
  options: {
    maxAttempts?: number;
    windowMs?: number;
    lockoutMs?: number;
  } = {}
): { allowed: boolean; waitMs: number; attemptsLeft: number } {
  const { maxAttempts = 5, windowMs = 300000, lockoutMs = 900000 } = options; // 5 attempts per 5 min, 15 min lockout

  const storageKey = RATE_LIMIT_PREFIX + key;
  const now = Date.now();

  try {
    const stored = localStorage.getItem(storageKey);
    let data: StoredRateLimit = stored
      ? JSON.parse(stored)
      : { attempts: 0, firstAttempt: now, lockoutUntil: null };

    // Check lockout
    if (data.lockoutUntil && now < data.lockoutUntil) {
      return {
        allowed: false,
        waitMs: data.lockoutUntil - now,
        attemptsLeft: 0,
      };
    }

    // Reset if lockout expired or window passed
    if (
      (data.lockoutUntil && now >= data.lockoutUntil) ||
      now - data.firstAttempt > windowMs
    ) {
      data = { attempts: 0, firstAttempt: now, lockoutUntil: null };
    }

    // Increment and check
    data.attempts++;

    if (data.attempts >= maxAttempts) {
      data.lockoutUntil = now + lockoutMs;
      localStorage.setItem(storageKey, JSON.stringify(data));
      return {
        allowed: false,
        waitMs: lockoutMs,
        attemptsLeft: 0,
      };
    }

    localStorage.setItem(storageKey, JSON.stringify(data));
    return {
      allowed: true,
      waitMs: 0,
      attemptsLeft: maxAttempts - data.attempts,
    };
  } catch {
    // If localStorage fails, allow the action
    return { allowed: true, waitMs: 0, attemptsLeft: maxAttempts };
  }
}

/**
 * Clear persistent rate limit
 */
export function clearPersistentRateLimit(key: string): void {
  try {
    localStorage.removeItem(RATE_LIMIT_PREFIX + key);
  } catch {
    // Ignore localStorage errors
  }
}

// =====================================================
// FORMAT HELPERS
// =====================================================

/**
 * Format wait time for display
 */
export function formatWaitTime(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) {
    return `${seconds} seconde${seconds > 1 ? 's' : ''}`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
}
