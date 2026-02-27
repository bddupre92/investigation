import { z } from "zod"

export const whyNodeSchema = z.object({
  id: z.string(),
  parentId: z.string().nullable(),
  treeIndex: z.number().int().min(0),
  depth: z.number().int().min(1).max(10),
  whyQuestion: z.string().min(5, "Please enter the why question"),
  answer: z.string().min(5, "Please provide an answer"),
  evidence: z.string().min(5, "Evidence is required for each why"),
})

export const fiveWhysTreeSchema = z.object({
  nodes: z.array(whyNodeSchema).min(1, "At least one Why is required"),
})

export type WhyNode = z.infer<typeof whyNodeSchema>
export type FiveWhysTreeInput = z.infer<typeof fiveWhysTreeSchema>
