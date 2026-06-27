import type { WriteOffRequest } from '../types'

export type ScoreTone = 'safe' | 'watch' | 'risk'

// Нормализуем fraud_score к шкале 0-100 (поддерживаем и 0-1, и 0-100).
export function getFraudScore(request: WriteOffRequest): number | null {
  const raw = request.fraud_score ?? request.fraudScore
  if (raw == null || Number.isNaN(raw)) return null
  return raw <= 1 ? Math.round(raw * 100) : Math.round(raw)
}

// Зелёный — безопасно, оранжевый — внимание, красный — риск.
export function getScoreTone(request: WriteOffRequest): ScoreTone | null {
  const score = getFraudScore(request)
  if (score == null) return null
  if (score >= 70) return 'risk'
  if (score >= 40) return 'watch'
  return 'safe'
}
