'use client'

import { useLocale } from 'next-intl'

/** A date (optionally with time) formatted for the current app locale, e.g. "14 Kas 2026". */
export function FormattedDate({
  value,
  withTime = false,
}: {
  value: string | number | Date
  withTime?: boolean
}) {
  const locale = useLocale()
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return (
    <>
      {new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        ...(withTime && { timeStyle: 'short' }),
      }).format(date)}
    </>
  )
}
