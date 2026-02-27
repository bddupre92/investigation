import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { CAPAForm } from "./CAPAForm"

interface CAPAPageProps {
  params: Promise<{ id: string }>
}

interface CAPAActionWithOwner {
  id: string
  type: string
  description: string
  ownerId: string
  owner: { name: string }
  dueDate: Date
  priority: string
  successMetric: string
  status: string
}

export default async function CAPAPage({ params }: CAPAPageProps) {
  const { id } = await params

  const investigation = await prisma.investigation.findUnique({
    where: { id },
    include: {
      capaActions: {
        include: { owner: true },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!investigation) notFound()

  const users = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  const capaActions = (investigation.capaActions as CAPAActionWithOwner[]).map((a) => ({
    id: a.id,
    type: a.type as string,
    description: a.description,
    ownerId: a.ownerId,
    ownerName: a.owner.name,
    dueDate: a.dueDate.toISOString(),
    priority: a.priority as string,
    successMetric: a.successMetric,
    status: a.status as string,
  }))

  return <CAPAForm id={id} capaActions={capaActions} users={users} />
}
