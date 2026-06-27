import type { BootstrapPayload } from '../types'
import { requestJson } from './client'

export async function loadBootstrap() {
  return requestJson<BootstrapPayload>('/bootstrap')
}
