import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { Toaster } from "@/components/ui/sonner"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        userRole={session.user.role}
        userName={session.user.name ?? session.user.email ?? "User"}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <Toaster richColors position="top-right" />
    </div>
  )
}
