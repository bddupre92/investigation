import { z } from "zod"

export const toolDecisionSchema = z.object({
  // Tool selection
  fiveWhys: z.boolean().default(true),
  fishbone: z.boolean().default(false),
  isIsNot: z.boolean().default(false),
  processAnalysis: z.boolean().default(false),
  notes: z.string().optional(),

  // 5W2H gap fields
  who: z.string().optional(),
  why: z.string().optional(),
  howMuch: z.string().optional(),
  whereDetail: z.string().optional(),
  howDetail: z.string().optional(),

  // Complexity assessment
  causeType: z.enum(["COMMON", "SPECIAL", "UNKNOWN"]).optional(),
  isRecurring: z.boolean().optional(),
  suspectedCauses: z.enum(["SINGLE", "MULTIPLE"]).optional(),
  processChangeInvolved: z.boolean().optional(),
  processChangeDetail: z.string().optional(),

  // AI recommendation
  aiRecommendation: z.string().optional(),
})

export type ToolDecisionInput = z.infer<typeof toolDecisionSchema>
