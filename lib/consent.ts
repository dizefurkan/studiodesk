/**
 * Cookie consent, stored in localStorage for a year. Only "necessary" storage is used
 * without consent; analytics loads only after an explicit "yes".
 */
export const CONSENT_KEY = 'studiodesk-consent'
export const CONSENT_VERSION = 1
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000

export interface Consent {
  version: number
  analytics: boolean
  decidedAt: string
}

const CHANGE_EVENT = 'studiodesk:consent-change'
const OPEN_EVENT = 'studiodesk:open-consent'

export function readConsent(): Consent | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Consent
    if (parsed.version !== CONSENT_VERSION) return null
    if (Date.now() - new Date(parsed.decidedAt).getTime() > ONE_YEAR_MS) return null
    return parsed
  } catch {
    return null
  }
}

export function saveConsent(analytics: boolean) {
  const value: Consent = { version: CONSENT_VERSION, analytics, decidedAt: new Date().toISOString() }
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(value))
  } catch {
    // Storage blocked (private mode): the choice lasts for this page view only
  }
  cachedSnapshot = JSON.stringify(value)
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

/** Footer "Cookie preferences" link → reopens the preferences dialog. */
export function openConsentPreferences() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

export function onOpenConsentPreferences(cb: () => void) {
  window.addEventListener(OPEN_EVENT, cb)
  return () => window.removeEventListener(OPEN_EVENT, cb)
}

// --- useSyncExternalStore plumbing -------------------------------------------------
let cachedSnapshot: string | null | undefined

export function subscribeConsent(cb: () => void) {
  const onChange = () => {
    cachedSnapshot = undefined
    cb()
  }
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

/** JSON string of the current consent ("" = undecided). Stable between changes. */
export function getConsentSnapshot(): string {
  if (cachedSnapshot === undefined) {
    const c = readConsent()
    cachedSnapshot = c ? JSON.stringify(c) : ''
  }
  return cachedSnapshot ?? ''
}

/** On the server nothing is decided yet. */
export function getServerConsentSnapshot(): string | null {
  return null
}
