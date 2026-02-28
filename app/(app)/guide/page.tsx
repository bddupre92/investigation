import { Separator } from "@/components/ui/separator"

function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex-shrink-0">
        {number}
      </span>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    </div>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 mt-3">
      <span className="font-semibold">Tip:</span> {children}
    </div>
  )
}

export default function GuidePage() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          How to Use InvestigationIQ
        </h1>
        <p className="text-slate-500 mt-1">
          A step-by-step guide to conducting pharmaceutical investigations.
        </p>
      </div>

      <div className="space-y-10">
        {/* Overview */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Overview</h2>
          <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-700 space-y-3">
            <p>
              InvestigationIQ guides you through a structured pharmaceutical investigation
              process — from initial problem definition through root cause analysis to
              corrective and preventive actions (CAPA) and effectiveness verification.
            </p>
            <p>
              Each investigation follows a defined workflow. You complete steps in
              sequence, and the system tracks your progress. Investigations can be
              exported as CSV or printed as PDF reports at any time from the summary page.
            </p>
          </div>
        </section>

        <Separator />

        {/* User Roles */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">User Roles</h2>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Role
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Permissions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-900">Admin</td>
                  <td className="px-4 py-3 text-slate-700">
                    Full access. Create/manage users, view audit logs, manage AI usage
                    limits, create and close investigations.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-900">Investigator</td>
                  <td className="px-4 py-3 text-slate-700">
                    Create and work on investigations. Can complete all investigation
                    steps. Cannot close investigations or manage users.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-900">Reviewer</td>
                  <td className="px-4 py-3 text-slate-700">
                    View all investigations. Record effectiveness results and close
                    investigations. Cannot create new investigations.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-900">Viewer</td>
                  <td className="px-4 py-3 text-slate-700">
                    Read-only access to all investigations. Cannot create or modify any
                    data.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <Separator />

        {/* Investigation Workflow */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-6">
            Investigation Workflow
          </h2>

          <div className="space-y-8">
            {/* Step 1 */}
            <div>
              <SectionHeader number={1} title="Create Investigation" />
              <div className="ml-11 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 space-y-2">
                <p>
                  Click <strong>+ New Investigation</strong> from the dashboard. Enter
                  a clear, descriptive title that includes the product, batch number, or
                  event type where applicable.
                </p>
                <p className="text-slate-500">
                  Example: &quot;OOS result for Batch 240112 — HPLC Assay&quot;
                </p>
                <Tip>
                  A unique reference number (e.g., INV-2026-1234) is generated
                  automatically.
                </Tip>
              </div>
            </div>

            {/* Step 2 */}
            <div>
              <SectionHeader number={2} title="Problem Definition" />
              <div className="ml-11 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 space-y-2">
                <p>Define the problem using structured fields:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>
                    <strong>Description</strong> — What happened? Be specific and factual.
                  </li>
                  <li>
                    <strong>Department</strong> — Where in the facility did this occur?
                  </li>
                  <li>
                    <strong>Occurred At</strong> — Date and time of the event.
                  </li>
                  <li>
                    <strong>Detection Method</strong> — How was it discovered? (OOS,
                    Deviation, Alarm, Audit, Complaint, Other)
                  </li>
                  <li>
                    <strong>Containment Actions</strong> — What immediate actions were
                    taken to contain the issue?
                  </li>
                  <li>
                    <strong>Product Affected</strong> — Flag if product is impacted and
                    describe scope.
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div>
              <SectionHeader number={3} title="Risk Assessment" />
              <div className="ml-11 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 space-y-2">
                <p>
                  Score the investigation across 5 risk dimensions (1-3 each). The
                  system calculates a total score (5-15) and assigns a risk level:
                </p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>
                    <strong className="text-green-700">LOW</strong> (5-7) — Standard
                    investigation timeline
                  </li>
                  <li>
                    <strong className="text-yellow-700">MEDIUM</strong> (8-11) —
                    Expedited investigation required
                  </li>
                  <li>
                    <strong className="text-red-700">HIGH</strong> (12-15) — Urgent
                    investigation with management notification
                  </li>
                </ul>
                <Tip>
                  Risk level influences which analysis tools are recommended in the
                  next step.
                </Tip>
              </div>
            </div>

            {/* Step 4 */}
            <div>
              <SectionHeader number={4} title="Tool Decision" />
              <div className="ml-11 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 space-y-2">
                <p>
                  Answer additional 5W2H questions (Who, Why, How Much, Where, How)
                  and complexity indicators. Then select which analysis tools to use:
                </p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>
                    <strong>Five Whys</strong> — Best for simple, linear cause-and-effect
                    chains
                  </li>
                  <li>
                    <strong>Fishbone / Ishikawa</strong> — Best for complex problems with
                    multiple contributing factors across 6 categories
                  </li>
                  <li>
                    <strong>Is / Is Not Analysis</strong> — Best for ambiguous problems
                    needing scope clarification
                  </li>
                  <li>
                    <strong>Process Analysis</strong> — Best for process deviations and
                    sequential workflow failures
                  </li>
                </ul>
                <Tip>
                  Click <strong>Get AI Recommendation</strong> for an AI-powered
                  suggestion based on your problem description and risk score.
                </Tip>
              </div>
            </div>

            {/* Step 5 */}
            <div>
              <SectionHeader number={5} title="Problem Category" />
              <div className="ml-11 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 space-y-2">
                <p>
                  Classify the root problem into one of six categories: Human, Process,
                  Equipment, Material, Measurement, or Environment. Provide a
                  justification for your selection.
                </p>
              </div>
            </div>

            {/* Step 6 */}
            <div>
              <SectionHeader number={6} title="Five Whys Analysis" />
              <div className="ml-11 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 space-y-2">
                <p>
                  Ask &quot;Why?&quot; repeatedly to drill down to the root cause. For
                  each level, provide:
                </p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>
                    <strong>Question</strong> — The &quot;Why&quot; question at this level
                  </li>
                  <li>
                    <strong>Answer</strong> — The factual answer
                  </li>
                  <li>
                    <strong>Evidence</strong> — Supporting data, records, or observations
                  </li>
                </ul>
                <Tip>
                  You can create branching trees if a single &quot;Why&quot; has multiple
                  independent root causes. Use the &quot;Add Branch&quot; button.
                </Tip>
              </div>
            </div>

            {/* Steps 7-9 (conditional tools) */}
            <div>
              <SectionHeader number={7} title="Additional Analysis Tools" />
              <div className="ml-11 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 space-y-3">
                <p>
                  Based on your Tool Decision selections, you may also complete:
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-slate-800">
                      Fishbone / Ishikawa Diagram
                    </p>
                    <p className="text-slate-600">
                      Map potential causes across six categories: Man, Machine, Method,
                      Material, Measurement, and Environment. Add specific causes with
                      supporting evidence for each category.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Is / Is Not Analysis</p>
                    <p className="text-slate-600">
                      For each dimension (What, Where, When, Extent), describe what the
                      problem IS vs. what it IS NOT, then note the key distinction.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Process Analysis Table</p>
                    <p className="text-slate-600">
                      Walk through each process step and compare Expected vs. Actual
                      outcomes. Flag any deviations and describe what went wrong.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 10 */}
            <div>
              <SectionHeader number={8} title="Root Cause Confirmation" />
              <div className="ml-11 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 space-y-2">
                <p>
                  Write a clear root cause statement and validate it against three
                  criteria:
                </p>
                <ol className="list-decimal ml-5 space-y-1">
                  <li>Is the root cause supported by evidence?</li>
                  <li>Was sufficient data reviewed?</li>
                  <li>Will addressing this cause prevent recurrence?</li>
                </ol>
                <p>
                  If any validation question is answered &quot;No&quot;, you can still
                  proceed by acknowledging the warning.
                </p>
              </div>
            </div>

            {/* Step 11 */}
            <div>
              <SectionHeader number={9} title="CAPA Plan" />
              <div className="ml-11 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 space-y-2">
                <p>
                  Define Corrective and Preventive Actions. Each CAPA action includes:
                </p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>
                    <strong>Type</strong> — Correction (immediate fix), Corrective Action
                    (prevent this cause), or Preventive Action (prevent similar causes)
                  </li>
                  <li>
                    <strong>Description</strong> — What needs to be done
                  </li>
                  <li>
                    <strong>Owner</strong> — Who is responsible
                  </li>
                  <li>
                    <strong>Due Date</strong> and <strong>Priority</strong>
                  </li>
                  <li>
                    <strong>Success Metric</strong> — How you&apos;ll know it worked
                  </li>
                </ul>
                <Tip>
                  Add multiple CAPA actions as needed. Each can be tracked independently
                  through Open, In Progress, and Completed statuses.
                </Tip>
              </div>
            </div>

            {/* Step 12 */}
            <div>
              <SectionHeader number={10} title="Effectiveness Verification" />
              <div className="ml-11 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 space-y-2">
                <p>Define how effectiveness will be monitored:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>
                    <strong>Monitoring Period</strong> — How many days to monitor
                  </li>
                  <li>
                    <strong>Verification Method</strong> — How you&apos;ll check
                  </li>
                  <li>
                    <strong>Success Criteria</strong> — What &quot;effective&quot; looks
                    like
                  </li>
                </ul>
                <p>
                  After the monitoring period, a <strong>Reviewer</strong> records
                  whether the CAPAs were effective. If not effective, the investigation
                  is reopened at the CAPA step.
                </p>
              </div>
            </div>

            {/* Step 13 */}
            <div>
              <SectionHeader number={11} title="Summary & Close" />
              <div className="ml-11 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 space-y-2">
                <p>
                  The summary page shows a complete overview of the investigation. From
                  here you can:
                </p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>
                    <strong>Export CSV</strong> — Download a complete data export
                  </li>
                  <li>
                    <strong>Print / PDF</strong> — Generate a formatted PDF report
                  </li>
                  <li>
                    <strong>Close Investigation</strong> (Admin/Reviewer only) — Mark the
                    investigation as complete
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Admin Features */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Admin Features
          </h2>
          <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-700 space-y-4">
            <div>
              <p className="font-medium text-slate-800 mb-1">User Management</p>
              <p>
                Navigate to <strong>Users</strong> in the sidebar to create new users,
                assign roles, reset passwords, and manage active sessions. Admins can
                revoke individual sessions or all sessions for a user.
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-800 mb-1">AI Usage Dashboard</p>
              <p>
                The <strong>AI Usage</strong> page shows AI recommendation usage across
                all users — daily and monthly call counts, token consumption, and
                per-user limits. You can adjust daily and monthly limits per user
                directly from this page.
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-800 mb-1">Audit Log</p>
              <p>
                The <strong>Audit Log</strong> tracks all significant actions: logins,
                failed login attempts, investigation creation and closure, step saves,
                user management changes, and AI usage. Filter by action type and
                paginate through history.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
