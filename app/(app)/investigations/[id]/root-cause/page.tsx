import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { RootCauseForm } from "./RootCauseForm"

interface RootCausePageProps {
  params: Promise<{ id: string }>
}

export default async function RootCausePage({ params }: RootCausePageProps) {
  const { id } = await params

  const investigation = await prisma.investigation.findUnique({
    where: { id },
    include: { rootCause: true },
  })

  if (!investigation) notFound()

  const existing = investigation.rootCause
    ? {
        rootCauseStatement: investigation.rootCause.rootCauseStatement,
        validationQ1: investigation.rootCause.validationQ1,
        validationQ2: investigation.rootCause.validationQ2,
        validationQ3: investigation.rootCause.validationQ3,
        hasWarnings: investigation.rootCause.hasWarnings,
        warningAcknowledged: investigation.rootCause.warningAcknowledged,
      }
    : null

  return <RootCauseForm id={id} existing={existing} />
}
