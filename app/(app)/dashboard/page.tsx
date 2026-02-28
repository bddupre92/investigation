import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"

const PAGE_SIZE = 20

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  PENDING_REVIEW: "bg-yellow-100 text-yellow-700",
  CLOSED: "bg-green-100 text-green-700",
  REOPENED: "bg-red-100 text-red-700",
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  IN_PROGRESS: "In Progress",
  PENDING_REVIEW: "Pending Review",
  CLOSED: "Closed",
  REOPENED: "Reopened",
}

const STEP_LABELS: Record<number, string> = {
  1: "Create",
  2: "Problem Definition",
  3: "Risk Assessment",
  4: "Tool Decision",
  5: "Problem Category",
  6: "Five Whys",
  10: "Root Cause",
  11: "CAPA",
  12: "Effectiveness",
  13: "Summary",
  14: "Closed",
}

const VALID_STATUSES = ["IN_PROGRESS", "PENDING_REVIEW", "CLOSED", "REOPENED", "DRAFT"]

interface DashboardPageProps {
  searchParams: Promise<{ page?: string; status?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth()
  if (!session) return null

  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const statusFilter = VALID_STATUSES.includes(sp.status ?? "") ? sp.status : undefined

  const where: Record<string, unknown> =
    session.user.role === "INVESTIGATOR"
      ? { createdById: session.user.id }
      : {}

  if (statusFilter) {
    where.status = statusFilter
  }

  const [investigations, total] = await Promise.all([
    prisma.investigation.findMany({
      where,
      include: { createdBy: true, riskAssessment: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.investigation.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function buildUrl(params: { page?: number; status?: string }) {
    const parts: string[] = []
    if (params.page && params.page > 1) parts.push(`page=${params.page}`)
    if (params.status) parts.push(`status=${params.status}`)
    return parts.length > 0 ? `/dashboard?${parts.join("&")}` : "/dashboard"
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Investigations</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {total} total investigation{total !== 1 ? "s" : ""}
          </p>
        </div>
        {["ADMIN", "INVESTIGATOR"].includes(session.user.role) && (
          <Button asChild>
            <Link href="/investigations/new">+ New Investigation</Link>
          </Button>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        <Link
          href={buildUrl({})}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            !statusFilter
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All
        </Link>
        {VALID_STATUSES.filter(s => s !== "DRAFT").map((s) => (
          <Link
            key={s}
            href={buildUrl({ status: s })}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusFilter === s
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {STATUS_LABELS[s] ?? s}
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {investigations.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-500 text-sm">No investigations found.</p>
              {!statusFilter && ["ADMIN", "INVESTIGATOR"].includes(session.user.role) && (
                <Button asChild className="mt-4">
                  <Link href="/investigations/new">Create your first investigation</Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Current Step</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investigations.map((inv: (typeof investigations)[number]) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs text-slate-600">
                      {inv.referenceNumber}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {inv.title}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[inv.status] ?? ""}`}
                      >
                        {STATUS_LABELS[inv.status] ?? inv.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {STEP_LABELS[inv.currentStep] ?? `Step ${inv.currentStep}`}
                    </TableCell>
                    <TableCell>
                      {inv.riskAssessment ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            inv.riskAssessment.riskLevel === "HIGH"
                              ? "bg-red-100 text-red-700"
                              : inv.riskAssessment.riskLevel === "MEDIUM"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {inv.riskAssessment.riskLevel}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">&mdash;</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {inv.createdBy.name}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/investigations/${inv.id}`}>Open &rarr;</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
          <p>
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildUrl({ page: page - 1, status: statusFilter })}
                className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildUrl({ page: page + 1, status: statusFilter })}
                className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
