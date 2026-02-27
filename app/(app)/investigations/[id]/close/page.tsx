import { redirect } from "next/navigation"

interface ClosePageProps {
  params: Promise<{ id: string }>
}

export default async function ClosePage({ params }: ClosePageProps) {
  const { id } = await params
  redirect(`/investigations/${id}/summary`)
}
