"use client"

import { useState, useTransition } from "react"
import { StepShell } from "@/components/investigation/StepShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { saveFiveWhys } from "@/actions/investigation"

interface WhyEntry {
  whyNumber: number
  whyQuestion: string
  answer: string
  evidence: string
}

interface FiveWhysFormProps {
  id: string
  existing: WhyEntry[]
}

function buildInitialWhys(existing: WhyEntry[]): WhyEntry[] {
  return Array.from({ length: 5 }, (_, i) => {
    const num = i + 1
    const found = existing.find((w) => w.whyNumber === num)
    return found ?? { whyNumber: num, whyQuestion: "", answer: "", evidence: "" }
  })
}

export function FiveWhysForm({ id, existing }: FiveWhysFormProps) {
  const [whys, setWhys] = useState<WhyEntry[]>(buildInitialWhys(existing))
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function updateWhy(index: number, field: keyof WhyEntry, value: string | number) {
    setWhys((prev) =>
      prev.map((w, i) => (i === index ? { ...w, [field]: value } : w))
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const emptyEvidence = whys.filter((w) => w.evidence.trim() === "")
    if (emptyEvidence.length > 0) {
      setError(
        `Please provide evidence for Why ${emptyEvidence.map((w) => w.whyNumber).join(", ")}.`
      )
      return
    }

    startTransition(async () => {
      // saveFiveWhys redirects on success; if it returns, there was an error
      await saveFiveWhys(id, whys)
    })
  }

  return (
    <StepShell
      stepNumber={4}
      title="Five Whys Analysis"
      description="Ask 'why' five times to uncover the root cause of the problem."
      investigationId={id}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {whys.map((why, index) => {
          const prevAnswer = index > 0 ? whys[index - 1].answer : null
          const hasEvidence = why.evidence.trim().length > 0

          return (
            <Card
              key={why.whyNumber}
              className="border border-slate-200 shadow-sm"
            >
              <CardHeader className="pb-3 pt-4 px-5">
                <CardTitle className="flex items-center gap-3 text-base">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0">
                    {why.whyNumber}
                  </span>
                  <span className="text-slate-800">Why {why.whyNumber}</span>
                  {!hasEvidence && (
                    <Badge variant="destructive" className="ml-auto text-xs">
                      Evidence required
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-4">
                {/* Why Question */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor={`whyQuestion-${index}`}
                    className="text-sm font-medium text-slate-700"
                  >
                    Question
                  </Label>
                  <Input
                    id={`whyQuestion-${index}`}
                    value={why.whyQuestion}
                    onChange={(e) =>
                      updateWhy(index, "whyQuestion", e.target.value)
                    }
                    placeholder={
                      prevAnswer
                        ? `Why did "${prevAnswer.slice(0, 40)}${prevAnswer.length > 40 ? "\u2026" : ""}" happen?`
                        : "Why did [previous answer] happen?"
                    }
                    className="text-sm"
                  />
                </div>

                {/* Answer */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor={`answer-${index}`}
                    className="text-sm font-medium text-slate-700"
                  >
                    Answer
                  </Label>
                  <Textarea
                    id={`answer-${index}`}
                    value={why.answer}
                    onChange={(e) => updateWhy(index, "answer", e.target.value)}
                    placeholder="Describe what caused this..."
                    rows={2}
                    className="resize-none text-sm"
                  />
                </div>

                {/* Evidence */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor={`evidence-${index}`}
                    className="text-sm font-medium text-slate-700"
                  >
                    Evidence <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id={`evidence-${index}`}
                    value={why.evidence}
                    onChange={(e) =>
                      updateWhy(index, "evidence", e.target.value)
                    }
                    placeholder="What evidence supports this? Batch records, logs, observations..."
                    rows={2}
                    className={`resize-none text-sm ${!hasEvidence ? "border-red-300 focus-visible:ring-red-400" : ""}`}
                  />
                  {!hasEvidence && (
                    <p className="text-xs text-red-600">
                      Evidence is required for every why.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}

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
