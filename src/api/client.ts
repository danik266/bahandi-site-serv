const configuredApiBase = import.meta.env.VITE_API_URL?.trim()
const remoteApiBase = 'http://46.101.134.38:4000/api'

function getApiBase() {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    if (!configuredApiBase) return '/api'

    try {
      const configuredUrl = new URL(configuredApiBase, window.location.origin)
      if (configuredUrl.protocol === 'http:') return '/api'
    } catch {
      return '/api'
    }
  }

  return configuredApiBase || remoteApiBase
}

export const API_BASE = getApiBase().replace(/\/+$/, '')

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const fetchOptions: RequestInit = {
    method: init?.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  }

  if (init?.body !== undefined) {
    fetchOptions.body = init.body
  }

  const response = await fetch(`${API_BASE}${path}`, fetchOptions)

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(payload?.error ?? `API error ${response.status}`)
  }

  return response.json() as Promise<T>
}
