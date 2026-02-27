import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { FiveWhysForm } from "./FiveWhysForm"

interface FiveWhysPageProps {
  params: Promise<{ id: string }>
}

export default async function FiveWhysPage({ params }: FiveWhysPageProps) {
  const { id } = await params

  const investigation = await prisma.investigation.findUnique({
    where: { id },
    include: {
      fiveWhys: {
        orderBy: [{ treeIndex: "asc" }, { depth: "asc" }, { createdAt: "asc" }],
      },
    },
  })

  if (!investigation) notFound()

  const existing = investigation.fiveWhys.map((w) => ({
    id: w.id,
    parentId: w.parentId,
    treeIndex: w.treeIndex,
    depth: w.depth,
    whyQuestion: w.whyQuestion,
    answer: w.answer,
    evidence: w.evidence,
  }))

  return <FiveWhysForm id={id} existing={existing} />
}
