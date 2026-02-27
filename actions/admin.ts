"use server"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { z } from "zod"

const VALID_ROLES = ["ADMIN", "INVESTIGATOR", "REVIEWER", "VIEWER"] as const
type AppUserRole = (typeof VALID_ROLES)[number]

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(VALID_ROLES),
  department: z.string().optional(),
})

export async function createUser(formData: FormData) {
  await requireAdmin()

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

  revalidatePath("/admin/users")
}

const updateUserRoleSchema = z.object({
  role: z.enum(VALID_ROLES),
})

export async function updateUserRole(userId: string, role: string) {
  await requireAdmin()

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

  revalidatePath("/admin/users")
}
