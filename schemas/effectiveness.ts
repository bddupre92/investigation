import { z } from "zod"

export const effectivenessSetupSchema = z.object({
  monitoringPeriodDays: z.number().min(1, "Monitoring period must be at least 1 day"),
  verificationMethod: z.string().min(5, "Verification method is required"),
  successCriteria: z.string().min(5, "Success criteria is required"),
})

export const effectivenessResultSchema = z.object({
  result: z.enum(["EFFECTIVE", "NOT_EFFECTIVE"]),
  resultDetail: z.string().min(5, "Result detail is required"),
  reviewerName: z.string().min(2, "Reviewer name is required"),
  reviewerNotes: z.string().optional(),
})

export type EffectivenessSetupInput = z.infer<typeof effectivenessSetupSchema>
export type EffectivenessResultInput = z.infer<typeof effectivenessResultSchema>
