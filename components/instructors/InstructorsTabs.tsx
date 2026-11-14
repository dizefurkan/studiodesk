'use client'

import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

/** Tabs that join the three instructor pages: list, pay rates, earnings. */
export function InstructorsTabs() {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const locale = useLocale()
  const path = pathname.startsWith(`/${locale}/`) ? pathname.slice(locale.length + 1) : pathname

  const tabs = [
    { href: '/dashboard/instructors', label: t('instructors') },
    { href: '/dashboard/instructor-rates', label: t('instructorRates') },
    { href: '/dashboard/instructor-earnings', label: t('instructorEarnings') },
  ]

  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto border-b border-border" aria-label={t('instructors')}>
      {tabs.map((tab) => {
        const active = path === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              '-mb-px shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
