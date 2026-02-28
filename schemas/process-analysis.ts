import { z } from "zod"

export const processAnalysisStepSchema = z.object({
  stepNumber: z.number().int().min(1),
  processStep: z.string().min(5, "Process step description is required"),
  expected: z.string().min(5, "Expected outcome is required"),
  actual: z.string().min(5, "Actual outcome is required"),
  deviation: z.boolean(),
  deviationDetail: z.string().optional(),
})

export const processAnalysisFormSchema = z.object({
  steps: z.array(processAnalysisStepSchema).min(1, "At least one process step is required"),
})

export type ProcessAnalysisStepInput = z.infer<typeof processAnalysisStepSchema>
export type ProcessAnalysisFormInput = z.infer<typeof processAnalysisFormSchema>
