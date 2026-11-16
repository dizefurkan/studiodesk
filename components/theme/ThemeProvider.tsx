'use client'

import { usePathname } from 'next/navigation'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { SUPPORTED_LOCALES } from '@/lib/i18n/config'

/**
 * The public site (landing, blog, legal) and the sign-in pages are designed for the light brand
 * look only; the theme choice applies to the app.
 */
const LIGHT_ONLY = new RegExp(`^(/(${SUPPORTED_LOCALES.join('|')}))?(/(blog|legal|login|register)(/.*)?)?/?$`)

/**
 * Light / dark / system theme for the app. The choice is stored in localStorage and applied as
 * the `.dark` class on <html> before paint, so there is no flash of the wrong theme.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      forcedTheme={LIGHT_ONLY.test(pathname) ? 'light' : undefined}
    >
      {children}
    </NextThemesProvider>
  )
}
