import type { BootstrapPayload, CreateRequestPayload, Employee, WriteOffRequest } from './types'

const configuredApiBase =
  import.meta.env.VITE_API_URL?.trim() || 'http://46.101.134.38:4000/api'
const API_BASE = configuredApiBase.replace(/\/+$/, '')

export async function loadBootstrap() {
  return requestJson<BootstrapPayload>('/bootstrap')
}

export async function loginUser(userId: string, pinCode: string) {
  return requestJson<{ user: Employee; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ userId, pinCode }),
  })
}

export async function createWriteOff(payload: CreateRequestPayload) {
  return requestJson<{ request: WriteOffRequest }>('/requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function approveWriteOff(requestId: string, reviewedById: string) {
  return requestJson<{ request: WriteOffRequest }>(`/requests/${requestId}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({ reviewedById }),
  })
}

export async function rejectWriteOff(
  requestId: string,
  reviewedById: string,
  rejectionReason: string,
) {
  return requestJson<{ request: WriteOffRequest }>(`/requests/${requestId}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reviewedById, rejectionReason }),
  })
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(payload?.error ?? `API error ${response.status}`)
  }

  return response.json() as Promise<T>
}
