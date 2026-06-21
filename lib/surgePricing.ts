export interface SurgeInput {
  activeRiders: number
  pendingOrders: number
  zoneId: string
  currentMultiplier: number
  baseDeliveryFee: number
}

export interface SurgeResult {
  surgeRatio: number
  aiRecommended: number
  finalMultiplier: number
  requiresConfirmation: boolean
  guardrailApplied: boolean
  guardrailReason: string | null
  feeAfterSurge: number
}

export const GUARDRAILS = {
  MAX_MULTIPLIER: 2.5,
  MAX_ABSOLUTE_FEE: 200,
  MIN_MULTIPLIER: 1.0,
  MAX_INCREASE_PER_STEP: 0.2,
  REQUIRE_CONFIRMATION_ABOVE: 1.5,
} as const

function mockAIMultiplier(surgeRatio: number): number {
  return Math.round((1 + (surgeRatio - 1) * 0.8) * 100) / 100
}

export function computeSurge(input: SurgeInput): SurgeResult {
  const surgeRatio = input.pendingOrders / (input.activeRiders || 1)
  const aiRecommended = mockAIMultiplier(surgeRatio)

  let safe = aiRecommended
  let guardrailReason: string | null = null

  if (safe > input.currentMultiplier + GUARDRAILS.MAX_INCREASE_PER_STEP) {
    safe = input.currentMultiplier + GUARDRAILS.MAX_INCREASE_PER_STEP
    guardrailReason = `Rate limit: max +${GUARDRAILS.MAX_INCREASE_PER_STEP * 100}% per step`
  }
  if (safe > GUARDRAILS.MAX_MULTIPLIER) {
    safe = GUARDRAILS.MAX_MULTIPLIER
    guardrailReason = `Legal cap: max ${GUARDRAILS.MAX_MULTIPLIER}x`
  }
  if (safe * input.baseDeliveryFee > GUARDRAILS.MAX_ABSOLUTE_FEE) {
    safe = GUARDRAILS.MAX_ABSOLUTE_FEE / input.baseDeliveryFee
    guardrailReason = `Absolute fee cap: max ฿${GUARDRAILS.MAX_ABSOLUTE_FEE}`
  }
  safe = Math.max(safe, GUARDRAILS.MIN_MULTIPLIER)
  safe = Math.round(safe * 100) / 100

  return {
    surgeRatio,
    aiRecommended,
    finalMultiplier: safe,
    requiresConfirmation: safe >= GUARDRAILS.REQUIRE_CONFIRMATION_ABOVE,
    guardrailApplied: Math.abs(safe - aiRecommended) > 0.01,
    guardrailReason,
    feeAfterSurge: Math.round(input.baseDeliveryFee * safe),
  }
}
