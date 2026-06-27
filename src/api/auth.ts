import type { Employee } from '../types'
import { requestJson } from './client'

export async function loginUser(userId: string, pinCode: string) {
  return requestJson<{ user: Employee; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ userId, pinCode }),
  })
}
