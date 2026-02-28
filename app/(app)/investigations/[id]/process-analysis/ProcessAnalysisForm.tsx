"use client"

import { useState, useTransition } from "react"
import { StepShell } from "@/components/investigation/StepShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { saveProcessAnalysis } from "@/actions/investigation"
import { toast } from "sonner"

interface StepEntry {
  clientId: string
  stepNumber: number
  processStep: string
  expected: string
  actual: string
  deviation: boolean
  deviationDetail: string
}

interface ProcessAnalysisFormProps {
  id: string
  existing: Array<{
    stepNumber: number
    processStep: string
    expected: string
    actual: string
    deviation: boolean
    deviationDetail: string
  }>
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function buildInitialSteps(existing: ProcessAnalysisFormProps["existing"]): StepEntry[] {
  if (existing.length > 0) {
    return existing.map((s) => ({ clientId: generateId(), ...s }))
  }
  return [
    {
      clientId: generateId(),
      stepNumber: 1,
      processStep: "",
      expected: "",
      actual: "",
      deviation: false,
      deviationDetail: "",
    },
  ]
}

export function ProcessAnalysisForm({ id, existing }: ProcessAnalysisFormProps) {
  const [steps, setSteps] = useState<StepEntry[]>(() => buildInitialSteps(existing))
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function addStep() {
    const nextNum = steps.length > 0 ? Math.max(...steps.map((s) => s.stepNumber)) + 1 : 1
    setSteps((prev) => [
      ...prev,
      {
        clientId: generateId(),
        stepNumber: nextNum,
        processStep: "",
        expected: "",
        actual: "",
        deviation: false,
        deviationDetail: "",
      },
    ])
  }

  function removeStep(clientId: string) {
    setSteps((prev) => {
      const filtered = prev.filter((s) => s.clientId !== clientId)
      return filtered.map((s, idx) => ({ ...s, stepNumber: idx + 1 }))
    })
  }

  function updateStep(clientId: string, field: keyof StepEntry, value: string | boolean) {
    setSteps((prev) =>
      prev.map((s) => (s.clientId === clientId ? { ...s, [field]: value } : s))
    )
  }

  function handleSubmit() {
    setError(null)

    if (steps.length === 0) {
      setError("Please add at least one process step.")
      return
    }

    for (const step of steps) {
      if (step.processStep.trim().length < 5) {
        setError(`Step ${step.stepNumber}: Process step description must be at least 5 characters.`)
        return
      }
      if (step.expected.trim().length < 5) {
        setError(`Step ${step.stepNumber}: Expected outcome must be at least 5 characters.`)
        return
      }
      if (step.actual.trim().length < 5) {
        setError(`Step ${step.stepNumber}: Actual outcome must be at least 5 characters.`)
        return
      }
    }

    startTransition(async () => {
      const result = await saveProcessAnalysis(
        id,
        steps.map((s) => ({
          stepNumber: s.stepNumber,
          processStep: s.processStep,
          expected: s.expected,
          actual: s.actual,
          deviation: s.deviation,
          deviationDetail: s.deviationDetail || undefined,
        }))
      )
      if (result?.error) {
        setError(typeof result.error === "string" ? result.error : "Validation error")
      } else {
        toast.success("Process analysis saved")
      }
    })
  }

  return (
    <StepShell
      stepNumber={8}
      title="Process Analysis Table"
      description="Map each step of the process, recording what was expected vs. what actually happened. Flag any deviations to identify where things went wrong."
      investigationId={id}
    >
      <div className="space-y-4">
        {steps.map((step) => (
          <Card
            key={step.clientId}
            className={cn(
              "border-slate-200",
              step.deviation && "border-amber-300 bg-amber-50/30"
            )}
          >
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold",
                      step.deviation
                        ? "bg-amber-500 text-white"
                        : "bg-blue-600 text-white"
                    )}
                  >
                    {step.stepNumber}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    Process Step {step.stepNumber}
                  </span>
                  {step.deviation && (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                      Deviation
                    </span>
                  )}
                </div>
                {steps.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-600 text-xs h-6 px-2"
                    onClick={() => removeStep(step.clientId)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div>
                <Label className="text-xs font-medium text-slate-600">
                  Process Step Description <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={step.processStep}
                  onChange={(e) => updateStep(step.clientId, "processStep", e.target.value)}
                  placeholder="What happens at this step?"
                  className="mt-1 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-slate-600">
                    Expected Outcome <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={step.expected}
                    onChange={(e) => updateStep(step.clientId, "expected", e.target.value)}
                    placeholder="What should happen?"
                    rows={2}
                    className="mt-1 text-sm resize-none"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">
                    Actual Outcome <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={step.actual}
                    onChange={(e) => updateStep(step.clientId, "actual", e.target.value)}
                    placeholder="What actually happened?"
                    rows={2}
                    className="mt-1 text-sm resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => updateStep(step.clientId, "deviation", !step.deviation)}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                    step.deviation ? "bg-amber-500" : "bg-slate-200"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                      step.deviation ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </button>
                <Label className="text-xs text-slate-600 cursor-pointer" onClick={() => updateStep(step.clientId, "deviation", !step.deviation)}>
                  Deviation found at this step
                </Label>
              </div>

              {step.deviation && (
                <div>
                  <Label className="text-xs font-medium text-slate-600">Deviation Detail</Label>
                  <Textarea
                    value={step.deviationDetail}
                    onChange={(e) => updateStep(step.clientId, "deviationDetail", e.target.value)}
                    placeholder="Describe the deviation..."
                    rows={2}
                    className="mt-1 text-sm resize-none"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-center pt-2">
          <Button type="button" variant="outline" onClick={addStep} className="text-sm">
            + Add Process Step
          </Button>
        </div>

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
