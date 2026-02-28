"use client"

import { useState, useTransition } from "react"
import { StepShell } from "@/components/investigation/StepShell"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import { saveToolDecision } from "@/actions/investigation"
import { getAIRecommendation } from "@/actions/ai-recommend"
import { toast } from "sonner"

// ─── Types ───────────────────────────────────────────────────────────────────

interface ToolDecisionFormProps {
  id: string
  existing: {
    fiveWhys: boolean
    fishbone: boolean
    isIsNot: boolean
    processAnalysis: boolean
    notes: string
    who: string
    why: string
    howMuch: string
    whereDetail: string
    howDetail: string
    causeType?: "COMMON" | "SPECIAL" | "UNKNOWN"
    isRecurring?: boolean
    suspectedCauses?: "SINGLE" | "MULTIPLE"
    processChangeInvolved?: boolean
    processChangeDetail: string
    aiRecommendation: string
  } | null
  context: {
    riskLevel: string | null
    totalScore: number | null
    problemSummary: string
  }
  problemData: {
    description: string
    department: string
    occurredAt: string
    detectionMethod: string
    detectionDetail: string
    productAffected: boolean
    productDetails: string
    containmentActions: string
  } | null
  riskData: {
    q1Score: number
    q2Score: number
    q3Score: number
    q4Score: number
    q5Score: number
    totalScore: number
    riskLevel: string
  } | null
}

// ─── Tool Cards Config ───────────────────────────────────────────────────────

const TOOLS = [
  {
    key: "fiveWhys" as const,
    label: "Five Whys Analysis",
    emoji: "\u2753",
    description:
      "Ask 'Why?' repeatedly to trace the cause-and-effect chain back to the root cause. Simple, fast, and effective for linear problems.",
    bestFor: ["Simple cause chains", "Quick investigations", "All risk levels"],
    when: "Use when the cause-effect relationship is relatively straightforward and you need to quickly trace back to the origin.",
    recommended: "all",
  },
  {
    key: "fishbone" as const,
    label: "Fishbone / Ishikawa Diagram",
    emoji: "\uD83D\uDC1F",
    description:
      "Map potential causes across 6 categories (Man, Machine, Method, Material, Measurement, Environment) to systematically brainstorm all possible contributing factors.",
    bestFor: ["Complex problems", "Multiple potential causes", "Medium-High risk"],
    when: "Use when the problem may have multiple contributing factors across different categories and you need a structured brainstorming approach.",
    recommended: "medium-high",
  },
  {
    key: "isIsNot" as const,
    label: "Is / Is Not Analysis",
    emoji: "\uD83D\uDD0D",
    description:
      "Systematically compare what the problem IS vs. what it IS NOT across key dimensions (What, Where, When, Extent) to sharpen focus and eliminate noise.",
    bestFor: ["Ambiguous problems", "Narrowing scope", "Any risk level"],
    when: "Use when the problem boundaries are unclear and you need to precisely define what you're investigating.",
    recommended: "all",
  },
  {
    key: "processAnalysis" as const,
    label: "Process Analysis Table",
    emoji: "\uD83D\uDCCB",
    description:
      "Step-by-step review of the process, comparing expected vs. actual outcomes at each step to identify exactly where deviations occurred.",
    bestFor: ["Process deviations", "Sequential workflows", "Equipment/process issues"],
    when: "Use when the problem occurred within a defined process and you need to pinpoint which step deviated from the standard.",
    recommended: "process",
  },
]

const RISK_COLORS: Record<string, string> = {
  LOW: "bg-green-100 text-green-800 border-green-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
  HIGH: "bg-red-100 text-red-800 border-red-200",
}

// ─── 5W2H Card Component ─────────────────────────────────────────────────────

