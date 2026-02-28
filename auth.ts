import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { authConfig } from "./auth.config"
import { AUTH_CONFIG } from "@/lib/auth-constants"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: {
    strategy: "jwt",
    maxAge: AUTH_CONFIG.SESSION_MAX_AGE_SECONDS,
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id as string
        token.role = (user as { role: string }).role
      }

      // On sign-in only: generate JTI and create DB session
      if (trigger === "signIn" && user) {
        const jti = crypto.randomUUID()
        token.jti = jti

        try {
          // Dynamic imports — only loaded during login, not on every auth() call
          const [{ createActiveSession }, { getClientIp, getUserAgent }] =
            await Promise.all([
              import("@/lib/session-manager"),
              import("@/lib/auth-helpers"),
            ])

          const [ipAddress, userAgent] = await Promise.all([
            getClientIp(),
            getUserAgent(),
          ])

          await createActiveSession({
            jti,
            userId: user.id as string,
            userAgent,
            ipAddress,
            expiresAt: new Date(Date.now() + AUTH_CONFIG.SESSION_MAX_AGE_SECONDS * 1000),
          })
        } catch (err) {
          console.error("Failed to create active session:", err)
          delete token.jti
        }
      }

      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as string
      return session
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        // Dynamic imports — only loaded during login attempts
        const [{ checkIpRateLimit, checkAccountLockout, recordLoginAttempt }, { getClientIp }, { logAudit, AUDIT_ACTIONS }] =
          await Promise.all([
            import("@/lib/rate-limit"),
            import("@/lib/auth-helpers"),
            import("@/lib/audit"),
          ])

        const email = parsed.data.email.toLowerCase()
        const ipAddress = await getClientIp()

        // 1. Check IP-based rate limiting
        const ipCheck = await checkIpRateLimit(ipAddress ?? "unknown")
        if (!ipCheck.allowed) return null

        // 2. Check account lockout
        const lockoutCheck = await checkAccountLockout(email)
        if (!lockoutCheck.allowed) return null

        // 3. Find user
        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.active) {
          await recordLoginAttempt(email, ipAddress, false)
          logAudit({ userEmail: email, action: AUDIT_ACTIONS.USER_LOGIN_FAILED, ipAddress, metadata: { reason: "invalid_credentials" } })
          return null
        }

        // 4. Verify password
        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!valid) {
          await recordLoginAttempt(email, ipAddress, false)
          logAudit({ userId: user.id, userEmail: email, action: AUDIT_ACTIONS.USER_LOGIN_FAILED, ipAddress, metadata: { reason: "invalid_credentials" } })
          return null
        }

        // 5. Success
        await recordLoginAttempt(email, ipAddress, true)
        logAudit({ userId: user.id, userEmail: email, action: AUDIT_ACTIONS.USER_LOGIN, ipAddress })

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
})
