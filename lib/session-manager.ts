import { prisma } from "./prisma"
import { AUTH_CONFIG } from "./auth-constants"

/**
 * Create a new active session and enforce the concurrent session cap (FIFO).
 */
export async function createActiveSession(params: {
  jti: string
  userId: string
  userAgent: string | null
  ipAddress: string | null
  expiresAt: Date
}): Promise<void> {
  // Enforce concurrent session cap — revoke oldest if at limit
  const activeSessions = await prisma.activeSession.findMany({
    where: {
      userId: params.userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  })

  const excess = activeSessions.length - AUTH_CONFIG.MAX_SESSIONS_PER_USER + 1
  if (excess > 0) {
    const toRevoke = activeSessions.slice(0, excess)
    await prisma.activeSession.updateMany({
      where: { id: { in: toRevoke.map((s) => s.id) } },
      data: { revokedAt: new Date(), revokedReason: "session_cap" },
    })
  }

  await prisma.activeSession.create({
    data: {
      jti: params.jti,
      userId: params.userId,
      userAgent: params.userAgent,
      ipAddress: params.ipAddress,
      expiresAt: params.expiresAt,
    },
  })
}

/**
 * Validate a session by JTI. Checks revocation, expiry, user status,
 * and password-change invalidation.
 */
export async function validateSession(jti: string): Promise<{
  valid: boolean
  reason?: string
}> {
  const session = await prisma.activeSession.findUnique({
    where: { jti },
    include: {
      user: {
        select: { active: true, passwordChangedAt: true },
      },
    },
  })

  if (!session) {
    return { valid: false, reason: "Session not found" }
  }

  if (session.revokedAt) {
    return { valid: false, reason: `Session revoked: ${session.revokedReason ?? "unknown"}` }
  }

  if (session.expiresAt < new Date()) {
    return { valid: false, reason: "Session expired" }
  }

  if (!session.user.active) {
    return { valid: false, reason: "User account deactivated" }
  }

  // Invalidate sessions created before a password change
  if (
    session.user.passwordChangedAt &&
    session.createdAt < session.user.passwordChangedAt
  ) {
    await prisma.activeSession.update({
      where: { jti },
      data: { revokedAt: new Date(), revokedReason: "password_change" },
    })
    return { valid: false, reason: "Password changed after this session was created" }
  }

  // Touch lastActiveAt (throttled)
  if (Date.now() - session.lastActiveAt.getTime() > AUTH_CONFIG.SESSION_TOUCH_INTERVAL_MS) {
    // Non-blocking — don't await
    void prisma.activeSession.update({
      where: { jti },
      data: { lastActiveAt: new Date() },
    })
  }

  return { valid: true }
}

/**
 * Revoke a specific session.
 */
export async function revokeSession(jti: string, reason: string = "admin_revoke"): Promise<void> {
  await prisma.activeSession.update({
    where: { jti },
    data: { revokedAt: new Date(), revokedReason: reason },
  })
}

/**
 * Revoke all active sessions for a user.
 */
export async function revokeAllUserSessions(
  userId: string,
  reason: string = "admin_revoke"
): Promise<number> {
  const result = await prisma.activeSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: reason },
  })
  return result.count
}

/**
 * Get all active (non-revoked, non-expired) sessions for a user.
 */
export async function getUserActiveSessions(userId: string) {
  return prisma.activeSession.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastActiveAt: "desc" },
    select: {
      id: true,
      jti: true,
      userAgent: true,
      ipAddress: true,
      lastActiveAt: true,
      createdAt: true,
      expiresAt: true,
    },
  })
}
