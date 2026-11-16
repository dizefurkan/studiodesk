import { SUPPORTED_LOCALES, type Locale } from '@/lib/i18n/config'
import type { Sector } from './types'
import { sectorsTr } from './tr'
import { sectorsEn } from './en'

const BY_LOCALE: Record<Locale, Sector[]> = { tr: sectorsTr, en: sectorsEn }

export function getSectors(locale: string): Sector[] {
  return BY_LOCALE[locale as Locale] ?? sectorsEn
}

export function getSector(locale: string, slug: string): Sector | undefined {
  return getSectors(locale).find((s) => s.slug === slug)
}

/** The slug of a sector in every language. */
export function sectorTranslations(key: string): Partial<Record<Locale, string>> {
  const out: Partial<Record<Locale, string>> = {}
  for (const l of SUPPORTED_LOCALES) {
    const s = BY_LOCALE[l].find((x) => x.key === key)
    if (s) out[l] = s.slug
  }
  return out
}

/** A slug from another language, e.g. after switching language on a sector page. */
export function findSectorAnyLocale(slug: string): Sector | undefined {
  for (const l of SUPPORTED_LOCALES) {
    const s = BY_LOCALE[l].find((x) => x.slug === slug)
    if (s) return s
  }
}

export function sectorParams(): { locale: Locale; slug: string }[] {
  return SUPPORTED_LOCALES.flatMap((locale) => BY_LOCALE[locale].map((s) => ({ locale, slug: s.slug })))
}

export type { Sector } from './types'
