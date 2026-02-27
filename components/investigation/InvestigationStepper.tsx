"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { CheckIcon } from "lucide-react"

const STEPS = [
  { number: 2, label: "Problem Definition", path: "problem" },
  { number: 3, label: "Risk Assessment", path: "risk" },
  { number: 4, label: "Problem Category", path: "category" },
  { number: 5, label: "Five Whys", path: "five-whys" },
  { number: 6, label: "Root Cause", path: "root-cause" },
  { number: 7, label: "CAPA Plan", path: "capa" },
  { number: 8, label: "Effectiveness", path: "effectiveness" },
  { number: 9, label: "Summary", path: "summary" },
]

interface InvestigationStepperProps {
  investigationId: string
  currentStep: number
  referenceNumber: string
  title: string
}

export function InvestigationStepper({
  investigationId,
  currentStep,
  referenceNumber,
  title,
}: InvestigationStepperProps) {
  return (
    <aside className="w-56 shrink-0 border-r bg-white flex flex-col h-screen sticky top-0">
      {/* Investigation header */}
      <div className="p-4 border-b">
        <p className="text-xs font-mono text-slate-400">{referenceNumber}</p>
        <p className="text-sm font-medium text-slate-800 mt-0.5 line-clamp-2">{title}</p>
      </div>

      {/* Steps */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <p className="text-xs text-slate-400 uppercase tracking-wide px-2 mb-3 font-medium">
          Investigation Steps
        </p>
        <ol className="space-y-0.5">
          {STEPS.map((step, idx) => {
            const isCompleted = currentStep > step.number
            const isCurrent = currentStep === step.number
            const isLocked = currentStep < step.number

            return (
              <li key={step.number}>
                {isLocked ? (
                  <div
                    className="flex items-center gap-2.5 px-2 py-2 rounded-md opacity-40 cursor-not-allowed"
                  >
                    <StepDot
                      number={idx + 1}
                      isCompleted={false}
                      isCurrent={false}
                    />
                    <span className="text-sm text-slate-500 leading-tight">
                      {step.label}
                    </span>
                  </div>
                ) : (
                  <Link
                    href={`/investigations/${investigationId}/${step.path}`}
                    className={cn(
                      "flex items-center gap-2.5 px-2 py-2 rounded-md transition-colors",
                      isCurrent
                        ? "bg-blue-50"
                        : "hover:bg-slate-50"
                    )}
                  >
                    <StepDot
                      number={idx + 1}
                      isCompleted={isCompleted}
                      isCurrent={isCurrent}
                    />
                    <span
                      className={cn(
                        "text-sm leading-tight",
                        isCurrent
                          ? "text-blue-700 font-medium"
                          : isCompleted
                          ? "text-slate-600"
                          : "text-slate-500"
                      )}
                    >
                      {step.label}
                    </span>
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Back to dashboard */}
      <div className="p-3 border-t">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 px-2 py-2 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          ← All Investigations
        </Link>
      </div>
    </aside>
  )
}

function StepDot({
  number,
  isCompleted,
  isCurrent,
}: {
  number: number
  isCompleted: boolean
  isCurrent: boolean
}) {
  if (isCompleted) {
    return (
      <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
        <CheckIcon className="w-3 h-3 text-white" strokeWidth={3} />
      </span>
    )
  }
  if (isCurrent) {
    return (
      <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
        <span className="text-white text-xs font-bold">{number}</span>
      </span>
    )
  }
  return (
    <span className="w-6 h-6 rounded-full border-2 border-slate-200 flex items-center justify-center shrink-0">
      <span className="text-slate-400 text-xs">{number}</span>
    </span>
  )
}
