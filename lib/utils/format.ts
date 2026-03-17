import { DEFAULT_CURRENCY, DEFAULT_LOCALE, CURRENCY_LOCALE_MAP } from '@/config/currencies'

export function formatCurrency(value: number | null | undefined, currency: string = DEFAULT_CURRENCY): string {
  if (value === null || value === undefined) return `0 ${currency}`
  
  const locale = CURRENCY_LOCALE_MAP[currency as keyof typeof CURRENCY_LOCALE_MAP] || DEFAULT_LOCALE
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(value)
}

export function getLocaleForCurrency(currency: string = DEFAULT_CURRENCY): string {
  return CURRENCY_LOCALE_MAP[currency as keyof typeof CURRENCY_LOCALE_MAP] || DEFAULT_LOCALE
}

export function formatNumber(value: number | null | undefined, currency: string = DEFAULT_CURRENCY): string {
  if (value === null || value === undefined) return '0'
  
  const locale = CURRENCY_LOCALE_MAP[currency as keyof typeof CURRENCY_LOCALE_MAP] || DEFAULT_LOCALE
  return new Intl.NumberFormat(locale).format(value)
}

export function formatPercentage(value: number | null | undefined, currency: string = DEFAULT_CURRENCY): string {
  if (value === null || value === undefined) return '0%'
  
  const locale = CURRENCY_LOCALE_MAP[currency as keyof typeof CURRENCY_LOCALE_MAP] || DEFAULT_LOCALE
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 2,
  }).format(value / 100)
}

export function formatCurrencyAmount(value: number | null | undefined, currency: string = DEFAULT_CURRENCY): string {
  if (value === null || value === undefined) return '0'
  
  const locale = CURRENCY_LOCALE_MAP[currency as keyof typeof CURRENCY_LOCALE_MAP] || DEFAULT_LOCALE
  
  // Get the formatted currency string and extract just the amount part
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(Math.abs(value))
  
  // Remove currency symbol and return just the amount
  return formatted.replace(/[^\d.,]/g, '')
}

export function getInitials(firstName: string, lastName?: string): string {
  const first = firstName.charAt(0).toUpperCase()
  const last = lastName?.charAt(0).toUpperCase() || ''
  return (first + last).slice(0, 2)
}

export function getFullName(firstName: string, lastName?: string): string {
  return `${firstName} ${lastName || ''}`.trim()
}
