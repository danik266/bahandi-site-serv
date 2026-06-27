import type { IikoMockDocument } from '../types'
import { requestJson } from './client'

export async function loadIikoMockDocuments() {
  return requestJson<{ documents: IikoMockDocument[]; serverTime: string }>(
    '/iiko/mock-documents',
  )
}
