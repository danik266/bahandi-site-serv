import type { AiAnalysisResult, Product, Reason } from '../types'
import { API_BASE } from '../api/client'

export async function analyzePhoto(
  photoBase64: string,
  hint: string,
  products: Product[],
  reasons: Reason[],
): Promise<AiAnalysisResult> {
  const response = await fetch(`${API_BASE}/ai/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      photoBase64,
      hint,
      products: products.map((p) => ({ id: p.id, name: p.name, category: p.category })),
      reasons: reasons.map((r) => ({ id: r.id, name: r.name })),
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { error?: string }
    throw new Error(error.error ?? 'Ошибка AI анализа')
  }

  const data = await response.json() as {
    productId: string
    productName: string
    reasonId: string
    quantity: number
    damageType: string
    damageDiscoveredAt: string
    comment: string
    confidence: number
    signs: string[]
  }

  return {
    productId: data.productId,
    productName: data.productName,
    reasonId: data.reasonId,
    quantity: data.quantity,
    damageType: data.damageType,
    damageDiscoveredAt: data.damageDiscoveredAt,
    confidence: data.confidence,
    signs: data.signs,
    generatedComment: data.comment,
  }
}
