'use client'

import { useSyncExternalStore } from 'react'
import { getConsentSnapshot, getServerConsentSnapshot, subscribeConsent, type Consent } from '@/lib/consent'

/**
 * `undefined` while rendering on the server / before hydration,
 * `null` when the visitor hasn't chosen yet, otherwise their choice.
 */
export function useConsent(): Consent | null | undefined {
  const snapshot = useSyncExternalStore(subscribeConsent, getConsentSnapshot, getServerConsentSnapshot)
  if (snapshot === null) return undefined
  return snapshot ? (JSON.parse(snapshot) as Consent) : null
}
