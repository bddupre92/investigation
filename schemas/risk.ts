import { z } from "zod"

export const riskAssessmentSchema = z.object({
  q1Score: z.number().min(1).max(3),
  q2Score: z.number().min(1).max(3),
  q3Score: z.number().min(1).max(3),
  q4Score: z.number().min(1).max(3),
  q5Score: z.number().min(1).max(3),
})

export type RiskAssessmentInput = z.infer<typeof riskAssessmentSchema>
