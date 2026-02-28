import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ToolDecisionForm } from "./ToolDecisionForm"

interface ToolDecisionPageProps {
  params: Promise<{ id: string }>
}

export default async function ToolDecisionPage({ params }: ToolDecisionPageProps) {
  const { id } = await params

  const investigation = await prisma.investigation.findUnique({
    where: { id },
    include: {
      riskAssessment: true,
      problemDefinition: true,
      toolDecision: true,
    },
  })

  if (!investigation) notFound()

  const existing = investigation.toolDecision
    ? {
        fiveWhys: investigation.toolDecision.fiveWhys,
        fishbone: investigation.toolDecision.fishbone,
        isIsNot: investigation.toolDecision.isIsNot,
        processAnalysis: investigation.toolDecision.processAnalysis,
        notes: investigation.toolDecision.notes ?? "",
        who: investigation.toolDecision.who ?? "",
        why: investigation.toolDecision.why ?? "",
        howMuch: investigation.toolDecision.howMuch ?? "",
        whereDetail: investigation.toolDecision.whereDetail ?? "",
        howDetail: investigation.toolDecision.howDetail ?? "",
        causeType: investigation.toolDecision.causeType ?? undefined,
        isRecurring: investigation.toolDecision.isRecurring ?? undefined,
        suspectedCauses: investigation.toolDecision.suspectedCauses ?? undefined,
        processChangeInvolved: investigation.toolDecision.processChangeInvolved ?? undefined,
        processChangeDetail: investigation.toolDecision.processChangeDetail ?? "",
        aiRecommendation: investigation.toolDecision.aiRecommendation ?? "",
      }
    : null

  const context = {
    riskLevel: investigation.riskAssessment?.riskLevel ?? null,
    totalScore: investigation.riskAssessment?.totalScore ?? null,
    problemSummary: investigation.problemDefinition?.description?.slice(0, 200) ?? "",
  }

  const problemData = investigation.problemDefinition
    ? {
        description: investigation.problemDefinition.description,
        department: investigation.problemDefinition.department,
        occurredAt: investigation.problemDefinition.occurredAt.toISOString(),
        detectionMethod: investigation.problemDefinition.detectionMethod,
        detectionDetail: investigation.problemDefinition.detectionDetail ?? "",
        productAffected: investigation.problemDefinition.productAffected,
        productDetails: investigation.problemDefinition.productDetails ?? "",
        containmentActions: investigation.problemDefinition.containmentActions,
      }
    : null

  const riskData = investigation.riskAssessment
    ? {
        q1Score: investigation.riskAssessment.q1Score,
        q2Score: investigation.riskAssessment.q2Score,
        q3Score: investigation.riskAssessment.q3Score,
        q4Score: investigation.riskAssessment.q4Score,
        q5Score: investigation.riskAssessment.q5Score,
        totalScore: investigation.riskAssessment.totalScore,
        riskLevel: investigation.riskAssessment.riskLevel,
      }
    : null

  return (
    <ToolDecisionForm
      id={id}
      existing={existing}
      context={context}
      problemData={problemData}
      riskData={riskData}
    />
  )
}