function FiveWHCard({
  dimension,
  status,
  value,
  hint,
  children,
}: {
  dimension: string
  status: "captured" | "partial" | "gap"
  value?: string
  hint: string
  children?: React.ReactNode
}) {
  const colors = {
    captured: "border-green-200 bg-green-50/60",
    partial: "border-amber-200 bg-amber-50/60",
    gap: "border-slate-200 bg-slate-50/60",
  }
  const badges = {
    captured: "bg-green-100 text-green-700",
    partial: "bg-amber-100 text-amber-700",
    gap: "bg-slate-200 text-slate-600",
  }
  const labels = {
    captured: "Captured",
    partial: "Partial",
    gap: "Needs Input",
  }

  return (
    <div className={cn("rounded-lg border p-3", colors[status])}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-slate-700">{dimension}</span>
        <span
          className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
            badges[status]
          )}
        >
          {labels[status]}
        </span>
      </div>
      <p className="text-[11px] text-slate-500 italic mb-1">{hint}</p>
      {value && <p className="text-sm text-slate-800 line-clamp-3">{value}</p>}
      {children}
    </div>
  )
}

// ─── AI Response Renderer ────────────────────────────────────────────────────

function AIResponsePanel({ text }: { text: string }) {
  // Parse the known sections from the AI response
  const sections = parseAIResponse(text)

  return (
    <div className="space-y-4">
      {sections.map((section, i) => (
        <div key={i}>
          {section.type === "header" && (
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wide">
                {section.label}
              </span>
              {section.badge && (
                <span
                  className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                    section.badge === "HIGH"
                      ? "bg-red-100 text-red-700"
                      : section.badge === "MEDIUM"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                  )}
                >
                  {section.badge}
                </span>
              )}
            </div>
          )}
          {section.type === "text" && (
            <p className="text-sm text-slate-700 leading-relaxed">{section.content}</p>
          )}
          {section.type === "list" && (
            <ul className="space-y-1.5">
              {section.items.map((item, j) => (
                <li key={j} className="flex gap-2 text-sm text-slate-700">
                  <span className="text-blue-400 mt-0.5 flex-shrink-0">&#x2022;</span>
                  <span dangerouslySetInnerHTML={{ __html: renderInlineBold(item) }} />
                </li>
              ))}
            </ul>
          )}
          {section.type === "numbered" && (
            <ol className="space-y-1.5">
              {section.items.map((item, j) => (
                <li key={j} className="flex gap-2 text-sm text-slate-700">
                  <span className="text-blue-600 font-semibold flex-shrink-0 w-5 text-right">
                    {j + 1}.
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: renderInlineBold(item) }} />
                </li>
              ))}
            </ol>
          )}
        </div>
      ))}
    </div>
  )
}

type Section =
  | { type: "header"; label: string; badge?: string }
  | { type: "text"; content: string }
  | { type: "list"; items: string[] }
  | { type: "numbered"; items: string[] }

function renderInlineBold(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
}

