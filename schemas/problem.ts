import { z } from "zod"

export const problemDefinitionSchema = z.object({
  description: z.string().min(10, "Please describe what happened in detail"),
  department: z.string().min(1, "Department is required"),
  occurredAt: z.string().min(1, "Date and time of occurrence is required"),
  detectionMethod: z.enum(["DEVIATION", "OOS", "ALARM", "AUDIT", "COMPLAINT", "OTHER"]),
  detectionDetail: z.string().optional(),
  containmentActions: z.string().min(5, "Immediate containment actions are required"),
  productAffected: z.boolean(),
  productDetails: z.string().optional(),
})

export type ProblemDefinitionInput = z.infer<typeof problemDefinitionSchema>
