import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { notFound, redirect } from "next/navigation"
import { InvestigationStepper } from "@/components/investigation/InvestigationStepper"

interface InvestigationLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function InvestigationLayout({
  children,
  params,
}: InvestigationLayoutProps) {
  const session = await auth()
  if (!session) redirect("/login")

  const { id } = await params

  const investigation = await prisma.investigation.findUnique({
    where: { id },
    select: {
      id: true,
      referenceNumber: true,
      title: true,
      currentStep: true,
      createdById: true,
    },
  })

  if (!investigation) notFound()

  // Viewers and non-owners can view but not edit (middleware handles write guards)
  return (
    <div className="flex min-h-screen">
      <InvestigationStepper
        investigationId={investigation.id}
        currentStep={investigation.currentStep}
        referenceNumber={investigation.referenceNumber}
        title={investigation.title}
      />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