function parseAIResponse(raw: string): Section[] {
  const sections: Section[] = []
  // Normalize line breaks
  const lines = raw.split(/\n/).map((l) => l.trim()).filter(Boolean)

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    // Check for section headers like **RECOMMENDED TOOLS:** or **CONFIDENCE:**
    const headerMatch = line.match(/^\*\*(.+?):\*\*\s*(.*)/)
    if (headerMatch) {
      const label = headerMatch[1].trim()
      const rest = headerMatch[2].trim()

      // CONFIDENCE gets special badge treatment
      if (label === "CONFIDENCE") {
        const level = rest.split(/\s/)[0]?.toUpperCase()
        sections.push({ type: "header", label, badge: level })
        // Any text after the level
        const after = rest.replace(/^(LOW|MEDIUM|HIGH)\s*/i, "").trim()
        if (after) sections.push({ type: "text", content: after })
        i++
        continue
      }

      sections.push({ type: "header", label })

      // Inline content after the header
      if (rest) {
        // Check if it looks like a numbered list (1. ...)
        if (/^\d+\./.test(rest)) {
          const items = rest.split(/\d+\.\s*/).filter(Boolean).map((s) => s.trim())
          sections.push({ type: "numbered", items })
        } else {
          sections.push({ type: "text", content: rest })
        }
      }

      // Collect subsequent lines that belong to this section
      i++
      const subItems: string[] = []
      let isNumbered = false
      while (i < lines.length) {
        const next = lines[i]
        // Stop if we hit another header
        if (/^\*\*.+?:\*\*/.test(next)) break
        // Bullet point
        if (/^[-•]\s+/.test(next)) {
          subItems.push(next.replace(/^[-•]\s+/, ""))
          i++
          continue
        }
        // Numbered item
        if (/^\d+\.\s+/.test(next)) {
          isNumbered = true
          subItems.push(next.replace(/^\d+\.\s+/, ""))
          i++
          continue
        }
        // Plain continuation text
        if (subItems.length === 0) {
          sections.push({ type: "text", content: next })
        } else {
          // Append to the last bullet if it's a continuation
          subItems[subItems.length - 1] += " " + next
        }
        i++
      }

      if (subItems.length > 0) {
        sections.push(
          isNumbered
            ? { type: "numbered", items: subItems }
            : { type: "list", items: subItems }
        )
      }
      continue
    }

    // Standalone bullet points
    if (/^[-•]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-•]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-•]\s+/, ""))
        i++
      }
      sections.push({ type: "list", items })
      continue
    }

    // Fallback: plain text
    sections.push({ type: "text", content: line })
    i++
  }

  return sections
}

// ─── Main Form Component ─────────────────────────────────────────────────────

