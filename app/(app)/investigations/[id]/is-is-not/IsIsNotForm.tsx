"use client"

import { useState, useTransition } from "react"
import { StepShell } from "@/components/investigation/StepShell"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { saveIsIsNot } from "@/actions/investigation"
import { toast } from "sonner"

interface Entry {
  dimension: string
  isDescription: string
  isNotDescription: string
  distinction: string
}

interface IsIsNotFormProps {
  id: string
  existing: Entry[]
}

const DIMENSIONS = [
  { key: "WHAT", label: "What", hint: "What is the problem? What is it not?" },
  { key: "WHERE", label: "Where", hint: "Where does it occur? Where does it not?" },
  { key: "WHEN", label: "When", hint: "When does it happen? When does it not?" },
  { key: "EXTENT", label: "Extent", hint: "How much / how many? What extent is it not?" },
]

function buildInitialEntries(existing: Entry[]): Entry[] {
  if (existing.length > 0) return existing
  return DIMENSIONS.map((d) => ({
    dimension: d.key,
    isDescription: "",
    isNotDescription: "",
    distinction: "",
  }))
}

export function IsIsNotForm({ id, existing }: IsIsNotFormProps) {
  const [entries, setEntries] = useState<Entry[]>(() => buildInitialEntries(existing))
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function updateEntry(dimension: string, field: keyof Entry, value: string) {
    setEntries((prev) =>
      prev.map((e) => (e.dimension === dimension ? { ...e, [field]: value } : e))
    )
  }

  function handleSubmit() {
    setError(null)

    const filled = entries.filter(
      (e) => e.isDescription.trim().length > 0 || e.isNotDescription.trim().length > 0
    )

    if (filled.length === 0) {
      setError("Please fill in at least one dimension.")
      return
    }

    for (const entry of filled) {
      if (entry.isDescription.trim().length < 5) {
        setError(`"Is" description for ${entry.dimension} must be at least 5 characters.`)
        return
      }
      if (entry.isNotDescription.trim().length < 5) {
        setError(`"Is Not" description for ${entry.dimension} must be at least 5 characters.`)
        return
      }
    }

    startTransition(async () => {
      const result = await saveIsIsNot(
        id,
        filled.map((e) => ({
          dimension: e.dimension,
          isDescription: e.isDescription,
          isNotDescription: e.isNotDescription,
          distinction: e.distinction || undefined,
        }))
      )
      if (result?.error) {
        setError(typeof result.error === "string" ? result.error : "Validation error")
      } else {
        toast.success("Is / Is Not analysis saved")
      }
    })
  }

  return (
    <StepShell
      stepNumber={7}
      title="Is / Is Not Analysis"
      description="For each dimension, describe what the problem IS and what it IS NOT. Identify key distinctions to sharpen your investigation focus."
      investigationId={id}
    >
      <div className="space-y-6">
        {/* Header row */}
        <div className="hidden sm:grid grid-cols-[120px_1fr_1fr_1fr] gap-3">
          <div />
          <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            IS
          </Label>
          <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            IS NOT
          </Label>
          <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Distinction
          </Label>
        </div>

        {DIMENSIONS.map((dim) => {
          const entry = entries.find((e) => e.dimension === dim.key)!
          return (
            <div
              key={dim.key}
              className="rounded-lg border border-slate-200 bg-white p-4 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-[120px_1fr_1fr_1fr] sm:gap-3 sm:items-start"
            >
              <div className="sm:pt-2">
                <p className="text-sm font-semibold text-slate-900">{dim.label}</p>
                <p className="text-[10px] text-slate-400">{dim.hint}</p>
              </div>

              <div>
                <Label className="text-xs text-slate-500 sm:hidden">IS</Label>
                <Textarea
                  value={entry.isDescription}
                  onChange={(e) => updateEntry(dim.key, "isDescription", e.target.value)}
                  placeholder="The problem is..."
                  rows={3}
                  className="text-sm resize-none mt-1"
                />
              </div>

              <div>
                <Label className="text-xs text-slate-500 sm:hidden">IS NOT</Label>
                <Textarea
                  value={entry.isNotDescription}
                  onChange={(e) => updateEntry(dim.key, "isNotDescription", e.target.value)}
                  placeholder="The problem is not..."
                  rows={3}
                  className="text-sm resize-none mt-1"
                />
              </div>

              <div>
                <Label className="text-xs text-slate-500 sm:hidden">Distinction</Label>
                <Textarea
                  value={entry.distinction}
                  onChange={(e) => updateEntry(dim.key, "distinction", e.target.value)}
                  placeholder="What's different? (optional)"
                  rows={3}
                  className="text-sm resize-none mt-1"
                />
              </div>
            </div>
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
