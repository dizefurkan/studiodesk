import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Getting session to check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public routes
  const publicRoutes = ['/', '/login', '/register']
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register')

  // If user is not authenticated
  if (!user) {
    // Block dashboard access
    if (isDashboard) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Allow public pages
    if (publicRoutes.includes(request.nextUrl.pathname) || isAuthPage) {
      return supabaseResponse
    }
  }

  // If user is authenticated
  if (user) {
    // Redirect from login/register to dashboard
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Allow dashboard and other authenticated routes
    if (isDashboard || publicRoutes.includes(request.nextUrl.pathname)) {
      return supabaseResponse
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
