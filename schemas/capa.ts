import { z } from "zod"

export const capaActionSchema = z.object({
  type: z.enum(["CORRECTION", "CORRECTIVE_ACTION", "PREVENTIVE_ACTION"]),
  description: z.string().min(10, "Description is required"),
  ownerId: z.string().min(1, "Owner is required"),
  dueDate: z.string().min(1, "Due date is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  successMetric: z.string().min(5, "Success metric is required"),
  status: z.enum(["OPEN", "IN_PROGRESS", "COMPLETED"]).default("OPEN"),
  completionNotes: z.string().optional(),
})

export type CAPAActionInput = z.infer<typeof capaActionSchema>
