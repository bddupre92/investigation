import { auth } from "@/auth"
import { redirect } from "next/navigation"
import type { UserRole } from "@prisma/client"

/**
 * Basic auth check — JWT only, no DB query. Fast.
 * Use for page renders and data fetching.
 */
export async function requireAuth() {
  const session = await auth()
  if (!session) redirect("/login")
  return session
}

/**
 * Strict auth check — validates session against DB.
 * Checks revocation, password change, account deactivation.
 * Use for server actions (mutations) where security is critical.
 */
export async function requireValidSession() {
  const session = await requireAuth()

  const jti = (session as unknown as { jti?: string }).jti
  if (jti) {
    const { validateSession } = await import("./session-manager")
    const validation = await validateSession(jti)
    if (!validation.valid) {
      redirect("/login")
    }
  }

  return session
}

export async function requireRole(roles: UserRole[]) {
  const session = await requireAuth()
  if (!roles.includes(session.user.role as UserRole)) {
    redirect("/unauthorized")
  }
  return session
}

export const requireAdmin = () => requireRole(["ADMIN"])
export const requireReviewer = () => requireRole(["ADMIN", "REVIEWER"])
export const requireInvestigator = () =>
  requireRole(["ADMIN", "INVESTIGATOR", "REVIEWER"])
