import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

/**
 * Locale-aware navigation. Use these instead of next/link and next/navigation's
 * useRouter/redirect: hrefs are written without the locale ("/dashboard/students")
 * and the current locale is added automatically.
 */
const navigation = createNavigation(routing)

export const { Link, usePathname, useRouter, getPathname } = navigation

/** Explicitly typed so TypeScript narrows after `if (!user) redirect(...)`. */
export const redirect: (args: Parameters<typeof navigation.redirect>[0]) => never =
  navigation.redirect
