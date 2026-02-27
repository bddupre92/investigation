import type { NextAuthConfig } from "next-auth"

// Edge-compatible auth config — no Node.js crypto imports (no Credentials provider here)
// Used by proxy.ts (middleware) which runs in Edge runtime
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [], // Credentials added only in auth.ts (server-side)
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role: string }).role
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as string
      return session
    },
  },
}
