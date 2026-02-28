import { prisma } from "./prisma"

// Standard audit action constants
export const AUDIT_ACTIONS = {
  // Auth
  USER_LOGIN: "user.login",
  USER_LOGIN_FAILED: "user.login_failed",
  USER_LOGOUT: "user.logout",

  // Users
  USER_CREATE: "user.create",
  USER_UPDATE_ROLE: "user.update_role",
  USER_RESET_PASSWORD: "user.reset_password",
  USER_REVOKE_SESSION: "user.revoke_session",
  USER_REVOKE_ALL_SESSIONS: "user.revoke_all_sessions",

  // Investigations
  INVESTIGATION_CREATE: "investigation.create",
  INVESTIGATION_UPDATE: "investigation.update",
  INVESTIGATION_CLOSE: "investigation.close",
  INVESTIGATION_REOPEN: "investigation.reopen",

  // Steps
  STEP_SAVE: "step.save",

  // AI
  AI_RECOMMENDATION: "ai.recommendation",

  // Admin
  AI_LIMITS_UPDATE: "admin.ai_limits_update",
} as const

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS]

/**
 * Log an audit event. Non-blocking — fire and forget.
 */
export function logAudit(params: {
  userId?: string | null
  userEmail?: string | null
  action: AuditAction | string
  entityType?: string
  entityId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string | null
  userAgent?: string | null
}): void {
  // Fire and forget — don't block the caller
  void prisma.auditLog.create({
    data: {
      userId: params.userId ?? null,
      userEmail: params.userEmail ?? null,
      action: params.action,
      entityType: params.entityType ?? null,
      entityId: params.entityId ?? null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    },
  }).catch((err) => {
    console.error("Audit log write failed:", err)
  })
}

/**
 * Query audit logs with pagination and filters.
 */
export async function getAuditLogs(params: {
  page?: number
  pageSize?: number
  action?: string
  userId?: string
  entityType?: string
  entityId?: string
}) {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 50
  const skip = (page - 1) * pageSize

  const where: Record<string, unknown> = {}
  if (params.action) where.action = params.action
  if (params.userId) where.userId = params.userId
  if (params.entityType) where.entityType = params.entityType
  if (params.entityId) where.entityId = params.entityId

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ])

  return {
    logs,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}
