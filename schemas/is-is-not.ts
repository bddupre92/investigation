import { z } from "zod"

export const isIsNotEntrySchema = z.object({
  dimension: z.enum(["WHAT", "WHERE", "WHEN", "EXTENT"]),
  isDescription: z.string().min(5, "Is description is required"),
  isNotDescription: z.string().min(5, "Is Not description is required"),
  distinction: z.string().optional(),
})

export const isIsNotFormSchema = z.object({
  entries: z.array(isIsNotEntrySchema).min(1, "At least one entry is required"),
})

export type IsIsNotEntryInput = z.infer<typeof isIsNotEntrySchema>
export type IsIsNotFormInput = z.infer<typeof isIsNotFormSchema>
