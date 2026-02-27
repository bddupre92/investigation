import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { StepShell } from "@/components/investigation/StepShell"
import { saveProblemDefinition } from "@/actions/investigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Props {
  params: Promise<{ id: string }>
}

const DEPARTMENTS = [
  "Manufacturing",
  "Quality Control",
  "Quality Assurance",
  "Packaging",
  "Warehouse / Logistics",
  "Microbiology",
  "Analytical Development",
  "Process Development",
  "Engineering / Facilities",
  "Regulatory Affairs",
  "Other",
]

export default async function ProblemDefinitionPage({ params }: Props) {
  const { id } = await params

  const investigation = await prisma.investigation.findUnique({
    where: { id },
    include: { problemDefinition: true },
  })
  if (!investigation) notFound()

  const existing = investigation.problemDefinition
  const action = saveProblemDefinition.bind(null, id)

  return (
    <StepShell
      stepNumber={1}
      title="Problem Definition"
      description="Define what happened, where, when, and what immediate actions were taken."
      investigationId={id}
    >
      <form action={action} className="space-y-6">
        {/* What happened */}
        <div className="space-y-2">
          <Label htmlFor="description">What Happened? *</Label>
          <Textarea
            id="description"
            name="description"
            rows={4}
            placeholder="Describe the deviation, failure, or event in detail..."
            required
            defaultValue={existing?.description ?? ""}
          />
        </div>

        {/* Department + When */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="department">Department / Location *</Label>
            <select
              id="department"
              name="department"
              required
              defaultValue={existing?.department ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select department...</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="occurredAt">Date &amp; Time of Occurrence *</Label>
            <Input
              id="occurredAt"
              name="occurredAt"
              type="datetime-local"
              required
              defaultValue={
                existing?.occurredAt
                  ? new Date(existing.occurredAt).toISOString().slice(0, 16)
                  : ""
              }
            />
          </div>
        </div>

        {/* Detection Method */}
        <div className="space-y-2">
          <Label htmlFor="detectionMethod">Detection Method *</Label>
          <select
            id="detectionMethod"
            name="detectionMethod"
            required
            defaultValue={existing?.detectionMethod ?? ""}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Select detection method...</option>
            <option value="DEVIATION">Deviation Report</option>
            <option value="OOS">Out of Specification (OOS)</option>
            <option value="ALARM">Equipment Alarm</option>
            <option value="AUDIT">Audit Finding</option>
            <option value="COMPLAINT">Customer Complaint</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="detectionDetail">
            Additional Detection Details{" "}
            <span className="text-slate-400 font-normal">(optional)</span>
          </Label>
          <Input
            id="detectionDetail"
            name="detectionDetail"
            placeholder="e.g. Detected during routine QC review at 14:30"
            defaultValue={existing?.detectionDetail ?? ""}
          />
        </div>

        {/* Containment */}
        <div className="space-y-2">
          <Label htmlFor="containmentActions">Immediate Containment Actions Taken *</Label>
          <Textarea
            id="containmentActions"
            name="containmentActions"
            rows={3}
            placeholder="What was done immediately to contain the issue? e.g. Batch quarantined, line stopped, product hold placed..."
            required
            defaultValue={existing?.containmentActions ?? ""}
          />
        </div>

        {/* Product Impact */}
        <div className="space-y-3">
          <Label>Product Impacted?</Label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="productAffected"
                value="true"
                defaultChecked={existing?.productAffected === true}
              />
              <span className="text-sm">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="productAffected"
                value="false"
                defaultChecked={existing?.productAffected === false || !existing}
              />
              <span className="text-sm">No</span>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="productDetails">
            Product Details{" "}
            <span className="text-slate-400 font-normal">(batch numbers, quantities, disposition)</span>
          </Label>
          <Textarea
            id="productDetails"
            name="productDetails"
            rows={2}
            placeholder="e.g. Batch 240112, 5,000 units, placed on QC Hold"
            defaultValue={existing?.productDetails ?? ""}
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button type="submit" className="bg-blue-700 hover:bg-blue-800">
            Save &amp; Continue →
          </Button>
        </div>
      </form>
    </StepShell>
  )
}
