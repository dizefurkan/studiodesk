/** Localised weekday names, index 0 = Sunday (matches courses.day_of_week). */
export function weekdayNames(locale: string, style: 'long' | 'short' = 'long'): string[] {
  const format = new Intl.DateTimeFormat(locale, { weekday: style, timeZone: 'UTC' })
  // 2023-01-01 was a Sunday
  return Array.from({ length: 7 }, (_, i) => format.format(new Date(Date.UTC(2023, 0, 1 + i))))
}

/** Localised month names, index 0 = January. */
export function monthNames(locale: string, style: 'long' | 'short' = 'short'): string[] {
  const format = new Intl.DateTimeFormat(locale, { month: style, timeZone: 'UTC' })
  return Array.from({ length: 12 }, (_, i) => format.format(new Date(Date.UTC(2023, i, 1))))
}
