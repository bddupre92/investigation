import { z } from "zod"
import { AUTH_CONFIG } from "@/lib/auth-constants"

export const passwordSchema = z
  .string()
  .min(
    AUTH_CONFIG.PASSWORD_MIN_LENGTH,
    `Password must be at least ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} characters`
  )
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/\d/, "Must contain at least one digit")
  .regex(
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
    "Must contain at least one special character"
  )
