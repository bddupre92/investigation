import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { IsIsNotForm } from "./IsIsNotForm"

interface IsIsNotPageProps {
  params: Promise<{ id: string }>
}

export default async function IsIsNotPage({ params }: IsIsNotPageProps) {
  const { id } = await params

  const investigation = await prisma.investigation.findUnique({
    where: { id },
    include: {
      isIsNotEntries: true,
    },
  })

  if (!investigation) notFound()

  const existing = investigation.isIsNotEntries.map((e) => ({
    dimension: e.dimension,
    isDescription: e.isDescription,
    isNotDescription: e.isNotDescription,
    distinction: e.distinction ?? "",
  }))

  return <IsIsNotForm id={id} existing={existing} />
}
