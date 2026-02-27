import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createInvestigation } from "@/actions/investigation"
import Link from "next/link"

export default function NewInvestigationPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to Dashboard
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Start New Investigation</CardTitle>
          <CardDescription>
            Provide a clear, descriptive title for this investigation. You can always update it later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createInvestigation} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Investigation Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g. OOS result for Batch 240112 — HPLC Assay"
                required
                minLength={5}
                className="text-base"
                autoFocus
              />
              <p className="text-xs text-slate-500">
                Be specific. Include product, batch, or event type where applicable.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-blue-700 hover:bg-blue-800">
                Create Investigation →
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
