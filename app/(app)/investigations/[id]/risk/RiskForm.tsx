"use client"

import { useState } from "react"
import { StepShell } from "@/components/investigation/StepShell"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { RISK_QUESTIONS, calculateRiskLevel, RISK_LEVEL_COLORS } from "@/lib/risk-calculator"
import { saveRiskAssessment } from "@/actions/investigation"
import { toast } from "sonner"

interface ExistingData {
  q1Score: number
  q2Score: number
  q3Score: number
  q4Score: number
  q5Score: number
}

interface RiskFormProps {
  id: string
  existing: ExistingData | null
}

export function RiskForm({ id, existing }: RiskFormProps) {
  const [scores, setScores] = useState<Record<string, number>>(
    existing
      ? {
          q1: existing.q1Score,
          q2: existing.q2Score,
          q3: existing.q3Score,
          q4: existing.q4Score,
          q5: existing.q5Score,
        }
      : {}
  )
  const [submitting, setSubmitting] = useState(false)

  const allAnswered = RISK_QUESTIONS.every((q) => scores[q.id] !== undefined)
  const scoreValues = RISK_QUESTIONS.map((q) => scores[q.id] ?? 0)
  const { totalScore, riskLevel } = allAnswered
    ? calculateRiskLevel(scoreValues)
    : { totalScore: 0, riskLevel: "LOW" as const }

  async function handleSubmit() {
    if (!allAnswered) {
      toast.error("Please answer all 5 questions")
      return
    }
    setSubmitting(true)
    const fd = new FormData()
    RISK_QUESTIONS.forEach((q) => fd.append(`${q.id}Score`, String(scores[q.id])))
    await saveRiskAssessment(id, fd)
  }

  return (
    <StepShell
      stepNumber={2}
      title="Risk Assessment"
      description="Answer 5 questions to determine the risk level of this investigation."
      investigationId={id}
    >
      <div className="space-y-6">
        {RISK_QUESTIONS.map((question, idx) => (
          <div key={question.id} className="space-y-3">
            <p className="text-sm font-medium text-slate-800">
              <span className="text-slate-400 mr-1.5">{idx + 1}.</span>
              {question.text}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {question.options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setScores((prev) => ({ ...prev, [question.id]: option.value }))
                  }
                  className={cn(
                    "p-3 rounded-lg border text-sm font-medium transition-all text-center",
                    scores[question.id] === option.value
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Live score */}
        {allAnswered && (
          <div className="p-4 rounded-lg border bg-slate-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Total Score</p>
                <p className="text-3xl font-bold text-slate-900 mt-0.5">{totalScore}</p>
                <p className="text-xs text-slate-400">out of 15</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Risk Level</p>
                <span
                  className={cn(
                    "inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold border",
                    RISK_LEVEL_COLORS[riskLevel]
                  )}
                >
                  {riskLevel}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              5–7 = Low &nbsp;·&nbsp; 8–11 = Medium &nbsp;·&nbsp; 12–15 = High
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            className="bg-blue-700 hover:bg-blue-800"
          >
            {submitting ? "Saving..." : "Save & Continue →"}
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            ← Back
          </Button>
        </div>
      </div>
    </StepShell>
  )
}
