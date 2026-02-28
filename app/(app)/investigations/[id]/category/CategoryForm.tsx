"use client"

import { useState, useTransition } from "react"
import { StepShell } from "@/components/investigation/StepShell"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { saveProblemCategory } from "@/actions/investigation"

interface CategoryFormProps {
  id: string
  existing: { category: string; justification: string } | null
}

const CATEGORIES = [
  {
    value: "HUMAN",
    emoji: "\u{1F464}",
    label: "Human",
    description: "Error caused by human action, inaction, or decision-making",
  },
  {
    value: "PROCESS",
    emoji: "\u{2699}\u{FE0F}",
    label: "Process",
    description: "Failure in a defined procedure, workflow, or business process",
  },
  {
    value: "EQUIPMENT",
    emoji: "\u{1F527}",
    label: "Equipment",
    description: "Malfunction or failure of machinery, tools, or instruments",
  },
  {
    value: "MATERIAL",
    emoji: "\u{1F4E6}",
    label: "Material",
    description: "Defect or issue with raw materials, components, or supplies",
  },
  {
    value: "MEASUREMENT",
    emoji: "\u{1F4CF}",
    label: "Measurement",
    description: "Inaccurate measurement, calibration error, or data collection issue",
  },
  {
    value: "ENVIRONMENT",
    emoji: "\u{1F30D}",
    label: "Environment",
    description: "Environmental conditions such as temperature, humidity, or contamination",
  },
]

export function CategoryForm({ id, existing }: CategoryFormProps) {
  const [selected, setSelected] = useState<string | null>(existing?.category ?? null)
  const [justification, setJustification] = useState(existing?.justification ?? "")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    setError(null)

    if (!selected) {
      setError("Please select a problem category.")
      return
    }
    if (justification.trim().length < 10) {
      setError("Justification must be at least 10 characters.")
      return
    }

    const fd = new FormData()
    fd.append("category", selected)
    fd.append("justification", justification)

    startTransition(async () => {
      await saveProblemCategory(id, fd)
    })
  }

  return (
    <StepShell
      stepNumber={4}
      title="Problem Category"
      description="Classify the type of problem to guide your investigation approach."
      investigationId={id}
    >
      <div className="space-y-8">
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">
            Problem Category <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-1 gap-3">
            {CATEGORIES.map((cat) => {
              const isSelected = selected === cat.value
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setSelected(cat.value)}
                  className={cn(
                    "relative flex cursor-pointer rounded-lg border p-4 shadow-sm transition-colors text-left",
                    isSelected
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                      : "border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50"
                  )}
                >
                  <div className="flex items-center gap-4 w-full">
                    <span className="text-3xl flex-shrink-0">{cat.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{cat.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <div
                        className={cn(
                          "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                          isSelected ? "border-blue-600" : "border-slate-300"
                        )}
                      >
                        <div
                          className={cn(
                            "h-2 w-2 rounded-full",
                            isSelected ? "bg-blue-600" : "bg-transparent"
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="justification" className="text-sm font-medium text-slate-700">
            Justification <span className="text-red-500">*</span>
          </Label>
          <p className="text-xs text-slate-500">
            Explain why this category best fits the problem. Minimum 10 characters.
          </p>
          <Textarea
            id="justification"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            rows={4}
            placeholder="Describe the reasoning behind your category selection..."
            className="resize-none"
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </div>
    </StepShell>
  )
}
