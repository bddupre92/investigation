"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { StepShell } from "@/components/investigation/StepShell"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createCAPAAction,
  updateCAPAAction,
  advanceToCAPAStep,
} from "@/actions/investigation"

interface CAPAAction {
  id: string
  type: string
  description: string
  ownerId: string
  ownerName: string
  dueDate: string
  priority: string
  successMetric: string
  status: string
}

interface User {
  id: string
  name: string
}

interface CAPAFormProps {
  id: string
  capaActions: CAPAAction[]
  users: User[]
}

const TAB_TYPES = [
  { tab: "correction", type: "CORRECTION", label: "Correction" },
  { tab: "corrective", type: "CORRECTIVE_ACTION", label: "Corrective Action" },
  { tab: "preventive", type: "PREVENTIVE_ACTION", label: "Preventive Action" },
]

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-red-100 text-red-800",
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-orange-100 text-orange-800",
  COMPLETED: "bg-green-100 text-green-800",
}

function ActionCard({
  action,
  id,
  users,
}: {
  action: CAPAAction
  id: string
  users: User[]
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleEdit(formData: FormData) {
    formData.append("type", action.type)
    startTransition(async () => {
      await updateCAPAAction(action.id, id, formData)
      setOpen(false)
      router.refresh()
    })
  }

  const dueDateFormatted = new Date(action.dueDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-sm font-medium text-slate-900 leading-snug">
              {action.description}
            </p>
            <p className="text-xs text-slate-500">
              Owner: {action.ownerName} &middot; Due: {dueDateFormatted}
            </p>
            {action.successMetric && (
              <p className="text-xs text-slate-500 italic">
                Success: {action.successMetric}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[action.priority] ?? "bg-slate-100 text-slate-700"}`}
            >
              {action.priority}
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[action.status] ?? "bg-slate-100 text-slate-700"}`}
            >
              {action.status.replace("_", " ")}
            </span>
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Action</DialogTitle>
              </DialogHeader>
              <ActionForm
                actionId={action.id}
                investigationId={id}
                users={users}
                defaultValues={action}
                onSubmit={handleEdit}
                isPending={isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}

function ActionForm({
  actionId,
  investigationId,
  users,
  type,
  defaultValues,
  onSubmit,
  isPending,
}: {
  actionId?: string
  investigationId: string
  users: User[]
  type?: string
  defaultValues?: Partial<CAPAAction>
  onSubmit: (formData: FormData) => void
  isPending: boolean
}) {
  return (
    <form action={onSubmit} className="space-y-4 mt-2">
      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-sm font-medium">
          Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={defaultValues?.description ?? ""}
          required
          rows={3}
          placeholder="Describe the action to be taken..."
          className="resize-none text-sm"
        />
      </div>

      {/* Owner */}
      <div className="space-y-1.5">
        <Label htmlFor="ownerId" className="text-sm font-medium">
          Owner <span className="text-red-500">*</span>
        </Label>
        <select
          id="ownerId"
          name="ownerId"
          defaultValue={defaultValues?.ownerId ?? ""}
          required
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Select owner...</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      {/* Due Date */}
      <div className="space-y-1.5">
        <Label htmlFor="dueDate" className="text-sm font-medium">
          Due Date <span className="text-red-500">*</span>
        </Label>
        <Input
          id="dueDate"
          name="dueDate"
          type="date"
          defaultValue={
            defaultValues?.dueDate
              ? defaultValues.dueDate.slice(0, 10)
              : ""
          }
          required
          className="text-sm"
        />
      </div>

      {/* Priority */}
      <div className="space-y-1.5">
        <Label htmlFor="priority" className="text-sm font-medium">
          Priority <span className="text-red-500">*</span>
        </Label>
        <select
          id="priority"
          name="priority"
          defaultValue={defaultValues?.priority ?? "MEDIUM"}
          required
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
      </div>

      {/* Success Metric */}
      <div className="space-y-1.5">
        <Label htmlFor="successMetric" className="text-sm font-medium">
          Success Metric <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="successMetric"
          name="successMetric"
          defaultValue={defaultValues?.successMetric ?? ""}
          required
          rows={2}
          placeholder="How will success be measured?"
          className="resize-none text-sm"
        />
      </div>

      {/* Status */}
      <div className="space-y-1.5">
        <Label htmlFor="status" className="text-sm font-medium">
          Status
        </Label>
        <select
          id="status"
          name="status"
          defaultValue={defaultValues?.status ?? "OPEN"}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {/* Completion Notes (optional) */}
      <div className="space-y-1.5">
        <Label htmlFor="completionNotes" className="text-sm font-medium">
          Completion Notes{" "}
          <span className="text-slate-400 font-normal">(optional)</span>
        </Label>
        <Textarea
          id="completionNotes"
          name="completionNotes"
          rows={2}
          placeholder="Notes on how this action was completed..."
          className="resize-none text-sm"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Action"}
        </Button>
      </div>
    </form>
  )
}

function AddActionDialog({
  id,
  type,
  users,
}: {
  id: string
  type: string
  users: User[]
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleCreate(formData: FormData) {
    formData.append("type", type)
    startTransition(async () => {
      await createCAPAAction(id, formData)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          + Add Action
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Add {type.replace("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
          </DialogTitle>
        </DialogHeader>
        <ActionForm
          investigationId={id}
          type={type}
          users={users}
          onSubmit={handleCreate}
          isPending={isPending}
        />
      </DialogContent>
    </Dialog>
  )
}

export function CAPAForm({ id, capaActions, users }: CAPAFormProps) {
  const [continueError, setContinueError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleContinue() {
    setContinueError(null)
    startTransition(async () => {
      const result = await advanceToCAPAStep(id)
      if (result && "error" in result) {
        setContinueError(result.error ?? "Unable to continue. Please check requirements.")
      }
    })
  }

  return (
    <StepShell
      stepNumber={10}
      title="CAPA Plan"
      description="Define corrective and preventive actions to address the root cause."
      investigationId={id}
    >
      <div className="space-y-6">
        <Tabs defaultValue="correction">
          <TabsList className="grid grid-cols-3 w-full">
            {TAB_TYPES.map((t) => (
              <TabsTrigger key={t.tab} value={t.tab}>
                {t.label}
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs font-medium">
                  {capaActions.filter((a) => a.type === t.type).length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {TAB_TYPES.map((t) => {
            const tabActions = capaActions.filter((a) => a.type === t.type)
            return (
              <TabsContent key={t.tab} value={t.tab} className="mt-4 space-y-3">
                {tabActions.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center">
                    <p className="text-sm text-slate-500">
                      No {t.label.toLowerCase()} actions yet.
                    </p>
                  </div>
                )}
                {tabActions.map((action) => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    id={id}
                    users={users}
                  />
                ))}
                <div className="flex justify-end pt-1">
                  <AddActionDialog id={id} type={t.type} users={users} />
                </div>
              </TabsContent>
            )
          })}
        </Tabs>

        {continueError && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">{continueError}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
          >
            Back
          </Button>
          <Button onClick={handleContinue} disabled={isPending}>
            {isPending ? "Checking..." : "Continue to Effectiveness \u2192"}
          </Button>
        </div>
      </div>
    </StepShell>
  )
}
