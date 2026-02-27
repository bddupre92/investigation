import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { stepPath } from "@/lib/step-gates"

interface Props {
  params: Promise<{ id: string }>
}

export default async function InvestigationRootPage({ params }: Props) {
  const { id } = await params

  const investigation = await prisma.investigation.findUnique({
    where: { id },
    select: { currentStep: true, status: true },
  })

  if (!investigation) redirect("/dashboard")

  if (investigation.status === "CLOSED") {
    redirect(`/investigations/${id}/summary`)
  }

  const path = stepPath(investigation.currentStep)
  redirect(`/investigations/${id}/${path}`)
}
