import type { FormState } from '../types'

const PREFIX = 'bahandi_draft_'

type DraftPayload = { form: FormState; savedAt: string }

export function saveDraft(userId: string, form: FormState): void {
  try {
    // Don't persist large base64 data URLs — save only external/relative photo urls
    const toSave: FormState = {
      ...form,
      photoUrl: form.photoUrl.startsWith('data:') ? '' : form.photoUrl,
      photoName: form.photoUrl.startsWith('data:') ? '' : form.photoName,
      photoUrls: form.photoUrls?.filter((photoUrl) => !photoUrl.startsWith('data:')) ?? [],
      photoNames: form.photoUrls?.some((photoUrl) => photoUrl.startsWith('data:'))
        ? []
        : form.photoNames ?? [],
      photoHash: form.photoUrl.startsWith('data:') ? '' : form.photoHash,
    }
    const payload: DraftPayload = { form: toSave, savedAt: new Date().toISOString() }
    localStorage.setItem(PREFIX + userId, JSON.stringify(payload))
  } catch {
    // Storage might be full or disabled — silently ignore
  }
}

export function loadDraft(userId: string): FormState | null {
  try {
    const raw = localStorage.getItem(PREFIX + userId)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DraftPayload
    return parsed.form ?? null
  } catch {
    return null
  }
}

export function clearDraft(userId: string): void {
  try {
    localStorage.removeItem(PREFIX + userId)
  } catch {
    // ignore
  }
}
