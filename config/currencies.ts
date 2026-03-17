// Currency configuration
export const DEFAULT_CURRENCY = 'TRY'
export const DEFAULT_LOCALE = 'tr-TR'

export const SUPPORTED_CURRENCIES = [
  { code: 'TRY', name: 'Turkish Lira (₺)', flag: '🇹🇷' },
  { code: 'USD', name: 'US Dollar ($)', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro (€)', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound (£)', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen (¥)', flag: '🇯🇵' },
  { code: 'BRL', name: 'Brazilian Real (R$)', flag: '🇧🇷' },
  { code: 'INR', name: 'Indian Rupee (₹)', flag: '🇮🇳' },
  { code: 'AUD', name: 'Australian Dollar ($)', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar ($)', flag: '🇨🇦' },
  { code: 'CHF', name: 'Swiss Franc (CHF)', flag: '🇨🇭' },
  { code: 'CNY', name: 'Chinese Yuan (¥)', flag: '🇨🇳' },
  { code: 'SEK', name: 'Swedish Krona (kr)', flag: '🇸🇪' },
  { code: 'NZD', name: 'New Zealand Dollar ($)', flag: '🇳🇿' },
] as const

// Mapping of currency codes to locale
export const CURRENCY_LOCALE_MAP = {
  TRY: 'tr-TR',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  JPY: 'ja-JP',
  BRL: 'pt-BR',
  INR: 'hi-IN',
  AUD: 'en-AU',
  CAD: 'en-CA',
  CHF: 'fr-CH',
  CNY: 'zh-CN',
  SEK: 'sv-SE',
  NZD: 'en-NZ',
} as const satisfies Record<string, string>
