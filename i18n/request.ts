import { getRequestConfig } from 'next-intl/server'
import { headers } from 'next/headers'
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '../lib/i18n/config'

console.log('[request.ts Init] Initialized with SUPPORTED_LOCALES:', SUPPORTED_LOCALES)

export default getRequestConfig(async ({ locale }) => {
  console.log('\n[getRequestConfig] ========== REQUEST CONFIG CALL ==========')
  console.log('[getRequestConfig] Received locale:', locale)
  console.log('[getRequestConfig] Type of locale:', typeof locale)
  console.log('[getRequestConfig] SUPPORTED_LOCALES:', SUPPORTED_LOCALES)
  
  // Validate locale
  let validLocale = locale
  
  // If locale is undefined, try to extract from request headers
  if (!locale) {
    console.log('[getRequestConfig] Locale is undefined, attempting to extract from request...')
    try {
      const headersList = await headers()
      
      // Try to get locale from various sources
      const referer = headersList.get('referer') || ''
      const xPathname = headersList.get('x-pathname') || ''
      
      console.log('[getRequestConfig] Referer:', referer)
      console.log('[getRequestConfig] x-pathname:', xPathname)
      
      // Parse URL to get pathname
      let pathname = ''
      if (xPathname) {
        pathname = xPathname
      } else if (referer) {
        try {
          const url = new URL(referer)
          pathname = url.pathname
        } catch (e) {
          console.log('[getRequestConfig] Failed to parse referer URL')
        }
      }
      
      console.log('[getRequestConfig] Extracted pathname:', pathname)
      
      // Extract locale from pathname (e.g., /tr/dashboard -> tr)
      if (pathname) {
        for (const supportedLocale of SUPPORTED_LOCALES) {
          if (pathname.startsWith(`/${supportedLocale}`)) {
            validLocale = supportedLocale
            console.log(`[getRequestConfig] ✓ Extracted locale from pathname: ${validLocale}`)
            break
          }
        }
      }
    } catch (error) {
      console.log('[getRequestConfig] Error extracting from headers:', error)
    }
  }
  
  // Final fallback
  if (!validLocale || !SUPPORTED_LOCALES.includes(validLocale as any)) {
    console.log(`[getRequestConfig] Using default locale: ${DEFAULT_LOCALE}`)
    validLocale = DEFAULT_LOCALE
  } else {
    console.log(`[getRequestConfig] Final locale: ${validLocale}`)
  }
  
  try {
    const messages = (await import(`../messages/${validLocale}.json`)).default
    console.log(`[getRequestConfig] ✓ Successfully loaded messages for: ${validLocale}`)
    console.log(`[getRequestConfig] Message keys: ${Object.keys(messages).length}`)
    
    return {
      messages,
      locale: validLocale,
      timeZone: 'UTC',
    }
  } catch (error) {
    console.error(`[getRequestConfig] ✗ Failed to load ${validLocale}:`, error)
    
    // Fallback
    try {
      console.log(`[getRequestConfig] Attempting fallback to ${DEFAULT_LOCALE}...`)
      const fallback = (await import(`../messages/${DEFAULT_LOCALE}.json`)).default
      console.log(`[getRequestConfig] ✓ Loaded fallback: ${DEFAULT_LOCALE}`)
      
      return {
        messages: fallback,
        locale: DEFAULT_LOCALE,
        timeZone: 'UTC',
      }
    } catch (err) {
      console.error('[getRequestConfig] ✗ CRITICAL - Even fallback failed:', err)
      throw err
    }
  }
})
