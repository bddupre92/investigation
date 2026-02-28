import { prisma } from "@/lib/prisma"

// Anthropic pricing per million tokens (as of 2026)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5-20251001": { input: 0.8, output: 4.0 },
  "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
  "claude-opus-4-6": { input: 15.0, output: 75.0 },
}

function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model] ?? { input: 1.0, output: 5.0 }
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000
}

export async function checkAILimit(
  userId: string
): Promise<{ allowed: boolean; reason?: string; daily: number; monthly: number; dailyLimit: number; monthlyLimit: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { aiDailyLimit: true, aiMonthlyLimit: true },
  })

  if (!user) return { allowed: false, reason: "User not found.", daily: 0, monthly: 0, dailyLimit: 0, monthlyLimit: 0 }

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [dailyCount, monthlyCount] = await Promise.all([
    prisma.aIUsageRecord.count({
      where: { userId, createdAt: { gte: startOfDay } },
    }),
    prisma.aIUsageRecord.count({
      where: { userId, createdAt: { gte: startOfMonth } },
    }),
  ])

  if (dailyCount >= user.aiDailyLimit) {
    return {
      allowed: false,
      reason: `Daily AI limit reached (${user.aiDailyLimit} calls/day). Try again tomorrow.`,
      daily: dailyCount,
      monthly: monthlyCount,
      dailyLimit: user.aiDailyLimit,
      monthlyLimit: user.aiMonthlyLimit,
    }
  }

  if (monthlyCount >= user.aiMonthlyLimit) {
    return {
      allowed: false,
      reason: `Monthly AI limit reached (${user.aiMonthlyLimit} calls/month). Contact your administrator.`,
      daily: dailyCount,
      monthly: monthlyCount,
      dailyLimit: user.aiDailyLimit,
      monthlyLimit: user.aiMonthlyLimit,
    }
  }

  return {
    allowed: true,
    daily: dailyCount,
    monthly: monthlyCount,
    dailyLimit: user.aiDailyLimit,
    monthlyLimit: user.aiMonthlyLimit,
  }
}

export async function recordAIUsage(
  userId: string,
  action: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  await prisma.aIUsageRecord.create({
    data: {
      userId,
      action,
      model,
      inputTokens,
      outputTokens,
      estimatedCost: estimateCost(model, inputTokens, outputTokens),
    },
  })
}

export async function getUsageSummary(period: "day" | "month" | "all" = "month") {
  const now = new Date()
  let since: Date

  if (period === "day") {
    since = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  } else if (period === "month") {
    since = new Date(now.getFullYear(), now.getMonth(), 1)
  } else {
    since = new Date(0)
  }

  const records = await prisma.aIUsageRecord.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: since } },
    _count: { id: true },
    _sum: { inputTokens: true, outputTokens: true, estimatedCost: true },
  })

  const totals = await prisma.aIUsageRecord.aggregate({
    where: { createdAt: { gte: since } },
    _count: { id: true },
    _sum: { inputTokens: true, outputTokens: true, estimatedCost: true },
  })

  return { byUser: records, totals }
}
