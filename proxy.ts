import createMiddleware from 'next-intl/middleware'
import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { routing } from '@/i18n/routing'

const intlMiddleware = createMiddleware(routing)

/**
 * 1. next-intl: locale prefix redirects/rewrites.
 * 2. Supabase: refresh the auth session and write the rotated cookies onto the response.
 *    Server Components can't set cookies, so without this step an expired access token
 *    is refreshed on every request but never persisted, and users get logged out.
 */
export async function proxy(request: NextRequest) {
  const response = intlMiddleware(request)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Validates the JWT and refreshes it when expired (no network call while it is still valid).
  await supabase.auth.getClaims()

  return response
}

export const config = {
  // Skip Next internals and any path with a file extension (icon.svg, apple-icon.png, /brand/*, …)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
