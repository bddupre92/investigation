import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { PrintButton } from "@/components/ui/client-buttons"
import { closeInvestigation } from "@/actions/investigation"

interface SummaryPageProps {
  params: Promise<{ id: string }>
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  PENDING_REVIEW: "bg-yellow-100 text-yellow-800",
  CLOSED: "bg-green-100 text-green-800",
  REOPENED: "bg-orange-100 text-orange-800",
}

const RISK_COLORS: Record<string, string> = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-red-100 text-red-800",
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-red-100 text-red-800",
}

const STATUS_ACTION_COLORS: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-orange-100 text-orange-800",
  COMPLETED: "bg-green-100 text-green-800",
}

function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 print:mb-3">
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0">
        {number}
      </span>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
    </div>
  )
}

function Field({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100 last:border-0">
      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide pt-0.5">
        {label}
      </dt>
      <dd className="col-span-2 text-sm text-slate-800">{value ?? "\u2014"}</dd>
    </div>
  )
}

export default async function SummaryPage({ params }: SummaryPageProps) {
  const { id } = await params

  const session = await auth()
  if (!session) redirect("/login")

  const investigation = await prisma.investigation.findUnique({
    where: { id },
    include: {
      problemDefinition: true,
      riskAssessment: true,
      problemCategory: true,
      fiveWhys: { orderBy: [{ treeIndex: "asc" }, { depth: "asc" }, { createdAt: "asc" }] },
      rootCause: true,
      capaActions: {
        include: { owner: true },
        orderBy: { createdAt: "asc" },
      },
      effectivenessRecord: true,
      createdBy: true,
    },
  })

  if (!investigation) notFound()

  const {
    problemDefinition: pd,
    riskAssessment: ra,
    problemCategory: pc,
    fiveWhys,
    rootCause: rc,
    capaActions,
    effectivenessRecord: er,
  } = investigation

  const userRole = session.user.role as string
  const isAdminOrReviewer = ["ADMIN", "REVIEWER"].includes(userRole)
  const canClose = isAdminOrReviewer && investigation.status !== "CLOSED"

  async function handleClose() {
    "use server"
    await closeInvestigation(id)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Print-only page header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-xl font-bold text-slate-900">Investigation Report</h1>
        <p className="text-xs text-slate-500 mt-1">
          Generated:{" "}
          {new Date().toLocaleDateString("en-US", { dateStyle: "long" })}
        </p>
      </div>

      {/* Top header bar */}
      <div className="flex items-start justify-between gap-4 mb-6 print:mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {investigation.referenceNumber}
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[investigation.status as string] ?? "bg-slate-100 text-slate-700"}`}
            >
              {(investigation.status as string).replace("_", " ")}
            </span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mt-1">
            {investigation.title}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Created:{" "}
            {investigation.createdAt.toLocaleDateString("en-US", {
              dateStyle: "medium",
            })}{" "}
            by {investigation.createdBy.name}
            {investigation.closedAt && (
              <>
                {" "}
                &middot; Closed:{" "}
                {investigation.closedAt.toLocaleDateString("en-US", {
                  dateStyle: "medium",
                })}
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden flex-shrink-0">
          <PrintButton />

          {canClose && (
            <form action={handleClose}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 transition-colors cursor-pointer"
              >
                Close Investigation
              </button>
            </form>
          )}
        </div>
      </div>

      <Separator className="mb-8 print:mb-4" />

      <div className="space-y-10 print:space-y-6">
        {/* Section 1: Problem Definition */}
        <section>
          <SectionHeader number={1} title="Problem Definition" />
          {pd ? (
            <dl className="rounded-lg border border-slate-200 bg-white p-4 print:border-slate-300">
              <Field label="Description" value={pd.description} />
              <Field label="Department" value={pd.department} />
              <Field
                label="Occurred At"
                value={pd.occurredAt.toLocaleDateString("en-US", {
                  dateStyle: "medium",
                })}
              />
              <Field label="Detection Method" value={pd.detectionMethod as string} />
              {pd.detectionDetail && (
                <Field label="Detection Detail" value={pd.detectionDetail} />
              )}
              <Field label="Containment Actions" value={pd.containmentActions} />
              <Field
                label="Product Affected"
                value={pd.productAffected ? "Yes" : "No"}
              />
              {pd.productDetails && (
                <Field label="Product Details" value={pd.productDetails} />
              )}
            </dl>
          ) : (
            <p className="text-sm text-slate-400 italic">Not completed.</p>
          )}
        </section>

        <Separator className="print:hidden" />

        {/* Section 2: Risk Assessment */}
        <section className="print:break-before-page">
          <SectionHeader number={2} title="Risk Assessment" />
          {ra ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">
                    Risk Score
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {ra.totalScore}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">
                    Risk Level
                  </p>
                  <span
                    className={`mt-1 inline-block text-sm font-semibold px-3 py-1 rounded-full ${RISK_COLORS[ra.riskLevel as string] ?? "bg-slate-100 text-slate-700"}`}
                  >
                    {ra.riskLevel as string}
                  </span>
                </div>
              </div>
              <dl className="rounded-lg border border-slate-200 bg-white p-4">
                <Field label="Q1 Score" value={ra.q1Score} />
                <Field label="Q2 Score" value={ra.q2Score} />
                <Field label="Q3 Score" value={ra.q3Score} />
                <Field label="Q4 Score" value={ra.q4Score} />
                <Field label="Q5 Score" value={ra.q5Score} />
              </dl>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">Not completed.</p>
          )}
        </section>

        <Separator className="print:hidden" />

        {/* Section 3: Problem Category */}
        <section>
          <SectionHeader number={3} title="Problem Category" />
          {pc ? (
            <dl className="rounded-lg border border-slate-200 bg-white p-4">
              <Field label="Category" value={pc.category as string} />
              <Field label="Justification" value={pc.justification} />
            </dl>
          ) : (
            <p className="text-sm text-slate-400 italic">Not completed.</p>
          )}
        </section>

        <Separator className="print:hidden" />

        {/* Section 4: Five Whys */}
        <section className="print:break-before-page">
          <SectionHeader number={4} title="Five Whys Analysis" />
          {fiveWhys.length > 0 ? (
            <div className="space-y-6">
              {Array.from(new Set(fiveWhys.map((w: { treeIndex: number }) => w.treeIndex)))
                .sort((a, b) => a - b)
                .map((treeIdx, treeArrayIdx) => {
                  const treeNodes = fiveWhys.filter((w: { treeIndex: number }) => w.treeIndex === treeIdx)
                  return (
                    <div key={treeIdx} className="space-y-3">
                      {treeArrayIdx > 0 && (
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide pt-2 border-t border-slate-200">
                          Root Cause Tree {treeArrayIdx + 1}
                        </p>
                      )}
                      {treeNodes.map((w: {
                        id: string
                        treeIndex: number
                        depth: number
                        whyQuestion: string
                        answer: string
                        evidence: string
                      }) => (
                        <div
                          key={w.id}
                          className="rounded-lg border border-slate-200 bg-white p-4"
                          style={{ marginLeft: `${(w.depth - 1) * 1.5}rem` }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                              {w.depth}
                            </span>
                            <span className="text-sm font-medium text-slate-800">
                              Why {w.depth}
                            </span>
                          </div>
                          <dl>
                            <Field label="Question" value={w.whyQuestion || "\u2014"} />
                            <Field label="Answer" value={w.answer || "\u2014"} />
                            <Field label="Evidence" value={w.evidence || "\u2014"} />
                          </dl>
                        </div>
                      ))}
                    </div>
                  )
                })}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">Not completed.</p>
          )}
        </section>

        <Separator className="print:hidden" />

        {/* Section 5: Root Cause */}
        <section>
          <SectionHeader number={5} title="Root Cause Confirmation" />
          {rc ? (
            <dl className="rounded-lg border border-slate-200 bg-white p-4">
              <Field label="Root Cause Statement" value={rc.rootCauseStatement} />
              <Field
                label="Supported by Evidence"
                value={rc.validationQ1 ? "Yes" : "No"}
              />
              <Field
                label="Sufficient Data Reviewed"
                value={rc.validationQ2 ? "Yes" : "No"}
              />
              <Field
                label="Prevents Recurrence"
                value={rc.validationQ3 ? "Yes" : "No"}
              />
              {rc.hasWarnings && (
                <Field
                  label="Warning Acknowledged"
                  value={rc.warningAcknowledged ? "Yes" : "No"}
                />
              )}
            </dl>
          ) : (
            <p className="text-sm text-slate-400 italic">Not completed.</p>
          )}
        </section>

        <Separator className="print:hidden" />

        {/* Section 6: CAPA Actions */}
        <section className="print:break-before-page">
          <SectionHeader number={6} title="CAPA Plan" />
          {capaActions.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Type
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Description
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Owner
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Due Date
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Priority
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Success Metric
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {capaActions.map((a: {
                    id: string
                    type: string
                    description: string
                    owner: { name: string }
                    dueDate: Date
                    priority: string
                    status: string
                    successMetric: string
                  }) => (
                    <tr key={a.id}>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                        {(a.type as string).replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-800 max-w-xs">
                        {a.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                        {a.owner.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                        {a.dueDate.toLocaleDateString("en-US", {
                          dateStyle: "medium",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[a.priority as string] ?? "bg-slate-100 text-slate-700"}`}
                        >
                          {a.priority as string}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_ACTION_COLORS[a.status as string] ?? "bg-slate-100 text-slate-700"}`}
                        >
                          {(a.status as string).replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 max-w-xs">
                        {a.successMetric}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">
              No CAPA actions defined.
            </p>
          )}
        </section>

        <Separator className="print:hidden" />

        {/* Section 7: Effectiveness */}
        <section>
          <SectionHeader number={7} title="Effectiveness Verification" />
          {er ? (
            <dl className="rounded-lg border border-slate-200 bg-white p-4">
              <Field
                label="Monitoring Period"
                value={`${er.monitoringPeriodDays} days`}
              />
              <Field label="Verification Method" value={er.verificationMethod} />
              <Field label="Success Criteria" value={er.successCriteria} />
              <Field label="Result" value={er.result as string} />
              {er.resultDetail && (
                <Field label="Result Detail" value={er.resultDetail} />
              )}
              {er.reviewerName && (
                <Field label="Reviewer" value={er.reviewerName} />
              )}
              <Field
                label="Reviewer Approved"
                value={er.reviewerApproved ? "Yes" : "Pending"}
              />
            </dl>
          ) : (
            <p className="text-sm text-slate-400 italic">Not completed.</p>
          )}
        </section>
      </div>

      {/* Print footer */}
      <div className="hidden print:block mt-8 pt-4 border-t border-slate-200 text-xs text-slate-400 text-center">
        {investigation.referenceNumber} &middot; InvestigationIQ &middot;{" "}
        {new Date().getFullYear()}
      </div>

      {/* Print button script (works without client component) */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', function() {
              var btns = document.querySelectorAll('[data-print]');
              btns.forEach(function(btn) {
                btn.addEventListener('click', function() { window.print(); });
              });
            });
          `,
        }}
      />
    </div>
  )
}
