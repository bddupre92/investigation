"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createInvestigationSchema } from "@/schemas/investigation"
import { problemDefinitionSchema } from "@/schemas/problem"
import { riskAssessmentSchema } from "@/schemas/risk"
import { toolDecisionSchema } from "@/schemas/tool-decision"
import { problemCategorySchema } from "@/schemas/category"
import { rootCauseSchema } from "@/schemas/root-cause"
import { capaActionSchema } from "@/schemas/capa"
import {
  effectivenessSetupSchema,
  effectivenessResultSchema,
} from "@/schemas/effectiveness"
import { calculateRiskLevel } from "@/lib/risk-calculator"
import { isStepComplete, canCloseInvestigation } from "@/lib/step-gates"
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit"

async function getSession() {
  const session = await auth()
  if (!session) redirect("/login")
  return session
}

function generateReferenceNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 9000) + 1000
  return `INV-${year}-${random}`
}

// ─── Step 1: Create Investigation ────────────────────────────────────────────

export async function createInvestigation(formData: FormData) {
  const session = await getSession()
  const raw = { title: formData.get("title") }
  const parsed = createInvestigationSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  // Ensure unique reference number
  let referenceNumber = generateReferenceNumber()
  while (await prisma.investigation.findUnique({ where: { referenceNumber } })) {
    referenceNumber = generateReferenceNumber()
  }

  const investigation = await prisma.investigation.create({
    data: {
      referenceNumber,
      title: parsed.data.title,
      createdById: session.user.id,
      status: "IN_PROGRESS",
      currentStep: 2,
    },
  })

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email,
    action: AUDIT_ACTIONS.INVESTIGATION_CREATE,
    entityType: "investigation",
    entityId: investigation.id,
    metadata: { title: parsed.data.title, referenceNumber },
  })

  redirect(`/investigations/${investigation.id}/problem`)
}

// ─── Step 2: Problem Definition ──────────────────────────────────────────────

export async function saveProblemDefinition(
  investigationId: string,
  formData: FormData
) {
  const session = await getSession()

  const raw = {
    description: formData.get("description"),
    department: formData.get("department"),
    occurredAt: formData.get("occurredAt"),
    detectionMethod: formData.get("detectionMethod"),
    detectionDetail: formData.get("detectionDetail") || undefined,
    containmentActions: formData.get("containmentActions"),
    productAffected: formData.get("productAffected") === "true",
    productDetails: formData.get("productDetails") || undefined,
  }

  const parsed = problemDefinitionSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  await prisma.problemDefinition.upsert({
    where: { investigationId },
    create: {
      investigationId,
      ...parsed.data,
      occurredAt: new Date(parsed.data.occurredAt),
    },
    update: {
      ...parsed.data,
      occurredAt: new Date(parsed.data.occurredAt),
    },
  })

  await prisma.investigation.update({
    where: { id: investigationId },
    data: { currentStep: Math.max(3, await getCurrentStep(investigationId)) },
  })

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email,
    action: AUDIT_ACTIONS.STEP_SAVE,
    entityType: "investigation",
    entityId: investigationId,
    metadata: { step: "problem_definition" },
  })

  revalidatePath(`/investigations/${investigationId}`)
  redirect(`/investigations/${investigationId}/risk`)
}

// ─── Step 3: Risk Assessment ─────────────────────────────────────────────────

export async function saveRiskAssessment(
  investigationId: string,
  formData: FormData
) {
  const session = await getSession()

  const raw = {
    q1Score: Number(formData.get("q1Score")),
    q2Score: Number(formData.get("q2Score")),
    q3Score: Number(formData.get("q3Score")),
    q4Score: Number(formData.get("q4Score")),
    q5Score: Number(formData.get("q5Score")),
  }

  const parsed = riskAssessmentSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { totalScore, riskLevel } = calculateRiskLevel([
    parsed.data.q1Score,
    parsed.data.q2Score,
    parsed.data.q3Score,
    parsed.data.q4Score,
    parsed.data.q5Score,
  ])

  await prisma.riskAssessment.upsert({
    where: { investigationId },
    create: { investigationId, ...parsed.data, totalScore, riskLevel },
    update: { ...parsed.data, totalScore, riskLevel },
  })

  await advanceStep(investigationId, 4)
  logAudit({
    userId: session.user.id,
    userEmail: session.user.email,
    action: AUDIT_ACTIONS.STEP_SAVE,
    entityType: "investigation",
    entityId: investigationId,
    metadata: { step: "risk_assessment", riskLevel, totalScore },
  })

  revalidatePath(`/investigations/${investigationId}`)
  redirect(`/investigations/${investigationId}/tool-decision`)
}

