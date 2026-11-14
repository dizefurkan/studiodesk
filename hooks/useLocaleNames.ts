'use client'

import { useMemo } from 'react'
import { useLocale } from 'next-intl'
import { monthNames, weekdayNames } from '@/lib/i18n/dates'

/** Weekday (0 = Sunday) and month names in the current locale. */
export function useLocaleNames(style: { weekday?: 'long' | 'short'; month?: 'long' | 'short' } = {}) {
  const locale = useLocale()
  const weekday = style.weekday ?? 'long'
  const month = style.month ?? 'short'
  return useMemo(
    () => ({ DAYS: weekdayNames(locale, weekday), MONTHS: monthNames(locale, month), locale }),
    [locale, weekday, month]
  )
}
