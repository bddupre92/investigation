"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface NavItem {
  label: string
  href: string
  roles?: string[]
}

const NAV_ITEMS: NavItem[] = [
  { label: "Investigations", href: "/dashboard" },
  { label: "Users", href: "/admin/users", roles: ["ADMIN"] },
  { label: "AI Usage", href: "/admin/ai-usage", roles: ["ADMIN"] },
  { label: "Audit Log", href: "/admin/audit-log", roles: ["ADMIN"] },
]

interface SidebarProps {
  userRole: string
  userName: string
}

export function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname()

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  )

  return (
    <aside className="w-60 shrink-0 border-r bg-white flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-5 border-b">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-700 rounded flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">IQ</span>
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm leading-tight">InvestigationIQ</p>
            <p className="text-xs text-slate-500">Quality Intelligence</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
              pathname === item.href || pathname.startsWith(item.href + "/")
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t">
        <div className="px-3 py-2 text-xs text-slate-500 mb-1">
          <p className="font-medium text-slate-700 truncate">{userName}</p>
          <p className="capitalize">{userRole.toLowerCase()}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-600 hover:text-red-600"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Sign out
        </Button>
      </div>
    </aside>
  )
}
