const configuredApiBase =
  import.meta.env.VITE_API_URL?.trim() || 'http://46.101.134.38:4000/api'

export const API_BASE = configuredApiBase.replace(/\/+$/, '')

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
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