// ─── Step 4: Tool Decision ──────────────────────────────────────────────────

export async function saveToolDecision(
  investigationId: string,
  data: {
    fiveWhys: boolean
    fishbone: boolean
    isIsNot: boolean
    processAnalysis: boolean
    notes?: string
    who?: string
    why?: string
    howMuch?: string
    whereDetail?: string
    howDetail?: string
    causeType?: "COMMON" | "SPECIAL" | "UNKNOWN"
    isRecurring?: boolean
    suspectedCauses?: "SINGLE" | "MULTIPLE"
    processChangeInvolved?: boolean
    processChangeDetail?: string
    aiRecommendation?: string
  }
) {
  const session = await getSession()

  const parsed = toolDecisionSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  await prisma.toolDecision.upsert({
    where: { investigationId },
    create: { investigationId, ...parsed.data },
    update: { ...parsed.data },
  })

  await advanceStep(investigationId, 5)
  logAudit({
    userId: session.user.id,
    userEmail: session.user.email,
    action: AUDIT_ACTIONS.STEP_SAVE,
    entityType: "investigation",
    entityId: investigationId,
    metadata: { step: "tool_decision", tools: { fiveWhys: data.fiveWhys, fishbone: data.fishbone, isIsNot: data.isIsNot, processAnalysis: data.processAnalysis } },
  })

  revalidatePath(`/investigations/${investigationId}`)
  redirect(`/investigations/${investigationId}/category`)
}

// ─── Step 5: Problem Category ────────────────────────────────────────────────

export async function saveProblemCategory(
  investigationId: string,
  formData: FormData
) {
  const session = await getSession()

  const raw = {
    category: formData.get("category"),
    justification: formData.get("justification"),
  }

  const parsed = problemCategorySchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  await prisma.problemCategoryRecord.upsert({
    where: { investigationId },
    create: { investigationId, ...parsed.data },
    update: { ...parsed.data },
  })

  await advanceStep(investigationId, 6)
  logAudit({
    userId: session.user.id,
    userEmail: session.user.email,
    action: AUDIT_ACTIONS.STEP_SAVE,
    entityType: "investigation",
    entityId: investigationId,
    metadata: { step: "problem_category" },
  })

  revalidatePath(`/investigations/${investigationId}`)
  redirect(`/investigations/${investigationId}/five-whys`)
}

// ─── Step 6: Five Whys ──────────────────────────────────────────────────────

export async function saveFiveWhys(
  investigationId: string,
  nodes: Array<{
    id: string
    parentId: string | null
    treeIndex: number
    depth: number
    whyQuestion: string
    answer: string
    evidence: string
  }>
) {
  const session = await getSession()

  if (nodes.length === 0) return { error: "At least one Why is required" }

  await prisma.$transaction(async (tx) => {
    // Delete all existing and recreate
    await tx.fiveWhysRecord.deleteMany({ where: { investigationId } })

    // Sort by depth to ensure parents are created before children
    const sorted = [...nodes].sort((a, b) => a.depth - b.depth)
    const idMap = new Map<string, string>()

    for (const node of sorted) {
      const resolvedParentId = node.parentId ? idMap.get(node.parentId) ?? null : null
      const created = await tx.fiveWhysRecord.create({
        data: {
          investigationId,
          treeIndex: node.treeIndex,
          depth: node.depth,
          parentId: resolvedParentId,
          whyQuestion: node.whyQuestion,
          answer: node.answer,
          evidence: node.evidence,
        },
      })
      idMap.set(node.id, created.id)
    }
  })

  await advanceStep(investigationId, 10)
  logAudit({
    userId: session.user.id,
    userEmail: session.user.email,
    action: AUDIT_ACTIONS.STEP_SAVE,
    entityType: "investigation",
    entityId: investigationId,
    metadata: { step: "five_whys", nodeCount: nodes.length },
  })

  revalidatePath(`/investigations/${investigationId}`)
  redirect(`/investigations/${investigationId}/root-cause`)
}

