import type { RiskLevel } from "@prisma/client"

export const RISK_QUESTIONS = [
  {
    id: "q1",
    text: "Does this impact product quality?",
    options: [
      { value: 1, label: "None" },
      { value: 2, label: "Minor" },
      { value: 3, label: "Major" },
    ],
  },
  {
    id: "q2",
    text: "Is there potential patient risk?",
    options: [
      { value: 1, label: "No" },
      { value: 2, label: "Possible" },
      { value: 3, label: "Yes" },
    ],
  },
  {
    id: "q3",
    text: "Is there regulatory compliance risk?",
    options: [
      { value: 1, label: "No" },
      { value: 2, label: "Possible" },
      { value: 3, label: "Yes" },
    ],
  },
  {
    id: "q4",
    text: "Is production stopped?",
    options: [
      { value: 1, label: "No" },
      { value: 2, label: "Partial" },
      { value: 3, label: "Full Stop" },
    ],
  },
  {
    id: "q5",
    text: "Has this occurred before?",
    options: [
      { value: 1, label: "First time" },
      { value: 2, label: "Occasional" },
      { value: 3, label: "Repeated" },
    ],
  },
] as const

export function calculateRiskLevel(scores: number[]): {
  totalScore: number
  riskLevel: RiskLevel
} {
  const totalScore = scores.reduce((sum, s) => sum + s, 0)
  const riskLevel: RiskLevel =
    totalScore <= 7 ? "LOW" : totalScore <= 11 ? "MEDIUM" : "HIGH"
  return { totalScore, riskLevel }
}

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  LOW: "bg-green-100 text-green-800 border-green-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
  HIGH: "bg-red-100 text-red-800 border-red-200",
}
