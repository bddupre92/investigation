import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function UnauthorizedPage() {
  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <CardTitle>Access Denied</CardTitle>
        <CardDescription>
          You don&apos;t have permission to access this page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
