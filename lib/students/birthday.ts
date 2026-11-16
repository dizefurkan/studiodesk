/**
 * Birthday helpers (client-safe). Dates are 'YYYY-MM-DD' strings in the studio's time zone.
 * A 29 February birthday is celebrated on 28 February in non-leap years.
 */

function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/** The birthday's date in the given year. */
export function birthdayInYear(birthDate: string, year: number): string {
  const month = birthDate.slice(5, 7)
  let day = birthDate.slice(8, 10)
  if (month === '02' && day === '29' && !isLeapYear(year)) day = '28'
  return `${year}-${month}-${day}`
}

/** The next birthday on or after `today`. */
export function nextBirthday(birthDate: string, today: string): string {
  const year = Number(today.slice(0, 4))
  const thisYear = birthdayInYear(birthDate, year)
  return thisYear >= today ? thisYear : birthdayInYear(birthDate, year + 1)
}

function dayNumber(date: string) {
  return Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10))) / 86_400_000
}

/** Days until the next birthday: 0 = today. */
export function daysUntilBirthday(birthDate: string, today: string): number {
  return dayNumber(nextBirthday(birthDate, today)) - dayNumber(today)
}

/** Age in whole years on `date`. */
export function ageOn(birthDate: string, date: string): number {
  const years = Number(date.slice(0, 4)) - Number(birthDate.slice(0, 4))
  return date.slice(5) >= birthDate.slice(5) ? years : years - 1
}

/** The age a student turns at their next birthday. */
export function turningAge(birthDate: string, today: string): number {
  return Number(nextBirthday(birthDate, today).slice(0, 4)) - Number(birthDate.slice(0, 4))
}
