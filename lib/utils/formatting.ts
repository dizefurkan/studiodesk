// Constant i18n keys for days and months
const DAY_KEYS = [
  'dates.days.sunday',
  'dates.days.monday',
  'dates.days.tuesday',
  'dates.days.wednesday',
  'dates.days.thursday',
  'dates.days.friday',
  'dates.days.saturday',
] as const

const MONTH_KEYS = [
  'dates.months.january',
  'dates.months.february',
  'dates.months.march',
  'dates.months.april',
  'dates.months.may',
  'dates.months.june',
  'dates.months.july',
  'dates.months.august',
  'dates.months.september',
  'dates.months.october',
  'dates.months.november',
  'dates.months.december',
] as const

/**
 * Format date display with localized day and month names
 * @param dateString ISO date string (YYYY-MM-DD)
 * @param t Translation function from next-intl
 * @returns Formatted date string (e.g., "30 May 2025 Monday")
 */
export function formatDateDisplay(
  dateString: string,
  t: (key: string) => string
): string {
  const date = new Date(dateString + 'T00:00:00Z')
  const dayIndex = date.getUTCDay()
  const day = date.getUTCDate()
  const month = date.getUTCMonth()
  const year = date.getUTCFullYear()

  const dayNames = DAY_KEYS.map((key) => t(key))
  const monthNames = MONTH_KEYS.map((key) => t(key))

  return `${day} ${monthNames[month]} ${year} ${dayNames[dayIndex]}`
}
