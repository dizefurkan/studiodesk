'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Building2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function BackofficeNav() {
  const t = useTranslations('backoffice')
  const pathname = usePathname()
  const locale = useLocale()
  const path = pathname.startsWith(`/${locale}/`) ? pathname.slice(locale.length + 1) : pathname

  const items = [
    { href: '/backoffice/stores', label: t('nav.stores'), icon: Building2 },
    { href: '/backoffice/accounts', label: t('nav.accounts'), icon: Users },
  ]

  return (
    <nav className="flex items-center gap-1">
      {items.map(({ href, label, icon: Icon }) => {
        const active = path === href || path.startsWith(href + '/')
        return (
          <Button
            key={href}
            asChild
            variant="ghost"
            size="sm"
            className={cn(active && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary')}
          >
            <Link href={href} aria-current={active ? 'page' : undefined}>
              <Icon />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          </Button>
        )
      })}
    </nav>
  )
}