// ─── Step 7: Fishbone / Ishikawa ────────────────────────────────────────────

export async function saveFishbone(
  investigationId: string,
  causes: Array<{
    category: string
    cause: string
    evidence?: string
  }>
) {
  const session = await getSession()

  if (causes.length === 0) return { error: "At least one cause is required" }

  await prisma.$transaction(async (tx) => {
    await tx.fishboneCause.deleteMany({ where: { investigationId } })
    for (const cause of causes) {
      await tx.fishboneCause.create({
        data: {
          investigationId,
          category: cause.category as "MAN" | "MACHINE" | "METHOD" | "MATERIAL" | "MEASUREMENT" | "ENVIRONMENT",
          cause: cause.cause,
          evidence: cause.evidence || null,
        },
      })
    }
  })

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email,
    action: AUDIT_ACTIONS.STEP_SAVE,
    entityType: "investigation",
    entityId: investigationId,
    metadata: { step: "fishbone", causeCount: causes.length },
  })

  revalidatePath(`/investigations/${investigationId}/fishbone`)
}

// ─── Step 8: Is / Is Not ────────────────────────────────────────────────────

export async function saveIsIsNot(
  investigationId: string,
  entries: Array<{
    dimension: string
    isDescription: string
    isNotDescription: string
    distinction?: string
  }>
) {
  const session = await getSession()

  if (entries.length === 0) return { error: "At least one entry is required" }

  await prisma.$transaction(async (tx) => {
    await tx.isIsNotEntry.deleteMany({ where: { investigationId } })
    for (const entry of entries) {
      await tx.isIsNotEntry.create({
        data: {
          investigationId,
          dimension: entry.dimension,
          isDescription: entry.isDescription,
          isNotDescription: entry.isNotDescription,
          distinction: entry.distinction || null,
        },
      })
    }
  })

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email,
    action: AUDIT_ACTIONS.STEP_SAVE,
    entityType: "investigation",
    entityId: investigationId,
    metadata: { step: "is_is_not", entryCount: entries.length },
  })

  revalidatePath(`/investigations/${investigationId}/is-is-not`)
}

// ─── Step 9: Process Analysis ───────────────────────────────────────────────

export async function saveProcessAnalysis(
  investigationId: string,
  steps: Array<{
    stepNumber: number
    processStep: string
    expected: string
    actual: string
    deviation: boolean
    deviationDetail?: string
  }>
) {
  const session = await getSession()

  if (steps.length === 0) return { error: "At least one process step is required" }

  await prisma.$transaction(async (tx) => {
    await tx.processAnalysisStep.deleteMany({ where: { investigationId } })
    for (const step of steps) {
      await tx.processAnalysisStep.create({
        data: {
          investigationId,
          stepNumber: step.stepNumber,
          processStep: step.processStep,
          expected: step.expected,
          actual: step.actual,
          deviation: step.deviation,
          deviationDetail: step.deviationDetail || null,
        },
      })
    }
  })

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email,
    action: AUDIT_ACTIONS.STEP_SAVE,
    entityType: "investigation",
    entityId: investigationId,
    metadata: { step: "process_analysis", stepCount: steps.length },
  })

  revalidatePath(`/investigations/${investigationId}/process-analysis`)
}

// ─── Step 10: Root Cause ────────────────────────────────────────────────────

