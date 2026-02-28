import { prisma } from "./prisma"
import { AUTH_CONFIG } from "./auth-constants"

export interface RateLimitResult {
  allowed: boolean
  reason?: string
  retryAfterMs?: number
}

/**
 * IP-based rate limiting using a sliding window.
 * Counts login attempts from this IP in the last 15 minutes.
 */
export async function checkIpRateLimit(ipAddress: string): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - AUTH_CONFIG.RATE_LIMIT_WINDOW_MS)

  const count = await prisma.loginAttempt.count({
    where: {
      ipAddress,
      createdAt: { gt: windowStart },
    },
  })

  if (count >= AUTH_CONFIG.RATE_LIMIT_MAX_ATTEMPTS) {
    const oldest = await prisma.loginAttempt.findFirst({
      where: {
        ipAddress,
        createdAt: { gt: windowStart },
      },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    })

    const retryAfterMs = oldest
      ? oldest.createdAt.getTime() + AUTH_CONFIG.RATE_LIMIT_WINDOW_MS - Date.now()
      : AUTH_CONFIG.RATE_LIMIT_WINDOW_MS

    return {
      allowed: false,
      reason: "Too many login attempts. Please try again later.",
      retryAfterMs: Math.max(0, retryAfterMs),
    }
  }

  return { allowed: true }
}

/**
 * Check if an account is locked due to failed attempts.
 * Auto-unlocks if lockedUntil has passed.
 */
export async function checkAccountLockout(email: string): Promise<RateLimitResult> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, lockedUntil: true, failedLoginCount: true },
  })

  // User not found — allow attempt to proceed (fails at credential check)
  if (!user) return { allowed: true }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return {
      allowed: false,
      reason: "Account temporarily locked due to too many failed attempts. Try again later.",
      retryAfterMs: user.lockedUntil.getTime() - Date.now(),
    }
  }

  // Auto-unlock: if lockedUntil is in the past, clear it
  if (user.lockedUntil && user.lockedUntil <= new Date()) {
    await prisma.user.update({
      where: { id: user.id },
      data: { lockedUntil: null, failedLoginCount: 0 },
    })
  }

  return { allowed: true }
}

/**
 * Record a login attempt and handle lockout increments.
 */
export async function recordLoginAttempt(
  email: string,
  ipAddress: string | null,
  success: boolean
): Promise<void> {
  // Always record the attempt
  await prisma.loginAttempt.create({
    data: {
      email: email.toLowerCase(),
      ipAddress,
      success,
    },
  })

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, failedLoginCount: true },
  })

  if (!user) return

  if (success) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastFailedLogin: null },
    })
  } else {
    const newCount = user.failedLoginCount + 1
    const shouldLock = newCount >= AUTH_CONFIG.LOCKOUT_THRESHOLD

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: newCount,
        lastFailedLogin: new Date(),
        lockedUntil: shouldLock
          ? new Date(Date.now() + AUTH_CONFIG.LOCKOUT_DURATION_MS)
          : undefined,
      },
    })
  }
}
