import { prisma } from "@/lib/prisma"

export type StepGateResult = { allowed: boolean; reason?: string }

const STEP_PATHS: Record<number, string> = {
  1: "problem",
  2: "problem",
  3: "risk",
  4: "category",
  5: "five-whys",
  6: "root-cause",
  7: "capa",
  8: "effectiveness",
  9: "summary",
  10: "close",
}

export function stepPath(step: number): string {
  return STEP_PATHS[step] ?? "problem"
}

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
      return { allowed: !!inv.problemCategory }
    case 5: {
      if (inv.fiveWhys.length === 0) return { allowed: false, reason: "At least one Why analysis is required." }
      const hasRoot = inv.fiveWhys.some((w) => w.parentId === null)
      const allEvidence = inv.fiveWhys.every((w) => w.evidence.trim() !== "")
      return { allowed: hasRoot && allEvidence }
    }
    case 6: {
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
    case 7: {
      if (inv.capaActions.length < 1) {
        return {
          allowed: false,
          reason: "At least one CAPA action is required before continuing.",
        }
      }
      return { allowed: true }
    }
    case 8: {
      const er = inv.effectivenessRecord
      if (!er) return { allowed: false }
      if (er.result === "PENDING") return { allowed: false, reason: "Effectiveness result must be recorded." }
      if (!er.reviewerApproved) return { allowed: false, reason: "Reviewer approval is required." }
      return { allowed: true }
    }
    case 9:
      return { allowed: inv.currentStep >= 8 }
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
