import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n/config'

// Create the base next-intl middleware
const intlMiddleware = createMiddleware({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
  localeDetection: true,
})

console.log('[Middleware] Initialized')

// Wrap to add pathname header for language detection fallback
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  console.log(`[Middleware] Processing: ${pathname}`)
  
  // Call the intl middleware
  const response = intlMiddleware(request)
  
  // Add pathname as header for getRequestConfig to read
  response.headers.set('x-pathname', pathname)
  console.log(`[Middleware] Added x-pathname header: ${pathname}`)
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
