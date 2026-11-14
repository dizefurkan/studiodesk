'use client'

import { useLocale } from 'next-intl'
import { enUS, tr } from 'date-fns/locale'

/** date-fns locale matching the current app locale (for `format(date, pattern, { locale })`). */
export function useDateFnsLocale() {
  return useLocale() === 'tr' ? tr : enUS
}
