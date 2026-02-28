export const AUTH_CONFIG = {
  // Rate limiting — sliding window
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,       // 15 minutes
  RATE_LIMIT_MAX_ATTEMPTS: 10,                  // per IP in window

  // Account lockout
  LOCKOUT_THRESHOLD: 5,                         // failed attempts before lock
  LOCKOUT_DURATION_MS: 15 * 60 * 1000,          // 15-minute lockout

  // Concurrent sessions
  MAX_SESSIONS_PER_USER: 3,                     // FIFO eviction of oldest

  // Session lifetime
  SESSION_MAX_AGE_SECONDS: 24 * 60 * 60,        // 24 hours
  SESSION_TOUCH_INTERVAL_MS: 5 * 60 * 1000,     // update lastActiveAt every 5 min max

  // Password policy
  PASSWORD_MIN_LENGTH: 10,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_DIGIT: true,
  PASSWORD_REQUIRE_SPECIAL: true,
} as const
