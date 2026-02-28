import { prisma } from "@/lib/prisma"

export type StepGateResult = { allowed: boolean; reason?: string }

const STEP_PATHS: Record<number, string> = {
  1: "problem",
  2: "problem",
  3: "risk",
  4: "tool-decision",
  5: "category",
  6: "five-whys",
  7: "fishbone",
  8: "is-is-not",
  9: "process-analysis",
  10: "root-cause",
  11: "capa",
  12: "effectiveness",
  13: "summary",
  14: "close",
}

export function stepPath(step: number): string {
  return STEP_PATHS[step] ?? "problem"
}

const ANALYSIS_TOOL_STEPS = [7, 8, 9]

export async function canAccessStep(
  investigationId: string,
  targetStep: number
): Promise<StepGateResult> {
  const inv = await prisma.investigation.findUnique({
    where: { id: investigationId },
    select: { currentStep: true, status: true },
  })

  if (!inv) return { allowed: false, reason: "Investigation not found" }
  if (targetStep <= inv.currentStep) return { allowed: true }
  if (targetStep === inv.currentStep + 1) return { allowed: true }

  // Analysis tool steps (7=fishbone, 8=is-is-not, 9=process-analysis)
  // are accessible once the user has reached step 6 (Five Whys)
  if (ANALYSIS_TOOL_STEPS.includes(targetStep) && inv.currentStep >= 6) {
    return { allowed: true }
  }

  return {
    allowed: false,
    reason: `Complete step ${inv.currentStep} first`,
  }
}

export async function isStepComplete(
  investigationId: string,
  step: number
): Promise<StepGateResult> {
  const inv = await prisma.investigation.findUnique({
    where: { id: investigationId },
    include: {
      problemDefinition: true,
      riskAssessment: true,
      toolDecision: true,
      problemCategory: true,
      fiveWhys: true,
      rootCause: true,
      capaActions: true,
      effectivenessRecord: true,
    },
  })

  if (!inv) return { allowed: false, reason: "Investigation not found" }

  switch (step) {
    case 2:
      return { allowed: !!inv.problemDefinition }
    case 3:
      return { allowed: !!inv.riskAssessment }
    case 4:
      return { allowed: !!inv.toolDecision }
    case 5:
      return { allowed: !!inv.problemCategory }
    case 6: {
      if (inv.fiveWhys.length === 0) return { allowed: false, reason: "At least one Why analysis is required." }
      const hasRoot = inv.fiveWhys.some((w) => w.parentId === null)
      const allEvidence = inv.fiveWhys.every((w) => w.evidence.trim() !== "")
      return { allowed: hasRoot && allEvidence }
    }
    case 7:
    case 8:
    case 9:
      // Optional analysis tools — always considered complete
      return { allowed: true }
    case 10: {
      const rc = inv.rootCause
      if (!rc) return { allowed: false }
      if (rc.hasWarnings && !rc.warningAcknowledged) {
        return {
          allowed: false,
          reason: "Root cause warning must be acknowledged before proceeding.",
        }
      }
      return { allowed: true }
    }
    case 11: {
      if (inv.capaActions.length < 1) {
        return {
          allowed: false,
          reason: "At least one CAPA action is required before continuing.",
        }
      }
      return { allowed: true }
    }
    case 12: {
      const er = inv.effectivenessRecord
      if (!er) return { allowed: false }
      if (er.result === "PENDING") return { allowed: false, reason: "Effectiveness result must be recorded." }
      if (!er.reviewerApproved) return { allowed: false, reason: "Reviewer approval is required." }
      return { allowed: true }
    }
    case 13:
      return { allowed: inv.currentStep >= 12 }
    default:
      return { allowed: true }
  }
}

export async function canCloseInvestigation(
  investigationId: string
): Promise<StepGateResult> {
  const inv = await prisma.investigation.findUnique({
    where: { id: investigationId },
    include: {
      capaActions: true,
      effectivenessRecord: true,
    },
  })

  if (!inv) return { allowed: false, reason: "Investigation not found" }

  const incompleteCA = inv.capaActions.filter(
    (a) => a.type === "CORRECTIVE_ACTION" && a.status !== "COMPLETED"
  )
  if (incompleteCA.length > 0) {
    return {
      allowed: false,
      reason: `${incompleteCA.length} corrective action(s) must be completed before closing.`,
    }
  }

  if (!inv.effectivenessRecord || inv.effectivenessRecord.result === "PENDING") {
    return { allowed: false, reason: "Effectiveness verification result is required." }
  }

  if (inv.effectivenessRecord.result === "NOT_EFFECTIVE") {
    return {
      allowed: false,
      reason: "Effectiveness result is Not Effective. Reopen the CAPA section and address root cause.",
    }
  }

  return { allowed: true }
}
