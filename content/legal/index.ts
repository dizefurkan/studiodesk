import type { LegalDoc } from './types'
import { legalTr } from './tr'
import { legalEn } from './en'

export const LEGAL_SLUGS = ['kvkk', 'privacy', 'terms', 'cookies', 'distance-sales'] as const
export type LegalSlug = (typeof LEGAL_SLUGS)[number]

export function isLegalSlug(value: string): value is LegalSlug {
  return (LEGAL_SLUGS as readonly string[]).includes(value)
}

export function getLegalDoc(slug: LegalSlug, locale: string): LegalDoc {
  return (locale === 'tr' ? legalTr : legalEn)[slug]
}

export type { LegalDoc, LegalSection, LegalBlock } from './types'
