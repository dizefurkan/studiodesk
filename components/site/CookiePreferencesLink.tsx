'use client'

import { openConsentPreferences } from '@/lib/consent'

export function CookiePreferencesLink({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={openConsentPreferences}
      className="text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      {label}
    </button>
  )
}
