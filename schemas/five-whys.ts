import { z } from "zod"

export const whyEntrySchema = z.object({
  whyNumber: z.number().min(1).max(5),
  whyQuestion: z.string().min(5, "Please enter the why question"),
  answer: z.string().min(5, "Please provide an answer"),
  evidence: z.string().min(5, "Evidence is required for each why"),
})

export const fiveWhysSchema = z.object({
  whys: z.array(whyEntrySchema).length(5),
})

export type WhyEntry = z.infer<typeof whyEntrySchema>
export type FiveWhysInput = z.infer<typeof fiveWhysSchema>
