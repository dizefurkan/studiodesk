import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '../lib/i18n/config'

export default getRequestConfig(async ({ requestLocale }) => {
  // `requestLocale` is the [locale] segment matched by the proxy (next-intl v4 API)
  const requested = await requestLocale
  const locale = hasLocale(SUPPORTED_LOCALES, requested) ? requested : DEFAULT_LOCALE

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'UTC',
  }
})
