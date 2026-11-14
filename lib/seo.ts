import type { Metadata } from 'next'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n/config'

/** Public origin of the marketing site, used for canonical URLs, hreflang, sitemap and JSON-LD. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://studiodesk.app').replace(/\/$/, '')

export const OG_LOCALE: Record<Locale, string> = { tr: 'tr_TR', en: 'en_US' }

/** Absolute URL for a locale and a path without the locale prefix ('' for the home page). */
export function absoluteUrl(locale: string, path = ''): string {
  return `${SITE_URL}/${locale}${path}`
}

/**
 * Canonical + hreflang alternates. `paths` maps each locale to its path (without the locale
 * prefix); a locale missing from the map has no translation and gets no hreflang entry.
 */
export function alternates(locale: string, paths: Partial<Record<Locale, string>>): Metadata['alternates'] {
  const languages: Record<string, string> = {}
  for (const l of SUPPORTED_LOCALES) {
    const p = paths[l]
    if (p !== undefined) languages[l] = absoluteUrl(l, p)
  }
  const fallback = paths[DEFAULT_LOCALE] !== undefined ? DEFAULT_LOCALE : (Object.keys(paths)[0] as Locale)
  languages['x-default'] = absoluteUrl(fallback, paths[fallback])
  return { canonical: absoluteUrl(locale, paths[locale as Locale] ?? ''), languages }
}

/** Same path in every locale (home, blog index, legal pages). */
export function samePathAlternates(locale: string, path = ''): Metadata['alternates'] {
  return alternates(locale, Object.fromEntries(SUPPORTED_LOCALES.map((l) => [l, path])))
}
