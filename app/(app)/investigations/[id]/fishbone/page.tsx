import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { FishboneForm } from "./FishboneForm"

interface FishbonePageProps {
  params: Promise<{ id: string }>
}

export default async function FishbonePage({ params }: FishbonePageProps) {
  const { id } = await params

  const investigation = await prisma.investigation.findUnique({
    where: { id },
    include: {
      fishboneCauses: { orderBy: { category: "asc" } },
    },
  })

  if (!investigation) notFound()

  const existing = investigation.fishboneCauses.map((c) => ({
    category: c.category,
    cause: c.cause,
    evidence: c.evidence ?? "",
  }))

  return <FishboneForm id={id} existing={existing} />
}
