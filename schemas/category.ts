import { z } from "zod"

export const problemCategorySchema = z.object({
  category: z.enum(["HUMAN", "PROCESS", "EQUIPMENT", "MATERIAL", "MEASUREMENT", "ENVIRONMENT"]),
  justification: z.string().min(10, "Please provide justification for this category selection"),
})

export type ProblemCategoryInput = z.infer<typeof problemCategorySchema>
