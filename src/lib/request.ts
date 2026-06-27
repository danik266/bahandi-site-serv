import type { Lookups, WriteOffRequest } from '../types'

export function getRequestCost(request: WriteOffRequest, lookups: Lookups) {
  return request.quantity * lookups.product(request.productId).cost
}

export function buildBars(items: Array<{ label: string; value: number }>) {
  const max = Math.max(1, ...items.map((item) => item.value))
  return items
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((item) => ({ ...item, percent: Math.max(8, (item.value / max) * 100) }))
}

export function countDuplicateHashes(requests: WriteOffRequest[]) {
  return requests.filter((request, index, list) =>
    list.findIndex((item) => item.photoHash === request.photoHash) !== index,
  ).length
}
