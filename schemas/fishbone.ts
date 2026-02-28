import { z } from "zod"

export const fishboneCauseSchema = z.object({
  category: z.enum(["MAN", "MACHINE", "METHOD", "MATERIAL", "MEASUREMENT", "ENVIRONMENT"]),
  cause: z.string().min(5, "Cause description must be at least 5 characters"),
  evidence: z.string().optional(),
})

export const fishboneFormSchema = z.object({
  causes: z.array(fishboneCauseSchema).min(1, "At least one cause is required"),
})

export type FishboneCauseInput = z.infer<typeof fishboneCauseSchema>
export type FishboneFormInput = z.infer<typeof fishboneFormSchema>
