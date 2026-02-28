"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { loginAction } from "@/actions/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [retryAfterMs, setRetryAfterMs] = useState<number | null>(null)
  const [countdown, setCountdown] = useState(0)

  // Countdown timer for rate limit / lockout
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    setRetryAfterMs(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const result = await loginAction(email, password)

    setLoading(false)

    if (!result.success) {
      setError(result.error ?? "Invalid email or password")
      if (result.retryAfterMs) {
        setRetryAfterMs(result.retryAfterMs)
        setCountdown(Math.ceil(result.retryAfterMs / 1000))
      }
      return
    }

    router.push("/dashboard")
    router.refresh()
  }, [router])

  const isBlocked = countdown > 0

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-blue-700 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">IQ</span>
          </div>
          <span className="font-semibold text-slate-800">InvestigationIQ</span>
        </div>
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <CardDescription>
          Enter your credentials to access your investigations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {error}
                {isBlocked && (
                  <span className="block mt-1 text-xs">
                    Try again in {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || isBlocked}>
            {loading ? "Signing in..." : isBlocked ? `Locked (${countdown}s)` : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
