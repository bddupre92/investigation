"use client"

import { useState, useTransition } from "react"
import { StepShell } from "@/components/investigation/StepShell"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { saveRootCause } from "@/actions/investigation"

interface ExistingRootCause {
  rootCauseStatement: string
  validationQ1: boolean
  validationQ2: boolean
  validationQ3: boolean
  hasWarnings: boolean
  warningAcknowledged: boolean
}

interface RootCauseFormProps {
  id: string
  existing: ExistingRootCause | null
}

const VALIDATION_QUESTIONS = [
  {
    key: "validationQ1" as const,
    label: "Is this root cause supported by the evidence collected?",
  },
  {
    key: "validationQ2" as const,
    label: "Was sufficient data reviewed to confirm this root cause?",
  },
  {
    key: "validationQ3" as const,
    label: "Would eliminating this root cause prevent recurrence?",
  },
]

export function RootCauseForm({ id, existing }: RootCauseFormProps) {
  const [rootCauseStatement, setRootCauseStatement] = useState(
    existing?.rootCauseStatement ?? ""
  )
  const [validationQ1, setValidationQ1] = useState(
    existing?.validationQ1 ?? true
  )
  const [validationQ2, setValidationQ2] = useState(
    existing?.validationQ2 ?? true
  )
  const [validationQ3, setValidationQ3] = useState(
    existing?.validationQ3 ?? true
  )
  const [warningAcknowledged, setWarningAcknowledged] = useState(
    existing?.warningAcknowledged ?? false
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const validationMap = {
    validationQ1,
    validationQ2,
    validationQ3,
  }

  const setters = {
    validationQ1: setValidationQ1,
    validationQ2: setValidationQ2,
    validationQ3: setValidationQ3,
  }

  const hasWarnings = !validationQ1 || !validationQ2 || !validationQ3

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!rootCauseStatement.trim()) {
      setError("Root cause statement is required.")
      return
    }

    if (hasWarnings && !warningAcknowledged) {
      setError(
        "You must acknowledge the warning before proceeding."
      )
      return
    }

    startTransition(async () => {
      const result = await saveRootCause(id, {
        rootCauseStatement,
        validationQ1,
        validationQ2,
        validationQ3,
        warningAcknowledged,
      })
      if (result && "error" in result) {
        setError("Failed to save root cause. Please try again.")
      }
    })
  }

  return (
    <StepShell
      stepNumber={5}
      title="Root Cause Confirmation"
      description="State the confirmed root cause and validate it against key criteria."
      investigationId={id}
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Root Cause Statement */}
        <div className="space-y-2">
          <Label
            htmlFor="rootCauseStatement"
            className="text-sm font-medium text-slate-700"
          >
            Root Cause Statement <span className="text-red-500">*</span>
          </Label>
          <p className="text-xs text-slate-500">
            Write a clear, concise statement of the verified root cause.
          </p>
          <Textarea
            id="rootCauseStatement"
            value={rootCauseStatement}
            onChange={(e) => setRootCauseStatement(e.target.value)}
            required
            rows={4}
            placeholder="The root cause of this problem is..."
            className="resize-none"
          />
        </div>

        {/* Validation Questions */}
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-700">
              Validation Questions
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Answer each question to validate your root cause.
            </p>
          </div>

          {VALIDATION_QUESTIONS.map((q) => {
            const value = validationMap[q.key]
            const setter = setters[q.key]
            return (
              <div
                key={q.key}
                className="rounded-lg border border-slate-200 p-4 bg-white"
              >
                <p className="text-sm text-slate-800 font-medium mb-3">
                  {q.label}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={value === true ? "default" : "outline"}
                    className={
                      value === true
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "text-slate-600"
                    }
                    onClick={() => setter(true)}
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={value === false ? "default" : "outline"}
                    className={
                      value === false
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "text-slate-600"
                    }
                    onClick={() => setter(false)}
                  >
                    No
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Warning alert */}
        {hasWarnings && (
          <Alert className="border-yellow-300 bg-yellow-50">
            <AlertDescription className="text-yellow-800 text-sm">
              Root cause may be insufficiently supported. Please review your
              evidence before proceeding.
            </AlertDescription>
          </Alert>
        )}

        {/* Warning acknowledgement */}
        {hasWarnings && (
          <div className="flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
            <Checkbox
              id="warningAcknowledged"
              checked={warningAcknowledged}
              onCheckedChange={(checked) =>
                setWarningAcknowledged(checked === true)
              }
              className="mt-0.5"
            />
            <label
              htmlFor="warningAcknowledged"
              className="text-sm text-yellow-900 cursor-pointer leading-snug"
            >
              I acknowledge this warning and wish to proceed
            </label>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
          >
            Back
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </form>
    </StepShell>
  )
}
