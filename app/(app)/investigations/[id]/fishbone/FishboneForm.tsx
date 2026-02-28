"use client"

import { useState, useTransition } from "react"
import { StepShell } from "@/components/investigation/StepShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { saveFishbone } from "@/actions/investigation"
import { toast } from "sonner"

interface CauseEntry {
  clientId: string
  category: string
  cause: string
  evidence: string
}

interface FishboneFormProps {
  id: string
  existing: Array<{ category: string; cause: string; evidence: string }>
}

const CATEGORIES = [
  { value: "MAN", emoji: "\uD83D\uDC64", label: "Man / Human", description: "Human factors, training, skills, procedures followed" },
  { value: "MACHINE", emoji: "\uD83D\uDD27", label: "Machine / Equipment", description: "Equipment, tools, instruments, software" },
  { value: "METHOD", emoji: "\u2699\uFE0F", label: "Method / Process", description: "Procedures, workflows, work instructions" },
  { value: "MATERIAL", emoji: "\uD83D\uDCE6", label: "Material", description: "Raw materials, components, consumables, supplies" },
  { value: "MEASUREMENT", emoji: "\uD83D\uDCCF", label: "Measurement", description: "Calibration, testing, data collection, inspection" },
  { value: "ENVIRONMENT", emoji: "\uD83C\uDF0D", label: "Environment", description: "Temperature, humidity, cleanliness, contamination" },
]

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function buildInitialCauses(existing: FishboneFormProps["existing"]): CauseEntry[] {
  if (existing.length === 0) return []
  return existing.map((e) => ({
    clientId: generateId(),
    category: e.category,
    cause: e.cause,
    evidence: e.evidence,
  }))
}

export function FishboneForm({ id, existing }: FishboneFormProps) {
  const [causes, setCauses] = useState<CauseEntry[]>(() => buildInitialCauses(existing))
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function addCause(category: string) {
    setCauses((prev) => [
      ...prev,
      { clientId: generateId(), category, cause: "", evidence: "" },
    ])
  }

  function removeCause(clientId: string) {
    setCauses((prev) => prev.filter((c) => c.clientId !== clientId))
  }

  function updateCause(clientId: string, field: "cause" | "evidence", value: string) {
    setCauses((prev) =>
      prev.map((c) => (c.clientId === clientId ? { ...c, [field]: value } : c))
    )
  }

  function getCausesForCategory(category: string): CauseEntry[] {
    return causes.filter((c) => c.category === category)
  }

  function handleSubmit() {
    setError(null)

    if (causes.length === 0) {
      setError("Please add at least one cause to any category.")
      return
    }

    for (const cause of causes) {
      if (cause.cause.trim().length < 5) {
        setError("All causes must be at least 5 characters.")
        return
      }
    }

    startTransition(async () => {
      const result = await saveFishbone(
        id,
        causes.map((c) => ({
          category: c.category,
          cause: c.cause,
          evidence: c.evidence || undefined,
        }))
      )
      if (result?.error) {
        setError(typeof result.error === "string" ? result.error : "Validation error")
      } else {
        toast.success("Fishbone analysis saved")
      }
    })
  }

  return (
    <StepShell
      stepNumber={6}
      title="Fishbone / Ishikawa Analysis"
      description="Identify potential causes across 6 categories. Add causes under each category and provide supporting evidence."
      investigationId={id}
    >
      <div className="space-y-4">
        {CATEGORIES.map((cat) => {
          const categoryCauses = getCausesForCategory(cat.value)

          return (
            <Card key={cat.value} className="border-slate-200">
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{cat.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{cat.label}</p>
                      <p className="text-[11px] text-slate-500">{cat.description}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">
                    {categoryCauses.length} cause{categoryCauses.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                {categoryCauses.map((cause, idx) => (
                  <div key={cause.clientId} className="rounded-md border border-slate-100 bg-slate-50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-slate-600">
                        Cause {idx + 1}
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-600 text-xs h-6 px-2"
                        onClick={() => removeCause(cause.clientId)}
                      >
                        Remove
                      </Button>
                    </div>
                    <Input
                      value={cause.cause}
                      onChange={(e) => updateCause(cause.clientId, "cause", e.target.value)}
                      placeholder="Describe the potential cause..."
                      className="text-sm"
                    />
                    <Textarea
                      value={cause.evidence}
                      onChange={(e) => updateCause(cause.clientId, "evidence", e.target.value)}
                      placeholder="Evidence or supporting data (optional)"
                      rows={2}
                      className="text-sm resize-none"
                    />
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => addCause(cat.value)}
                >
                  + Add Cause
                </Button>
              </CardContent>
            </Card>
          )
        })}

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </StepShell>
  )
}