export async function saveRootCause(
  investigationId: string,
  data: {
    rootCauseStatement: string
    validationQ1: boolean
    validationQ2: boolean
    validationQ3: boolean
    warningAcknowledged: boolean
  }
) {
  const session = await getSession()

  const parsed = rootCauseSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const hasWarnings =
    !parsed.data.validationQ1 ||
    !parsed.data.validationQ2 ||
    !parsed.data.validationQ3

  await prisma.rootCauseRecord.upsert({
    where: { investigationId },
    create: {
      investigationId,
      rootCauseStatement: parsed.data.rootCauseStatement,
      validationQ1: parsed.data.validationQ1,
      validationQ2: parsed.data.validationQ2,
      validationQ3: parsed.data.validationQ3,
      hasWarnings,
      warningAcknowledged: data.warningAcknowledged,
    },
    update: {
      rootCauseStatement: parsed.data.rootCauseStatement,
      validationQ1: parsed.data.validationQ1,
      validationQ2: parsed.data.validationQ2,
      validationQ3: parsed.data.validationQ3,
      hasWarnings,
      warningAcknowledged: data.warningAcknowledged,
    },
  })

  await advanceStep(investigationId, 11)
  logAudit({
    userId: session.user.id,
    userEmail: session.user.email,
    action: AUDIT_ACTIONS.STEP_SAVE,
    entityType: "investigation",
    entityId: investigationId,
    metadata: { step: "root_cause", hasWarnings },
  })

  revalidatePath(`/investigations/${investigationId}`)
  redirect(`/investigations/${investigationId}/capa`)
}

// ─── Step 11: CAPA Actions ──────────────────────────────────────────────────

export async function createCAPAAction(
  investigationId: string,
  formData: FormData
) {
  const session = await getSession()

  const raw = {
    type: formData.get("type"),
    description: formData.get("description"),
    ownerId: formData.get("ownerId"),
    dueDate: formData.get("dueDate"),
    priority: formData.get("priority"),
    successMetric: formData.get("successMetric"),
    status: formData.get("status") || "OPEN",
  }

  const parsed = capaActionSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  await prisma.cAPAAction.create({
    data: {
      investigationId,
      ...parsed.data,
      dueDate: new Date(parsed.data.dueDate),
    },
  })

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email,
    action: AUDIT_ACTIONS.STEP_SAVE,
    entityType: "investigation",
    entityId: investigationId,
    metadata: { step: "capa_create", type: parsed.data.type },
  })

  revalidatePath(`/investigations/${investigationId}/capa`)
}

export async function updateCAPAAction(
  actionId: string,
  investigationId: string,
  formData: FormData
) {
  const session = await getSession()

  const raw = {
    type: formData.get("type"),
    description: formData.get("description"),
    ownerId: formData.get("ownerId"),
    dueDate: formData.get("dueDate"),
    priority: formData.get("priority"),
    successMetric: formData.get("successMetric"),
    status: formData.get("status"),
    completionNotes: formData.get("completionNotes") || undefined,
  }

  const parsed = capaActionSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  await prisma.cAPAAction.update({
    where: { id: actionId },
    data: {
      ...parsed.data,
      dueDate: new Date(parsed.data.dueDate),
      completedAt:
        parsed.data.status === "COMPLETED" ? new Date() : null,
    },
  })

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email,
    action: AUDIT_ACTIONS.STEP_SAVE,
    entityType: "investigation",
    entityId: investigationId,
    metadata: { step: "capa_update", actionId, status: parsed.data.status },
  })

  revalidatePath(`/investigations/${investigationId}/capa`)
}

export async function deleteCAPAAction(
  actionId: string,
  investigationId: string
) {
  const session = await getSession()
  await prisma.cAPAAction.delete({ where: { id: actionId } })
  logAudit({
    userId: session.user.id,
    userEmail: session.user.email,
    action: AUDIT_ACTIONS.STEP_SAVE,
    entityType: "investigation",
    entityId: investigationId,
    metadata: { step: "capa_delete", actionId },
  })
  revalidatePath(`/investigations/${investigationId}/capa`)
}

export async function advanceToCAPAStep(investigationId: string) {
  const { allowed, reason } = await isStepComplete(investigationId, 11)
  if (!allowed) return { error: reason }

  await advanceStep(investigationId, 12)
  revalidatePath(`/investigations/${investigationId}`)
  redirect(`/investigations/${investigationId}/effectiveness`)
}

// ─── Step 12: Effectiveness Verification ────────────────────────────────────

