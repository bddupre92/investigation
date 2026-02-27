"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createInvestigationSchema } from "@/schemas/investigation"
import { problemDefinitionSchema } from "@/schemas/problem"
import { riskAssessmentSchema } from "@/schemas/risk"
import { problemCategorySchema } from "@/schemas/category"
import { rootCauseSchema } from "@/schemas/root-cause"
import { capaActionSchema } from "@/schemas/capa"
import {
  effectivenessSetupSchema,
  effectivenessResultSchema,
} from "@/schemas/effectiveness"
import { calculateRiskLevel } from "@/lib/risk-calculator"
import { isStepComplete, canCloseInvestigation } from "@/lib/step-gates"

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

  redirect(`/investigations/${investigation.id}/problem`)
}

// ─── Step 2: Problem Definition ──────────────────────────────────────────────

export async function saveProblemDefinition(
  investigationId: string,
  formData: FormData
) {
  await getSession()

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

  revalidatePath(`/investigations/${investigationId}`)
  redirect(`/investigations/${investigationId}/risk`)
}

// ─── Step 3: Risk Assessment ─────────────────────────────────────────────────

export async function saveRiskAssessment(
  investigationId: string,
  formData: FormData
) {
  await getSession()

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
  revalidatePath(`/investigations/${investigationId}`)
  redirect(`/investigations/${investigationId}/category`)
}

// ─── Step 4: Problem Category ─────────────────────────────────────────────────

export async function saveProblemCategory(
  investigationId: string,
  formData: FormData
) {
  await getSession()

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

  await advanceStep(investigationId, 5)
  revalidatePath(`/investigations/${investigationId}`)
  redirect(`/investigations/${investigationId}/five-whys`)
}

// ─── Step 5: Five Whys ────────────────────────────────────────────────────────

export async function saveFiveWhys(
  investigationId: string,
  whys: Array<{
    whyNumber: number
    whyQuestion: string
    answer: string
    evidence: string
  }>
) {
  await getSession()

  // Upsert all 5 whys
  for (const why of whys) {
    await prisma.fiveWhysRecord.upsert({
      where: {
        investigationId_whyNumber: {
          investigationId,
          whyNumber: why.whyNumber,
        },
      },
      create: { investigationId, ...why },
      update: { ...why },
    })
  }

  await advanceStep(investigationId, 6)
  revalidatePath(`/investigations/${investigationId}`)
  redirect(`/investigations/${investigationId}/root-cause`)
}

// ─── Step 6: Root Cause ───────────────────────────────────────────────────────

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
  await getSession()

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

  await advanceStep(investigationId, 7)
  revalidatePath(`/investigations/${investigationId}`)
  redirect(`/investigations/${investigationId}/capa`)
}

// ─── Step 7: CAPA Actions ─────────────────────────────────────────────────────

export async function createCAPAAction(
  investigationId: string,
  formData: FormData
) {
  await getSession()

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

  revalidatePath(`/investigations/${investigationId}/capa`)
}

export async function updateCAPAAction(
  actionId: string,
  investigationId: string,
  formData: FormData
) {
  await getSession()

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

  revalidatePath(`/investigations/${investigationId}/capa`)
}

export async function deleteCAPAAction(
  actionId: string,
  investigationId: string
) {
  await getSession()
  await prisma.cAPAAction.delete({ where: { id: actionId } })
  revalidatePath(`/investigations/${investigationId}/capa`)
}

export async function advanceToCAPAStep(investigationId: string) {
  const { allowed, reason } = await isStepComplete(investigationId, 7)
  if (!allowed) return { error: reason }

  await advanceStep(investigationId, 8)
  revalidatePath(`/investigations/${investigationId}`)
  redirect(`/investigations/${investigationId}/effectiveness`)
}

// ─── Step 8: Effectiveness Verification ──────────────────────────────────────

export async function saveEffectivenessSetup(
  investigationId: string,
  formData: FormData
) {
  await getSession()

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
      data: { status: "REOPENED", currentStep: 7 },
    })

    await prisma.effectivenessRecord.update({
      where: { investigationId },
      data: {
        ...parsed.data,
        reviewerApproved: true,
        reviewedAt: new Date(),
      },
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
    data: { status: "PENDING_REVIEW", currentStep: 9 },
  })

  revalidatePath(`/investigations/${investigationId}`)
  redirect(`/investigations/${investigationId}/summary`)
}

// ─── Step 10: Close Investigation ─────────────────────────────────────────────

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
      currentStep: 10,
      reviewerId: session.user.id,
    },
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
