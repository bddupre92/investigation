"use server"

import { signIn } from "@/auth"
import { checkIpRateLimit, checkAccountLockout } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/auth-helpers"

export interface LoginResult {
  success: boolean
  error?: string
  locked?: boolean
  rateLimited?: boolean
  retryAfterMs?: number
}

export async function loginAction(
  email: string,
  password: string
): Promise<LoginResult> {
  const ipAddress = (await getClientIp()) ?? "unknown"

  // Pre-check IP rate limiting
  const ipCheck = await checkIpRateLimit(ipAddress)
  if (!ipCheck.allowed) {
    return {
      success: false,
      error: ipCheck.reason,
      rateLimited: true,
      retryAfterMs: ipCheck.retryAfterMs,
    }
  }

  // Pre-check account lockout
  const lockoutCheck = await checkAccountLockout(email.toLowerCase())
  if (!lockoutCheck.allowed) {
    return {
      success: false,
      error: lockoutCheck.reason,
      locked: true,
      retryAfterMs: lockoutCheck.retryAfterMs,
    }
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    })
    return { success: true }
  } catch {
    return {
      success: false,
      error: "Invalid email or password",
    }
  }
}
