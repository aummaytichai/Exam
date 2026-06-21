export type WeatherCondition = 'clear' | 'light_rain' | 'heavy_rain'

export interface ETAInput {
  distanceKm: number
  weather: WeatherCondition
  prepTimeMin: number
  timeOfDay: string
  trafficLevel: 'heavy' | 'moderate' | 'light'
}

export interface ETAResult {
  etaMinutes: number
  breakdown: { prepMin: number; travelMin: number; bufferMin: number }
  confidence: 'high' | 'medium' | 'low'
  guardrailApplied: boolean
  guardrailReason: string | null
  source: 'ai_mock' | 'rule_based_override'
}

const SPEEDS: Record<WeatherCondition, number> = { clear: 30, light_rain: 18, heavy_rain: 12 }

function physicalMinimum(input: ETAInput): number {
  const speed = SPEEDS[input.weather]
  const travelMin = (input.distanceKm / speed) * 60
  const bufferMin = Math.max(0, input.distanceKm - 5) * 5
  return Math.ceil(input.prepTimeMin + travelMin + bufferMin)
}

function mockAIResponse(input: ETAInput): number {
  const speed = SPEEDS[input.weather] * (input.trafficLevel === 'heavy' ? 0.7 : 1)
  const travelMin = (input.distanceKm / speed) * 60
  const bufferMin = Math.max(0, input.distanceKm - 5) * 3
  const rushBonus = input.timeOfDay.includes('rush') ? travelMin * 0.2 : 0
  return Math.ceil(input.prepTimeMin + travelMin + bufferMin + rushBonus)
}

export function predictETA(input: ETAInput): ETAResult {
  const physMin = physicalMinimum(input)
  const aiEta = mockAIResponse(input)

  const speed = SPEEDS[input.weather]
  const travelMin = (input.distanceKm / speed) * 60
  const bufferMin = Math.max(0, input.distanceKm - 5) * 5

  if (aiEta < physMin * 0.5) {
    return {
      etaMinutes: physMin,
      breakdown: { prepMin: input.prepTimeMin, travelMin: Math.ceil(travelMin), bufferMin: Math.ceil(bufferMin) },
      confidence: 'low',
      guardrailApplied: true,
      guardrailReason: `AI predicted ${aiEta}min — below physical minimum ${physMin}min. Override applied.`,
      source: 'rule_based_override',
    }
  }

  const clamped = Math.min(Math.max(aiEta, 5), 120)
  const wasClampd = clamped !== aiEta

  return {
    etaMinutes: clamped,
    breakdown: { prepMin: input.prepTimeMin, travelMin: Math.ceil(travelMin), bufferMin: Math.ceil(bufferMin) },
    confidence: input.distanceKm > 8 ? 'medium' : 'high',
    guardrailApplied: wasClampd,
    guardrailReason: wasClampd ? `Clamped from ${aiEta}min to ${clamped}min (range 5–120)` : null,
    source: 'ai_mock',
  }
}
