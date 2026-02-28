import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-utils"
import { Separator } from "@/components/ui/separator"
import { getUsageSummary } from "@/lib/ai-usage"
import { revalidatePath } from "next/cache"

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-800",
  REVIEWER: "bg-blue-100 text-blue-800",
  INVESTIGATOR: "bg-slate-100 text-slate-700",
  VIEWER: "bg-gray-100 text-gray-600",
}

async function handleUpdateLimits(formData: FormData) {
  "use server"
  const { requireAdmin: adminCheck } = await import("@/lib/auth-utils")
  await adminCheck()

  const userId = formData.get("userId") as string
  const dailyLimit = Number(formData.get("dailyLimit"))
  const monthlyLimit = Number(formData.get("monthlyLimit"))

  if (!userId || isNaN(dailyLimit) || isNaN(monthlyLimit)) return
  if (dailyLimit < 0 || monthlyLimit < 0) return

  const { prisma: db } = await import("@/lib/prisma")
  await db.user.update({
    where: { id: userId },
    data: { aiDailyLimit: dailyLimit, aiMonthlyLimit: monthlyLimit },
  })

  revalidatePath("/admin/ai-usage")
}

export default async function AdminAIUsagePage() {
  await requireAdmin()

  const [monthSummary, daySummary, users, recentRecords] = await Promise.all([
    getUsageSummary("month"),
    getUsageSummary("day"),
    prisma.user.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        aiDailyLimit: true,
        aiMonthlyLimit: true,
        _count: { select: { aiUsageRecords: true } },
      },
    }),
    prisma.aIUsageRecord.findMany({
      take: 25,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
  ])

  const totalCostMonth = monthSummary.totals._sum.estimatedCost ?? 0
  const totalCallsMonth = monthSummary.totals._count.id ?? 0
  const totalTokensMonth =
    (monthSummary.totals._sum.inputTokens ?? 0) +
    (monthSummary.totals._sum.outputTokens ?? 0)

  const totalCallsToday = daySummary.totals._count.id ?? 0
  const totalCostToday = daySummary.totals._sum.estimatedCost ?? 0

  // Build per-user monthly usage map
  const userMonthlyUsage = new Map<
    string,
    { calls: number; cost: number }
  >()
  for (const row of monthSummary.byUser) {
    userMonthlyUsage.set(row.userId, {
      calls: row._count.id,
      cost: row._sum.estimatedCost ?? 0,
    })
  }

  // Build per-user daily usage map
  const userDailyUsage = new Map<string, number>()
  for (const row of daySummary.byUser) {
    userDailyUsage.set(row.userId, row._count.id)
  }

  return (
    <div className="p-8 max-w-6xl">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">
          AI Usage Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor AI usage, costs, and manage per-user limits.
        </p>
      </div>

      <Separator className="mb-8" />

      {/* Summary cards */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
          Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Calls Today"
            value={totalCallsToday.toString()}
            sub={`$${totalCostToday.toFixed(4)}`}
          />
          <StatCard
            label="Calls This Month"
            value={totalCallsMonth.toString()}
            sub={`$${totalCostMonth.toFixed(4)}`}
          />
          <StatCard
            label="Tokens This Month"
            value={totalTokensMonth.toLocaleString()}
            sub="input + output"
          />
          <StatCard
            label="Active Users"
            value={users.length.toString()}
            sub={`${users.filter((u) => userMonthlyUsage.has(u.id)).length} used AI this month`}
          />
        </div>
      </section>

      <Separator className="mb-8" />

      {/* Per-user limits and usage */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
          User Limits &amp; Usage
        </h2>

        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  User
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Role
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Today
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Month
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Est. Cost
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Daily Limit
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Monthly Limit
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Update
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {users.map((user) => {
                const dailyUsed = userDailyUsage.get(user.id) ?? 0
                const monthUsage = userMonthlyUsage.get(user.id)
                const monthlyUsed = monthUsage?.calls ?? 0
                const monthCost = monthUsage?.cost ?? 0
                const dailyPct = user.aiDailyLimit > 0 ? dailyUsed / user.aiDailyLimit : 0
                const monthlyPct = user.aiMonthlyLimit > 0 ? monthlyUsed / user.aiMonthlyLimit : 0

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role] ?? "bg-slate-100 text-slate-700"}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={dailyPct >= 0.8 ? "text-amber-600 font-medium" : dailyPct >= 1 ? "text-red-600 font-medium" : "text-slate-700"}>
                        {dailyUsed}
                      </span>
                      <span className="text-slate-400"> / {user.aiDailyLimit}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={monthlyPct >= 0.8 ? "text-amber-600 font-medium" : monthlyPct >= 1 ? "text-red-600 font-medium" : "text-slate-700"}>
                        {monthlyUsed}
                      </span>
                      <span className="text-slate-400"> / {user.aiMonthlyLimit}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      ${monthCost.toFixed(4)}
                    </td>
                    <td colSpan={3} className="px-4 py-3">
                      <form
                        action={handleUpdateLimits}
                        className="flex items-center gap-2 justify-center"
                      >
                        <input type="hidden" name="userId" value={user.id} />
                        <input
                          type="number"
                          name="dailyLimit"
                          defaultValue={user.aiDailyLimit}
                          min={0}
                          className="w-16 h-7 text-xs text-center border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          name="monthlyLimit"
                          defaultValue={user.aiMonthlyLimit}
                          min={0}
                          className="w-16 h-7 text-xs text-center border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          type="submit"
                          className="h-7 px-2 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                        >
                          Save
                        </button>
                      </form>
                    </td>
                  </tr>
                )
              })}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-sm text-slate-400"
                  >
                    No active users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Separator className="mb-8" />

      {/* Recent activity log */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
          Recent Activity (Last 25)
        </h2>

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
                  Model
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Tokens
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Cost
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {recentRecords.map((rec) => (
                <tr
                  key={rec.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {rec.createdAt.toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {rec.user.name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {rec.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                    {rec.model.replace("claude-", "").replace("-20251001", "")}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600 text-xs">
                    {(rec.inputTokens + rec.outputTokens).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600 text-xs">
                    ${rec.estimatedCost.toFixed(4)}
                  </td>
                </tr>
              ))}
              {recentRecords.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-slate-400"
                  >
                    No AI usage recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  )
}
