import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { StepShell } from "@/components/investigation/StepShell"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { saveProblemCategory } from "@/actions/investigation"

interface CategoryPageProps {
  params: Promise<{ id: string }>
}

const CATEGORIES = [
  {
    value: "HUMAN",
    emoji: "👤",
    label: "Human",
    description: "Error caused by human action, inaction, or decision-making",
  },
  {
    value: "PROCESS",
    emoji: "⚙️",
    label: "Process",
    description: "Failure in a defined procedure, workflow, or business process",
  },
  {
    value: "EQUIPMENT",
    emoji: "🔧",
    label: "Equipment",
    description: "Malfunction or failure of machinery, tools, or instruments",
  },
  {
    value: "MATERIAL",
    emoji: "📦",
    label: "Material",
    description: "Defect or issue with raw materials, components, or supplies",
  },
  {
    value: "MEASUREMENT",
    emoji: "📏",
    label: "Measurement",
    description: "Inaccurate measurement, calibration error, or data collection issue",
  },
]

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { id } = await params

  const investigation = await prisma.investigation.findUnique({
    where: { id },
    include: { problemCategory: true },
  })

  if (!investigation) notFound()

  const existing = investigation.problemCategory

  async function handleSave(formData: FormData) {
    "use server"
    await saveProblemCategory(id, formData)
  }

  return (
    <StepShell
      stepNumber={3}
      title="Problem Category"
      description="Classify the type of problem to guide your investigation approach."
      investigationId={id}
    >
      <form action={handleSave} className="space-y-8">
        {/* Category radio cards */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">
            Problem Category <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-1 gap-3">
            {CATEGORIES.map((cat) => (
              <label
                key={cat.value}
                className="relative flex cursor-pointer rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-400 hover:bg-blue-50 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 has-[:checked]:ring-1 has-[:checked]:ring-blue-500"
              >
                <input
                  type="radio"
                  name="category"
                  value={cat.value}
                  defaultChecked={existing?.category === cat.value}
                  required
                  className="sr-only"
                />
                <div className="flex items-center gap-4 w-full">
                  <span className="text-3xl flex-shrink-0">{cat.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {cat.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {cat.description}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="h-4 w-4 rounded-full border-2 border-slate-300 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-transparent" />
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Justification */}
        <div className="space-y-2">
          <Label htmlFor="justification" className="text-sm font-medium text-slate-700">
            Justification <span className="text-red-500">*</span>
          </Label>
          <p className="text-xs text-slate-500">
            Explain why this category best fits the problem. Minimum 10 characters.
          </p>
          <Textarea
            id="justification"
            name="justification"
            defaultValue={existing?.justification ?? ""}
            required
            minLength={10}
            rows={4}
            placeholder="Describe the reasoning behind your category selection..."
            className="resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
          >
            Back
          </Button>
          <Button type="submit">Save &amp; Continue</Button>
        </div>
      </form>
    </StepShell>
  )
}
