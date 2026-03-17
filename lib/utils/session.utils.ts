/**
 * Virtual Session Utilities
 * Generate sessions based on day_of_week without database queries
 */

export interface AttendanceConfig {
  week_start_day: number // 0 = Sunday, 1 = Monday, etc.
  timezone: string
  virtual_sessions_weeks: number
  attendance_per_week_limit: number
  allow_makeup_sessions: boolean
}

/**
 * Get the start of the week (e.g., Monday if week_start_day = 1)
 */
export function getWeekStart(date: Date, weekStartDay: number): Date {
  const current = new Date(date)
  const currentDay = current.getDay()
  const diff = currentDay - weekStartDay

  if (diff >= 0) {
    current.setDate(current.getDate() - diff)
  } else {
    current.setDate(current.getDate() - (7 + diff))
  }

  current.setHours(0, 0, 0, 0)
  return current
}

/**
 * Get the end of the week (e.g., Sunday if week_start_day = 1)
 */
export function getWeekEnd(date: Date, weekStartDay: number): Date {
  const start = getWeekStart(date, weekStartDay)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

/**
 * Check if two dates are in the same week
 */
export function isSameWeek(date1: Date, date2: Date, weekStartDay: number): boolean {
  const week1Start = getWeekStart(date1, weekStartDay)
  const week2Start = getWeekStart(date2, weekStartDay)
  return week1Start.getTime() === week2Start.getTime()
}

/**
 * Get the next occurrence of a specific day of week
 * @param fromDate - Start searching from this date
 * @param targetDayOfWeek - Day of week to find (0-6)
 * @param limit - Maximum search range in days (default: 365)
 */
export function getNextDayOfWeek(
  fromDate: Date,
  targetDayOfWeek: number,
  limit: number = 365,
): Date | null {
  const current = new Date(fromDate)
  const maxDate = new Date(fromDate)
  maxDate.setDate(maxDate.getDate() + limit)

  while (current <= maxDate) {
    if (current.getDay() === targetDayOfWeek) {
      return new Date(current)
    }
    current.setDate(current.getDate() + 1)
  }

  return null
}

/**
 * Generate virtual session dates for a course
 * (No database queries, pure calculation)
 */
export function generateVirtualSessions(
  dayOfWeek: number,
  startDate: Date,
  endDate: Date,
): string[] {
  const sessions: string[] = []
  const current = new Date(startDate)
  current.setHours(0, 0, 0, 0)

  while (current <= endDate) {
    if (current.getDay() === dayOfWeek) {
      sessions.push(current.toISOString().split('T')[0])
    }
    current.setDate(current.getDate() + 1)
  }

  return sessions
}

/**
 * Get this week's session date for a course
 * Returns the specific date when this course is scheduled this week
 */
export function getCurrentWeekSessionDate(
  dayOfWeek: number,
  today: Date,
  weekStartDay: number,
): string {
  const weekStart = getWeekStart(today, weekStartDay)
  const current = new Date(weekStart)

  while (current.getDay() !== dayOfWeek) {
    current.setDate(current.getDate() + 1)
  }

  return current.toISOString().split('T')[0]
}

/**
 * Format date string (YYYY-MM-DD) to readable format
 */
export function formatSessionDate(dateStr: string, locale: string = 'tr-TR'): string {
  const date = new Date(dateStr + 'T00:00:00Z')
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Get day name from day of week number
 */
export function getDayName(dayOfWeek: number, locale: string = 'tr-TR'): string {
  const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']
  return days[dayOfWeek >= 7 ? dayOfWeek - 7 : dayOfWeek]
}

/**
 * Get week number in month
 */
export function getWeekNumberInMonth(date: Date): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
  return Math.ceil((date.getDate() + firstDay.getDay()) / 7)
}
