import { requireAdmin } from "@/lib/auth-utils"
import { getAuditLogs } from "@/lib/audit"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import type { AuditLog } from "@prisma/client"

const ACTION_COLORS: Record<string, string> = {
  "user.login": "bg-green-50 text-green-700",
  "user.login_failed": "bg-red-50 text-red-700",
  "user.create": "bg-purple-50 text-purple-700",
  "user.update_role": "bg-purple-50 text-purple-700",
  "user.reset_password": "bg-amber-50 text-amber-700",
  "user.revoke_session": "bg-red-50 text-red-700",
  "user.revoke_all_sessions": "bg-red-50 text-red-700",
  "investigation.create": "bg-blue-50 text-blue-700",
  "investigation.update": "bg-blue-50 text-blue-700",
  "investigation.close": "bg-slate-100 text-slate-700",
  "step.save": "bg-sky-50 text-sky-700",
  "ai.recommendation": "bg-indigo-50 text-indigo-700",
  "admin.ai_limits_update": "bg-amber-50 text-amber-700",
}

interface PageProps {
  searchParams: Promise<{ page?: string; action?: string }>
}

export default async function AuditLogPage({ searchParams }: PageProps) {
  await requireAdmin()

  const params = await searchParams
  const page = Number(params.page) || 1
  const action = params.action || undefined

  const result = await getAuditLogs({ page, pageSize: 50, action })

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Audit Log</h1>
        <p className="text-sm text-slate-500 mt-1">
          Complete record of system actions and changes.
        </p>
      </div>

      <Separator className="mb-6" />

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <FilterChip href="/admin/audit-log" label="All" active={!action} />
        <FilterChip href="/admin/audit-log?action=user.login" label="Logins" active={action === "user.login"} />
        <FilterChip href="/admin/audit-log?action=user.login_failed" label="Failed Logins" active={action === "user.login_failed"} />
        <FilterChip href="/admin/audit-log?action=investigation.create" label="New Investigations" active={action === "investigation.create"} />
        <FilterChip href="/admin/audit-log?action=step.save" label="Step Saves" active={action === "step.save"} />
        <FilterChip href="/admin/audit-log?action=ai.recommendation" label="AI Calls" active={action === "ai.recommendation"} />
      </div>

      {/* Results count */}
      <p className="text-xs text-slate-500 mb-4">
        {result.total} entries &middot; Page {result.page} of {result.totalPages || 1}
      </p>

      {/* Log table */}
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                Time
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                User
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                Action
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                Entity
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                Details
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                IP
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {result.logs.map((log: AuditLog) => {
              const meta = log.metadata ? JSON.parse(log.metadata) : null

              return (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {log.createdAt.toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-slate-700 text-xs">
                    {log.userEmail ?? <span className="text-slate-400">system</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${ACTION_COLORS[log.action] ?? "bg-slate-100 text-slate-700"}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {log.entityType && (
                      <span>
                        {log.entityType}
                        {log.entityId && (
                          <span className="text-slate-400 ml-1 font-mono">
                            {log.entityId.slice(0, 8)}
                          </span>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate">
                    {meta ? summarizeMetadata(meta) : null}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                    {log.ipAddress ?? "—"}
                  </td>
                </tr>
              )
            })}
            {result.logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                  No audit log entries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {result.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {page > 1 && (
            <Link
              href={`/admin/audit-log?page=${page - 1}${action ? `&action=${action}` : ""}`}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50"
            >
              Previous
            </Link>
          )}
          <span className="px-3 py-1.5 text-xs text-slate-500">
            {page} / {result.totalPages}
          </span>
          {page < result.totalPages && (
            <Link
              href={`/admin/audit-log?page=${page + 1}${action ? `&action=${action}` : ""}`}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function FilterChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
        active
          ? "bg-blue-600 text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {label}
    </Link>
  )
}

function summarizeMetadata(meta: Record<string, unknown>): string {
  const parts: string[] = []
  if (meta.step) parts.push(`step: ${meta.step}`)
  if (meta.role) parts.push(`role: ${meta.role}`)
  if (meta.model) parts.push(`model: ${meta.model}`)
  if (meta.title) parts.push(String(meta.title))
  if (meta.referenceNumber) parts.push(String(meta.referenceNumber))
  if (parts.length === 0 && meta.reason) parts.push(String(meta.reason))
  return parts.join(", ") || JSON.stringify(meta).slice(0, 60)
}