export async function saveEffectivenessSetup(
  investigationId: string,
  formData: FormData
) {
  const session = await getSession()

  const raw = {
    monitoringPeriodDays: Number(formData.get("monitoringPeriodDays")),
    verificationMethod: formData.get("verificationMethod"),
    successCriteria: formData.get("successCriteria"),
  }

  const parsed = effectivenessSetupSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  await prisma.effectivenessRecord.upsert({
    where: { investigationId },
    create: { investigationId, ...parsed.data },
    update: { ...parsed.data },
  })

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email,
    action: AUDIT_ACTIONS.STEP_SAVE,
    entityType: "investigation",
    entityId: investigationId,
    metadata: { step: "effectiveness_setup" },
  })

  revalidatePath(`/investigations/${investigationId}/effectiveness`)
}

export async function saveEffectivenessResult(
  investigationId: string,
  formData: FormData
) {
  const session = await getSession()
  if (!["ADMIN", "REVIEWER"].includes(session.user.role)) {
    return { error: "Only Reviewers can record effectiveness results" }
  }

  const raw = {
    result: formData.get("result"),
    resultDetail: formData.get("resultDetail"),
    reviewerName: formData.get("reviewerName"),
    reviewerNotes: formData.get("reviewerNotes") || undefined,
  }

  const parsed = effectivenessResultSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  if (parsed.data.result === "NOT_EFFECTIVE") {
    // Reopen CAPA section
    await prisma.investigation.update({
      where: { id: investigationId },
      data: { status: "REOPENED", currentStep: 11 },
    })

    await prisma.effectivenessRecord.update({
      where: { investigationId },
      data: {
        ...parsed.data,
        reviewerApproved: true,
        reviewedAt: new Date(),
      },
    })

    logAudit({
      userId: session.user.id,
      userEmail: session.user.email,
      action: AUDIT_ACTIONS.INVESTIGATION_REOPEN,
      entityType: "investigation",
      entityId: investigationId,
      metadata: { reason: "effectiveness_not_met" },
    })

    revalidatePath(`/investigations/${investigationId}`)
    redirect(`/investigations/${investigationId}/capa`)
  }

  await prisma.effectivenessRecord.update({
    where: { investigationId },
    data: {
      ...parsed.data,
      reviewerApproved: true,
      reviewedAt: new Date(),
    },
  })

  await prisma.investigation.update({
    where: { id: investigationId },
    data: { status: "PENDING_REVIEW", currentStep: 13 },
  })

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email,
    action: AUDIT_ACTIONS.STEP_SAVE,
    entityType: "investigation",
    entityId: investigationId,
    metadata: { step: "effectiveness_result", result: parsed.data.result },
  })

  revalidatePath(`/investigations/${investigationId}`)
  redirect(`/investigations/${investigationId}/summary`)
}

// ─── Step 14: Close Investigation ───────────────────────────────────────────

export async function closeInvestigation(investigationId: string) {
  const session = await getSession()
  if (!["ADMIN", "REVIEWER"].includes(session.user.role)) {
    return { error: "Only Reviewers can close investigations" }
  }

  const { allowed, reason } = await canCloseInvestigation(investigationId)
  if (!allowed) return { error: reason }

  await prisma.investigation.update({
    where: { id: investigationId },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
      currentStep: 14,
      reviewerId: session.user.id,
    },
  })

  logAudit({
    userId: session.user.id,
    userEmail: session.user.email,
    action: AUDIT_ACTIONS.INVESTIGATION_CLOSE,
    entityType: "investigation",
    entityId: investigationId,
  })

  revalidatePath("/dashboard")
  redirect(`/investigations/${investigationId}/summary`)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getCurrentStep(investigationId: string): Promise<number> {
  const inv = await prisma.investigation.findUnique({
    where: { id: investigationId },
    select: { currentStep: true },
  })
  return inv?.currentStep ?? 1
}

async function advanceStep(investigationId: string, toStep: number) {
  const current = await getCurrentStep(investigationId)
  if (toStep > current) {
    await prisma.investigation.update({
      where: { id: investigationId },
      data: { currentStep: toStep },
    })
  }
}
