import type { BootstrapPayload } from '../types'
import { requestJson } from './client'

export async function loadBootstrap(userId?: string) {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : ''
  return requestJson<BootstrapPayload>(`/bootstrap${query}`)
}
