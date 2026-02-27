import { z } from "zod"

export const rootCauseSchema = z.object({
  rootCauseStatement: z.string().min(10, "Root cause statement is required"),
  validationQ1: z.boolean(),
  validationQ2: z.boolean(),
  validationQ3: z.boolean(),
  warningAcknowledged: z.boolean().optional(),
})

export type RootCauseInput = z.infer<typeof rootCauseSchema>
