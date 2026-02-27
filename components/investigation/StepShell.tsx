import { Separator } from "@/components/ui/separator"
import Link from "next/link"

interface StepShellProps {
  stepNumber: number
  title: string
  description?: string
  investigationId: string
  backPath?: string
  children: React.ReactNode
}

export function StepShell({
  stepNumber,
  title,
  description,
  investigationId,
  backPath,
  children,
}: StepShellProps) {
  return (
    <div className="p-8 max-w-3xl">
      {/* Step header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
            {stepNumber}
          </span>
          <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">
            Step {stepNumber} of 9
          </span>
        </div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {description && (
          <p className="text-slate-500 text-sm mt-1">{description}</p>
        )}
      </div>

      <Separator className="mb-8" />

      {children}
    </div>
  )
}
