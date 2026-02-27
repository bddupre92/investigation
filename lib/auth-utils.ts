import { auth } from "@/auth"
import { redirect } from "next/navigation"
import type { UserRole } from "@prisma/client"

export async function requireAuth() {
  const session = await auth()
  if (!session) redirect("/login")
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
