"use server"

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { generateText } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { checkAILimit, recordAIUsage } from "@/lib/ai-usage"
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit"

interface AIRecommendationInput {
  description: string
  department: string
  occurredAt: string
  detectionMethod: string
  detectionDetail: string
  containmentActions: string
  productAffected: boolean
  productDetails: string
  riskLevel: string
  totalScore: number
  who: string
  why: string
  howMuch: string
  whereDetail: string
  howDetail: string
  causeType?: string
  isRecurring?: boolean
  suspectedCauses?: string
  processChangeInvolved?: boolean
  processChangeDetail?: string
}

export async function getAIRecommendation(
  input: AIRecommendationInput
): Promise<{ recommendation: string; error?: string }> {
  const session = await auth()
  if (!session) redirect("/login")

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      recommendation: "",
      error: "AI recommendations are not configured. Please add an ANTHROPIC_API_KEY to your .env file.",
    }
  }

  const userId = session.user?.id
  if (!userId) redirect("/login")

  // Check AI usage limits
  const limit = await checkAILimit(userId)
  if (!limit.allowed) {
    return {
      recommendation: "",
      error: limit.reason ?? "AI usage limit reached.",
    }
  }

  const modelId = "claude-haiku-4-5-20251001"

  try {
    const result = await generateText({
      model: anthropic(modelId),
      system: `You are a pharmaceutical quality investigation expert specializing in root cause analysis methodology. You help investigators select the right analysis tools for their investigation.

Available tools:
1. **Five Whys Analysis** — Ask "Why?" repeatedly to trace cause-and-effect chains. Best for simple, linear problems.
2. **Fishbone / Ishikawa Diagram** — Map potential causes across 6 categories (Man, Machine, Method, Material, Measurement, Environment). Best for complex problems with multiple contributing factors.
3. **Is / Is Not Analysis** — Compare what the problem IS vs. IS NOT across dimensions (What, Where, When, Extent). Best for ambiguous problems needing scope clarification.
4. **Process Analysis Table** — Step-by-step process review comparing expected vs. actual outcomes. Best for process deviations and sequential workflow failures.

Respond in this exact format:

**RECOMMENDED TOOLS:** [comma-separated list of recommended tools]

**SUGGESTED ORDER:** [numbered list showing order to apply them]

**REASONING:** [2-3 sentences explaining why these tools were chosen based on the specific problem context]

**KEY AREAS TO INVESTIGATE:**
- [bullet point 1]
- [bullet point 2]
- [bullet point 3]

**CONFIDENCE:** [LOW / MEDIUM / HIGH — based on how much context was provided]`,
      prompt: buildPrompt(input),
      maxOutputTokens: 600,
    })

    // Record audit + usage (non-blocking)
    logAudit({
      userId,
      action: AUDIT_ACTIONS.AI_RECOMMENDATION,
      entityType: "ai",
      metadata: { model: modelId, inputTokens: result.usage?.inputTokens ?? 0, outputTokens: result.usage?.outputTokens ?? 0 },
    })
    void recordAIUsage(
      userId,
      "tool_recommendation",
      modelId,
      result.usage?.inputTokens ?? 0,
      result.usage?.outputTokens ?? 0
    )

    return { recommendation: result.text }
  } catch (err) {
    console.error("AI recommendation error:", err)
    return {
      recommendation: "",
      error: "Unable to generate recommendation. Please select tools manually.",
    }
  }
}

function buildPrompt(input: AIRecommendationInput): string {
  return `Analyze this pharmaceutical investigation and recommend which root cause analysis tools to use.

## Problem Definition (5W2H)
- **What:** ${input.description}
- **Where:** ${input.department}${input.whereDetail ? ` — ${input.whereDetail}` : ""}
- **When:** ${input.occurredAt}
- **Who:** ${input.who || "Not specified"}
- **Why (initial theory):** ${input.why || "Not specified"}
- **How detected:** ${input.detectionMethod}${input.detectionDetail ? ` — ${input.detectionDetail}` : ""}${input.howDetail ? ` — ${input.howDetail}` : ""}
- **How Much:** ${input.productAffected ? `Product affected. ${input.productDetails}` : "No product impact."}${input.howMuch ? ` ${input.howMuch}` : ""}

## Risk Assessment
- Risk Level: ${input.riskLevel} (Score: ${input.totalScore}/15)

## Containment Actions Taken
${input.containmentActions}

## Complexity Indicators
- Cause type: ${input.causeType || "Not assessed"}
- Recurring: ${input.isRecurring === undefined ? "Not assessed" : input.isRecurring ? "Yes — recurring pattern" : "No — one-time event"}
- Suspected causes: ${input.suspectedCauses || "Not assessed"}
- Process change involved: ${input.processChangeInvolved === undefined ? "Not assessed" : input.processChangeInvolved ? `Yes — ${input.processChangeDetail || "details not provided"}` : "No"}

Based on this information, which analysis tools should be used and in what order?`
}
