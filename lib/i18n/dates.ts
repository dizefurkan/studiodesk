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

/**
 * Parse a date-only string ("2026-11-14", e.g. course_sessions.session_date) as a local calendar day.
 * `new Date("2026-11-14")` is UTC midnight, which shows as 03:00 or the previous day in other zones.
 */
export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export type DayFormat = 'short' | 'medium' | 'long'

const DAY_FORMATS: Record<DayFormat, Intl.DateTimeFormatOptions> = {
  short: { weekday: 'short', day: 'numeric', month: 'short' }, // "Cum 13 Kas"
  medium: { day: 'numeric', month: 'short', year: 'numeric' }, // "13 Kas 2026"
  long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }, // "13 Kasım 2026 Cuma"
}

/** A calendar day in the app locale. */
export function formatDay(locale: string, date: Date, style: DayFormat = 'medium'): string {
  return new Intl.DateTimeFormat(locale, DAY_FORMATS[style]).format(date)
}

/**
 * "YYYY-MM-DD" for the date's local calendar day. Use instead of `toISOString().split('T')[0]`,
 * which returns the UTC day (the previous day for local midnight east of UTC, e.g. Istanbul).
 */
export function toDateString(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Today's "YYYY-MM-DD" in an IANA time zone (the organization's), for server code. */
export function todayInTimeZone(timeZone?: string | null): string {
  try {
    // en-CA formats as YYYY-MM-DD
    return new Intl.DateTimeFormat('en-CA', { timeZone: timeZone || undefined }).format(new Date())
  } catch {
    return toDateString()
  }
}

/** "YYYY-MM-DD" shifted by whole days (calendar arithmetic, no time zone drift). */
export function addDaysToDateString(value: string, days: number): string {
  const d = parseDateOnly(value)
  d.setDate(d.getDate() + days)
  return toDateString(d)
}

/** The latest day on or before `onOrBefore` that falls on `dayOfWeek` (0 = Sunday). */
export function lastOccurrence(dayOfWeek: number, onOrBefore: string): string {
  const d = parseDateOnly(onOrBefore)
  return addDaysToDateString(onOrBefore, -((d.getDay() - dayOfWeek + 7) % 7))
}
