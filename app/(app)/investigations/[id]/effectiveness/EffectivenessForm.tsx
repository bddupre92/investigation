"use client"

import { useState, useTransition } from "react"
import { StepShell } from "@/components/investigation/StepShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  saveEffectivenessSetup,
  saveEffectivenessResult,
} from "@/actions/investigation"

interface ExistingEffectiveness {
  monitoringPeriodDays: number
  verificationMethod: string
  successCriteria: string
  result: string
  resultDetail: string | null
  reviewerName: string | null
  reviewerApproved: boolean
}

interface EffectivenessFormProps {
  id: string
  userRole: string
  existing: ExistingEffectiveness | null
}

const REVIEWER_ROLES = ["ADMIN", "REVIEWER"]

export function EffectivenessForm({
  id,
  userRole,
  existing,
}: EffectivenessFormProps) {
  const isReviewer = REVIEWER_ROLES.includes(userRole)

  // Section 1 state
  const [monitoringPeriodDays, setMonitoringPeriodDays] = useState(
    existing?.monitoringPeriodDays?.toString() ?? ""
  )
  const [verificationMethod, setVerificationMethod] = useState(
    existing?.verificationMethod ?? ""
  )
  const [successCriteria, setSuccessCriteria] = useState(
    existing?.successCriteria ?? ""
  )
  const [setupError, setSetupError] = useState<string | null>(null)
  const [setupSuccess, setSetupSuccess] = useState(false)
  const [isSetupPending, startSetupTransition] = useTransition()

  // Section 2 state
  const [result, setResult] = useState(existing?.result ?? "EFFECTIVE")
  const [resultDetail, setResultDetail] = useState(
    existing?.resultDetail ?? ""
  )
  const [reviewerName, setReviewerName] = useState(
    existing?.reviewerName ?? ""
  )
  const [reviewerNotes, setReviewerNotes] = useState("")
  const [resultError, setResultError] = useState<string | null>(null)
  const [isResultPending, startResultTransition] = useTransition()

  function handleSetupSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSetupError(null)
    setSetupSuccess(false)

    const formData = new FormData()
    formData.append("monitoringPeriodDays", monitoringPeriodDays)
    formData.append("verificationMethod", verificationMethod)
    formData.append("successCriteria", successCriteria)

    startSetupTransition(async () => {
      const res = await saveEffectivenessSetup(id, formData)
      if (res && "error" in res) {
        setSetupError("Failed to save setup. Please check your inputs.")
      } else {
        setSetupSuccess(true)
      }
    })
  }

  function handleResultSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResultError(null)

    if (!resultDetail.trim()) {
      setResultError("Result detail is required.")
      return
    }
    if (!reviewerName.trim()) {
      setResultError("Reviewer name is required.")
      return
    }

    const formData = new FormData()
    formData.append("result", result)
    formData.append("resultDetail", resultDetail)
    formData.append("reviewerName", reviewerName)
    if (reviewerNotes.trim()) {
      formData.append("reviewerNotes", reviewerNotes)
    }

    startResultTransition(async () => {
      const res = await saveEffectivenessResult(id, formData)
      if (res && "error" in res) {
        setResultError(
          typeof res.error === "string"
            ? res.error
            : "Failed to record result. Please try again."
        )
      }
    })
  }

  return (
    <StepShell
      stepNumber={7}
      title="Effectiveness Verification"
      description="Define how effectiveness will be monitored and record the outcome."
      investigationId={id}
    >
      <div className="space-y-10">
        {/* Section 1: Setup */}
        <section className="space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
              Section 1 — Monitoring Setup
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Define how the effectiveness of CAPA actions will be verified.
            </p>
          </div>

          <form onSubmit={handleSetupSubmit} className="space-y-4">
            {/* Monitoring Period */}
            <div className="space-y-1.5">
              <Label
                htmlFor="monitoringPeriodDays"
                className="text-sm font-medium text-slate-700"
              >
                Monitoring Period (days) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="monitoringPeriodDays"
                type="number"
                min={1}
                required
                value={monitoringPeriodDays}
                onChange={(e) => setMonitoringPeriodDays(e.target.value)}
                placeholder="e.g. 90"
                className="max-w-xs text-sm"
              />
            </div>

            {/* Verification Method */}
            <div className="space-y-1.5">
              <Label
                htmlFor="verificationMethod"
                className="text-sm font-medium text-slate-700"
              >
                Verification Method <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="verificationMethod"
                required
                value={verificationMethod}
                onChange={(e) => setVerificationMethod(e.target.value)}
                placeholder="Describe how effectiveness will be verified..."
                rows={3}
                className="resize-none text-sm"
              />
            </div>

            {/* Success Criteria */}
            <div className="space-y-1.5">
              <Label
                htmlFor="successCriteria"
                className="text-sm font-medium text-slate-700"
              >
                Success Criteria <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="successCriteria"
                required
                value={successCriteria}
                onChange={(e) => setSuccessCriteria(e.target.value)}
                placeholder="What measurable outcomes indicate success?"
                rows={3}
                className="resize-none text-sm"
              />
            </div>

            {setupError && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{setupError}</p>
              </div>
            )}

            {setupSuccess && (
              <div className="rounded-md bg-green-50 border border-green-200 p-3">
                <p className="text-sm text-green-700">Setup saved successfully.</p>
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={isSetupPending}>
                {isSetupPending ? "Saving..." : "Save Setup"}
              </Button>
            </div>
          </form>
        </section>

        <Separator />

        {/* Section 2: Result */}
        <section className="space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
              Section 2 — Effectiveness Result
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Record the outcome of the effectiveness verification period.
            </p>
          </div>

          {isReviewer ? (
            <form onSubmit={handleResultSubmit} className="space-y-4">
              {/* Result */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">
                  Result <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={result === "EFFECTIVE" ? "default" : "outline"}
                    className={
                      result === "EFFECTIVE"
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "text-slate-600"
                    }
                    onClick={() => setResult("EFFECTIVE")}
                  >
                    Effective
                  </Button>
                  <Button
                    type="button"
                    variant={result === "NOT_EFFECTIVE" ? "default" : "outline"}
                    className={
                      result === "NOT_EFFECTIVE"
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "text-slate-600"
                    }
                    onClick={() => setResult("NOT_EFFECTIVE")}
                  >
                    Not Effective
                  </Button>
                </div>
              </div>

              {result === "NOT_EFFECTIVE" && (
                <Alert className="border-orange-300 bg-orange-50">
                  <AlertDescription className="text-orange-800 text-sm">
                    Marking as Not Effective will reopen the CAPA section for
                    further action.
                  </AlertDescription>
                </Alert>
              )}

              {/* Result Detail */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="resultDetail"
                  className="text-sm font-medium text-slate-700"
                >
                  Result Detail <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="resultDetail"
                  required
                  value={resultDetail}
                  onChange={(e) => setResultDetail(e.target.value)}
                  placeholder="Describe the findings and evidence supporting this result..."
                  rows={4}
                  className="resize-none text-sm"
                />
              </div>

              {/* Reviewer Name */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="reviewerName"
                  className="text-sm font-medium text-slate-700"
                >
                  Reviewer Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="reviewerName"
                  required
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="Full name of the reviewer"
                  className="text-sm"
                />
              </div>

              {/* Reviewer Notes */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="reviewerNotes"
                  className="text-sm font-medium text-slate-700"
                >
                  Reviewer Notes{" "}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="reviewerNotes"
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  placeholder="Additional comments or observations..."
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>

              {resultError && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-700">{resultError}</p>
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
                <Button type="submit" disabled={isResultPending}>
                  {isResultPending
                    ? "Recording..."
                    : "Record Result & Approve"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-sm font-medium text-slate-700">
                Awaiting reviewer approval
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Only users with the Reviewer or Admin role can record the
                effectiveness result.
              </p>
            </div>
          )}
        </section>
      </div>
    </StepShell>
  )
}
