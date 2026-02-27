import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
  4: "Problem Category",
  5: "Five Whys",
  6: "Root Cause",
  7: "CAPA",
  8: "Effectiveness",
  9: "Summary",
  10: "Closed",
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session) return null

  const where =
    session.user.role === "INVESTIGATOR"
      ? { createdById: session.user.id }
      : {}

  const investigations = await prisma.investigation.findMany({
    where,
    include: { createdBy: true, riskAssessment: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Investigations</h1>
          <p className="text-slate-500 mt-1">
            {investigations.length} total investigation{investigations.length !== 1 ? "s" : ""}
          </p>
        </div>
        {["ADMIN", "INVESTIGATOR"].includes(session.user.role) && (
          <Button asChild>
            <Link href="/investigations/new">+ New Investigation</Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {investigations.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-500 text-sm">No investigations yet.</p>
              {["ADMIN", "INVESTIGATOR"].includes(session.user.role) && (
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
                        <span className="text-slate-400 text-xs">—</span>
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
                        <Link href={`/investigations/${inv.id}`}>Open →</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
