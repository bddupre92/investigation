"use server"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { passwordSchema } from "@/schemas/auth"
import { revokeSession, revokeAllUserSessions, getUserActiveSessions } from "@/lib/session-manager"
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit"

const VALID_ROLES = ["ADMIN", "INVESTIGATOR", "REVIEWER", "VIEWER"] as const
type AppUserRole = (typeof VALID_ROLES)[number]

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: passwordSchema,
  role: z.enum(VALID_ROLES),
  department: z.string().optional(),
})

export async function createUser(formData: FormData) {
  const session = await requireAdmin()

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    department: formData.get("department") || undefined,
  }

  const parsed = createUserSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { name, email, password, role, department } = parsed.data

  // Check for existing email
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: { email: ["A user with this email already exists."] } }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      role: role as any,
      department: department || null,
      active: true,
    },
  })

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email,
    action: AUDIT_ACTIONS.USER_CREATE,
    entityType: "user",
    metadata: { name, email, role },
  })

  revalidatePath("/admin/users")
}

const updateUserRoleSchema = z.object({
  role: z.enum(VALID_ROLES),
})

export async function updateUserRole(userId: string, role: string) {
  const session = await requireAdmin()

  const parsed = updateUserRoleSchema.safeParse({ role })
  if (!parsed.success) {
    return { error: "Invalid role provided." }
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return { error: "User not found." }
  }

  await prisma.user.update({
    where: { id: userId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { role: parsed.data.role as any },
  })

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email,
    action: AUDIT_ACTIONS.USER_UPDATE_ROLE,
    entityType: "user",
    entityId: userId,
    metadata: { newRole: parsed.data.role, previousRole: user.role },
  })

  revalidatePath("/admin/users")
}

/** Admin: revoke a specific session by JTI */
export async function adminRevokeSession(sessionJti: string) {
  const session = await requireAdmin()
  await revokeSession(sessionJti, "admin_revoke")
  logAudit({
    userId: session.user.id,
    userEmail: session.user.email,
    action: AUDIT_ACTIONS.USER_REVOKE_SESSION,
    entityType: "session",
    entityId: sessionJti,
  })
  revalidatePath("/admin/users")
}

/** Admin: revoke all sessions for a user */
export async function adminRevokeAllSessions(userId: string) {
  const session = await requireAdmin()
  await revokeAllUserSessions(userId, "admin_revoke")
  logAudit({
    userId: session.user.id,
    userEmail: session.user.email,
    action: AUDIT_ACTIONS.USER_REVOKE_ALL_SESSIONS,
    entityType: "user",
    entityId: userId,
  })
  revalidatePath("/admin/users")
}

/** Admin: get active sessions for a user */
export async function adminGetUserSessions(userId: string) {
  await requireAdmin()
  return getUserActiveSessions(userId)
}

/** Admin: reset a user's password */
export async function adminResetPassword(userId: string, newPassword: string) {
  const session = await requireAdmin()

  const parsed = passwordSchema.safeParse(newPassword)
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(". ") }
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      passwordChangedAt: new Date(),
      failedLoginCount: 0,
      lockedUntil: null,
    },
  })

  // Revoke all existing sessions — user must re-login
  await revokeAllUserSessions(userId, "password_change")

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email,
    action: AUDIT_ACTIONS.USER_RESET_PASSWORD,
    entityType: "user",
    entityId: userId,
  })

  revalidatePath("/admin/users")
}