export function ToolDecisionForm({
  id,
  existing,
  context,
  problemData,
  riskData,
}: ToolDecisionFormProps) {
  // Tool selection
  const [selected, setSelected] = useState<Record<string, boolean>>({
    fiveWhys: existing?.fiveWhys ?? true,
    fishbone: existing?.fishbone ?? false,
    isIsNot: existing?.isIsNot ?? false,
    processAnalysis: existing?.processAnalysis ?? false,
  })
  const [notes, setNotes] = useState(existing?.notes ?? "")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // 5W2H gap fields
  const [who, setWho] = useState(existing?.who ?? "")
  const [why, setWhy] = useState(existing?.why ?? "")
  const [howMuch, setHowMuch] = useState(existing?.howMuch ?? "")
  const [whereDetail, setWhereDetail] = useState(existing?.whereDetail ?? "")
  const [howDetail, setHowDetail] = useState(existing?.howDetail ?? "")

  // Complexity assessment
  const [causeType, setCauseType] = useState<"COMMON" | "SPECIAL" | "UNKNOWN" | undefined>(
    existing?.causeType
  )
  const [isRecurring, setIsRecurring] = useState<boolean | undefined>(existing?.isRecurring)
  const [suspectedCauses, setSuspectedCauses] = useState<"SINGLE" | "MULTIPLE" | undefined>(
    existing?.suspectedCauses
  )
  const [processChangeInvolved, setProcessChangeInvolved] = useState<boolean | undefined>(
    existing?.processChangeInvolved
  )
  const [processChangeDetail, setProcessChangeDetail] = useState(
    existing?.processChangeDetail ?? ""
  )

  // AI
  const [aiRecommendation, setAiRecommendation] = useState(existing?.aiRecommendation ?? "")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  function toggleTool(key: string) {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function isRecommended(tool: (typeof TOOLS)[number]): boolean {
    if (tool.recommended === "all") return true
    if (
      tool.recommended === "medium-high" &&
      context.riskLevel &&
      ["MEDIUM", "HIGH"].includes(context.riskLevel)
    )
      return true
    // Complexity-based recommendations
    if (tool.key === "fishbone" && suspectedCauses === "MULTIPLE") return true
    if (tool.key === "processAnalysis" && processChangeInvolved === true) return true
    if (tool.key === "isIsNot" && causeType === "UNKNOWN") return true
    return false
  }

  async function handleAIRecommend() {
    if (!problemData || !riskData) return

    setAiLoading(true)
    setAiError(null)

    try {
      const result = await getAIRecommendation({
        description: problemData.description,
        department: problemData.department,
        occurredAt: problemData.occurredAt,
        detectionMethod: problemData.detectionMethod,
        detectionDetail: problemData.detectionDetail,
        containmentActions: problemData.containmentActions,
        productAffected: problemData.productAffected,
        productDetails: problemData.productDetails,
        riskLevel: riskData.riskLevel,
        totalScore: riskData.totalScore,
        who,
        why,
        howMuch,
        whereDetail,
        howDetail,
        causeType,
        isRecurring,
        suspectedCauses,
        processChangeInvolved,
        processChangeDetail,
      })

      if (result.error) {
        setAiError(result.error)
      } else {
        setAiRecommendation(result.recommendation)
        applyAISelections(result.recommendation)
        toast.success("AI recommendation generated")
      }
    } catch {
      setAiError("An unexpected error occurred.")
    } finally {
      setAiLoading(false)
    }
  }

  function applyAISelections(recommendation: string) {
    const lower = recommendation.toLowerCase()
    const newSelected = { ...selected }

    if (lower.includes("five whys")) newSelected.fiveWhys = true
    if (lower.includes("fishbone") || lower.includes("ishikawa")) newSelected.fishbone = true
    if (lower.includes("is/is not") || lower.includes("is / is not")) newSelected.isIsNot = true
    if (lower.includes("process analysis")) newSelected.processAnalysis = true

    setSelected(newSelected)
  }

  function handleSubmit() {
    setError(null)

    const anySelected = Object.values(selected).some(Boolean)
    if (!anySelected) {
      setError("Please select at least one analysis tool.")
      return
    }

    startTransition(async () => {
      await saveToolDecision(id, {
        fiveWhys: selected.fiveWhys,
        fishbone: selected.fishbone,
        isIsNot: selected.isIsNot,
        processAnalysis: selected.processAnalysis,
        notes: notes || undefined,
        who: who || undefined,
        why: why || undefined,
        howMuch: howMuch || undefined,
        whereDetail: whereDetail || undefined,
        howDetail: howDetail || undefined,
        causeType: causeType || undefined,
        isRecurring,
        suspectedCauses: suspectedCauses || undefined,
        processChangeInvolved,
        processChangeDetail: processChangeDetail || undefined,
        aiRecommendation: aiRecommendation || undefined,
      })
    })
  }

  return (
    <StepShell
      stepNumber={3}
      title="Tool Decision"
      description="Review your problem context, assess complexity, and select which analysis tools to use. Use the AI assistant for guidance."
      investigationId={id}
    >
      <div className="space-y-6">
        {/* Context banner */}
        {context.riskLevel && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Investigation Context
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border",
                  RISK_COLORS[context.riskLevel] ?? "bg-slate-100 text-slate-800"
                )}
              >
                {context.riskLevel} Risk (Score: {context.totalScore})
              </span>
            </div>
            {context.problemSummary && (
              <p className="text-sm text-slate-600 line-clamp-2">{context.problemSummary}</p>
            )}
          </div>
        )}

        <Accordion type="multiple" defaultValue={["5w2h", "complexity", "tools", "ai"]}>
          {/* ─── Section 1: 5W2H Framework ─────────────────────────────── */}
          <AccordionItem value="5w2h">
            <AccordionTrigger className="text-sm font-semibold text-slate-800">
              5W2H Problem Analysis
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-xs text-slate-500 mb-4">
                Review what&apos;s already captured from your problem definition and fill in any
                gaps. More context helps the AI make better tool recommendations.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* WHAT — captured */}
                <FiveWHCard
                  dimension="What"
                  status="captured"
                  value={problemData?.description ?? ""}
                  hint="What happened?"
                />

                {/* WHERE — partial (department + elaboration) */}
                <FiveWHCard
                  dimension="Where"
                  status={whereDetail ? "captured" : "partial"}
                  value={problemData?.department ?? ""}
                  hint="Where did it happen?"
                >
                  <Textarea
                    value={whereDetail}
                    onChange={(e) => setWhereDetail(e.target.value)}
                    placeholder="Add location details (area, line, room)..."
                    rows={2}
                    className="mt-2 resize-none text-xs"
                  />
                </FiveWHCard>

                {/* WHEN — captured */}
                <FiveWHCard
                  dimension="When"
                  status="captured"
                  value={
                    problemData
                      ? new Date(problemData.occurredAt).toLocaleString()
                      : ""
                  }
                  hint="When did it occur?"
                />

                {/* WHO — gap */}
                <FiveWHCard
                  dimension="Who"
                  status={who ? "captured" : "gap"}
                  hint="Who discovered it? Who is affected?"
                >
                  <Textarea
                    value={who}
                    onChange={(e) => setWho(e.target.value)}
                    placeholder="Who discovered the issue? Who is affected?"
                    rows={2}
                    className="mt-2 resize-none text-xs"
                  />
                </FiveWHCard>

                {/* WHY — gap */}
                <FiveWHCard
                  dimension="Why"
                  status={why ? "captured" : "gap"}
                  hint="Initial theory of why this happened"
                >
                  <Textarea
                    value={why}
                    onChange={(e) => setWhy(e.target.value)}
                    placeholder="Initial theory — why might this have happened?"
                    rows={2}
                    className="mt-2 resize-none text-xs"
                  />
                </FiveWHCard>

                {/* HOW — partial (detection method + elaboration) */}
                <FiveWHCard
                  dimension="How"
                  status={howDetail ? "captured" : "partial"}
                  value={
                    problemData
                      ? `${problemData.detectionMethod}${problemData.detectionDetail ? ` — ${problemData.detectionDetail}` : ""}`
                      : ""
                  }
                  hint="How was it detected?"
                >
                  <Textarea
                    value={howDetail}
                    onChange={(e) => setHowDetail(e.target.value)}
                    placeholder="Add details about how the process failed..."
                    rows={2}
                    className="mt-2 resize-none text-xs"
                  />
                </FiveWHCard>

                {/* HOW MUCH — partial (product details + elaboration) */}
                <FiveWHCard
                  dimension="How Much"
                  status={howMuch ? "captured" : "partial"}
                  value={problemData?.productDetails ?? ""}
                  hint="Magnitude, frequency, scope"
                >
                  <Textarea
                    value={howMuch}
                    onChange={(e) => setHowMuch(e.target.value)}
                    placeholder="Magnitude, frequency, # affected units..."
                    rows={2}
                    className="mt-2 resize-none text-xs"
                  />
                </FiveWHCard>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ─── Section 2: Complexity Assessment ──────────────────────── */}
          <AccordionItem value="complexity">
            <AccordionTrigger className="text-sm font-semibold text-slate-800">
              Complexity Assessment
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-xs text-slate-500 mb-4">
                These questions help determine which analysis tools are most appropriate for your
                problem.
              </p>

              <div className="space-y-5">
                {/* Q1: Cause type */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-700">
                    What type of variation is this?
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { value: "COMMON", label: "Common Cause" },
                        { value: "SPECIAL", label: "Special Cause" },
                        { value: "UNKNOWN", label: "Unknown" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setCauseType(opt.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-md border text-xs font-medium transition-colors",
                          causeType === opt.value
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Common = inherent process variation (always present). Special = assignable cause
                    (new, identifiable event).
                  </p>
                </div>

                {/* Q2: Recurring? */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-700">
                    Is this a one-time event or a recurring pattern?
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { value: false, label: "One-time" },
                        { value: true, label: "Recurring" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={String(opt.value)}
                        type="button"
                        onClick={() => setIsRecurring(opt.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-md border text-xs font-medium transition-colors",
                          isRecurring === opt.value
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q3: Single or multiple causes? */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-700">
                    Do you suspect a single root cause or multiple contributing factors?
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { value: "SINGLE", label: "Single Root Cause" },
                        { value: "MULTIPLE", label: "Multiple Factors" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSuspectedCauses(opt.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-md border text-xs font-medium transition-colors",
                          suspectedCauses === opt.value
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q4: Process change involved? */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-700">
                    Was there a recent process change involved?
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { value: false, label: "No" },
                        { value: true, label: "Yes" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={String(opt.value)}
                        type="button"
                        onClick={() => setProcessChangeInvolved(opt.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-md border text-xs font-medium transition-colors",
                          processChangeInvolved === opt.value
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {processChangeInvolved === true && (
                    <Textarea
                      value={processChangeDetail}
                      onChange={(e) => setProcessChangeDetail(e.target.value)}
                      placeholder="Describe the process change (new equipment, personnel, material, procedure)..."
                      rows={2}
                      className="mt-2 resize-none text-xs"
                    />
                  )}
                  <p className="text-[10px] text-slate-400">
                    New equipment, personnel, material, supplier, or procedure change.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ─── Section 3: Tool Selection ──────────────────────────────── */}
          <AccordionItem value="tools">
            <AccordionTrigger className="text-sm font-semibold text-slate-800">
              Select Analysis Tools <span className="text-red-500 ml-1">*</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 gap-3">
                {TOOLS.map((tool) => {
                  const isSelected = selected[tool.key]
                  const recommended = isRecommended(tool)

                  return (
                    <button
                      key={tool.key}
                      type="button"
                      onClick={() => toggleTool(tool.key)}
                      className={cn(
                        "relative flex cursor-pointer rounded-lg border p-4 shadow-sm transition-colors text-left",
                        isSelected
                          ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                          : "border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/50"
                      )}
                    >
                      <div className="flex items-start gap-4 w-full">
                        <span className="text-2xl flex-shrink-0 mt-0.5">{tool.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-slate-900">{tool.label}</p>
                            {recommended && (
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mb-2">{tool.description}</p>
                          <div className="flex flex-wrap gap-1.5 mb-1.5">
                            {tool.bestFor.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <p className="text-[11px] text-slate-500 italic">{tool.when}</p>
                        </div>
                        <div className="flex-shrink-0 mt-1">
                          <div
                            className={cn(
                              "h-5 w-5 rounded border-2 flex items-center justify-center",
                              isSelected
                                ? "border-blue-600 bg-blue-600"
                                : "border-slate-300 bg-white"
                            )}
                          >
                            {isSelected && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ─── Section 4: AI Recommendation ──────────────────────────── */}
          <AccordionItem value="ai">
            <AccordionTrigger className="text-sm font-semibold text-slate-800">
              AI-Assisted Recommendation
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  The AI analyzes your problem definition, risk assessment, 5W2H data, and
                  complexity answers to recommend the most effective combination of analysis tools.
                </p>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={aiLoading || !problemData}
                  onClick={handleAIRecommend}
                  className="text-xs"
                >
                  {aiLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-0.5 mr-1.5 h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    "Get AI Recommendation"
                  )}
                </Button>

                {!problemData && (
                  <p className="text-xs text-amber-600">
                    Complete Problem Definition (Step 1) to enable AI recommendations.
                  </p>
                )}

                {aiRecommendation && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                        AI Recommendation
                      </span>
                    </div>
                    <AIResponsePanel text={aiRecommendation} />
                  </div>
                )}

                {aiError && (
                  <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                    <p className="text-sm text-amber-700">{aiError}</p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* ─── Notes ────────────────────────────────────────────────────── */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium text-slate-700">
            Notes (optional)
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any reasoning for your tool selection, e.g. 'Six Sigma project — all tools required' or 'Simple deviation — Five Whys sufficient'"
            className="resize-none"
          />
        </div>

        {/* ─── Error + Actions ──────────────────────────────────────────── */}
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
