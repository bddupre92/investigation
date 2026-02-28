import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ProcessAnalysisForm } from "./ProcessAnalysisForm"

interface ProcessAnalysisPageProps {
  params: Promise<{ id: string }>
}

export default async function ProcessAnalysisPage({ params }: ProcessAnalysisPageProps) {
  const { id } = await params

  const investigation = await prisma.investigation.findUnique({
    where: { id },
    include: {
      processAnalysisSteps: { orderBy: { stepNumber: "asc" } },
    },
  })

  if (!investigation) notFound()

  const existing = investigation.processAnalysisSteps.map((s) => ({
    stepNumber: s.stepNumber,
    processStep: s.processStep,
    expected: s.expected,
    actual: s.actual,
    deviation: s.deviation,
    deviationDetail: s.deviationDetail ?? "",
  }))

  return <ProcessAnalysisForm id={id} existing={existing} />
}
