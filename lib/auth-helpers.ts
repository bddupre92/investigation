import { headers } from "next/headers"

/**
 * Extract client IP from request headers (Vercel serverless).
 * x-forwarded-for may contain multiple IPs: "client, proxy1, proxy2"
 */
export async function getClientIp(): Promise<string | null> {
  const h = await headers()

  const forwarded = h.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }

  return h.get("x-real-ip")
}

/**
 * Extract user agent from request headers.
 */
export async function getUserAgent(): Promise<string | null> {
  const h = await headers()
  return h.get("user-agent")
}
