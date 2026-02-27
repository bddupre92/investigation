import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { RiskForm } from "./RiskForm"

interface Props {
  params: Promise<{ id: string }>
}

export default async function RiskPage({ params }: Props) {
  const { id } = await params

  const investigation = await prisma.investigation.findUnique({
    where: { id },
    include: { riskAssessment: true },
  })
  if (!investigation) notFound()

  return <RiskForm id={id} existing={investigation.riskAssessment} />
}
