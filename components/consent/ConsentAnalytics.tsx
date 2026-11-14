'use client'

import { usePathname } from 'next/navigation'
import { Analytics } from '@vercel/analytics/next'
import { useConsent } from './useConsent'

// Analytics runs only on the public site, never inside the product or backoffice.
const PRIVATE_SEGMENTS = ['/dashboard', '/backoffice', '/login', '/change-password', '/onboarding', '/no-access']

export function ConsentAnalytics() {
  const consent = useConsent()
  const pathname = usePathname() ?? ''
  const isPrivate = PRIVATE_SEGMENTS.some((p) => pathname.includes(p))
  if (isPrivate || !consent?.analytics) return null
  return <Analytics />
}
