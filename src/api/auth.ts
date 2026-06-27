import type { Employee } from '../types'
import { requestJson } from './client'

export async function loginUser(login: string, passwordOrPin: string) {
  return requestJson<{ user: Employee; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      login,
      password: passwordOrPin,
      pinCode: passwordOrPin,
    }),
  })
}
