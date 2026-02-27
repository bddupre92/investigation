import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { EffectivenessForm } from "./EffectivenessForm"

interface EffectivenessPageProps {
  params: Promise<{ id: string }>
}

export default async function EffectivenessPage({
  params,
}: EffectivenessPageProps) {
  const { id } = await params

  const session = await auth()
  if (!session) redirect("/login")

  const investigation = await prisma.investigation.findUnique({
    where: { id },
    include: { effectivenessRecord: true },
  })

  if (!investigation) notFound()

  const record = investigation.effectivenessRecord

  const existing = record
    ? {
        monitoringPeriodDays: record.monitoringPeriodDays,
        verificationMethod: record.verificationMethod,
        successCriteria: record.successCriteria,
        result: record.result as string,
        resultDetail: record.resultDetail,
        reviewerName: record.reviewerName,
        reviewerApproved: record.reviewerApproved,
      }
    : null

  return (
    <EffectivenessForm
      id={id}
      userRole={session.user.role as string}
      existing={existing}
    />
  )
}
