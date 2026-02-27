import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { CategoryForm } from "./CategoryForm"

interface CategoryPageProps {
  params: Promise<{ id: string }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { id } = await params

  const investigation = await prisma.investigation.findUnique({
    where: { id },
    include: { problemCategory: true },
  })

  if (!investigation) notFound()

  const existing = investigation.problemCategory
    ? {
        category: investigation.problemCategory.category as string,
        justification: investigation.problemCategory.justification,
      }
    : null

  return <CategoryForm id={id} existing={existing} />
}
