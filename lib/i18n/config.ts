export const SUPPORTED_LOCALES = ['en', 'tr'] as const
export const DEFAULT_LOCALE = 'en' as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  tr: 'Türkçe',
}
