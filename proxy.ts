import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const session = req.auth
  const pathname = req.nextUrl.pathname

  // Not logged in → redirect to login
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const role = session.user?.role ?? ""

  // Admin-only routes
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }

  // Viewer cannot access edit routes
  if (
    role === "VIEWER" &&
    (pathname.includes("/new") ||
      pathname.endsWith("/problem") ||
      pathname.endsWith("/risk") ||
      pathname.endsWith("/category") ||
      pathname.endsWith("/five-whys") ||
      pathname.endsWith("/root-cause") ||
      pathname.endsWith("/capa") ||
      pathname.endsWith("/effectiveness") ||
      pathname.endsWith("/close"))
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login|unauthorized).*)",
  ],
}
