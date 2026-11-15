'use client'

import { Link } from '@/i18n/navigation'
import { usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useSidebar } from '@/lib/context/SidebarContext'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/brand/Logo'
import {
  BookOpen,
  Calendar,
  ClipboardCheck,
  Home,
  MapPin,
  Music2,
  Package,
  Settings,
  UserCheck,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

type NavLink = {
  label: string
  icon: LucideIcon
  href: string
  /** Other routes that light up this item (sub-pages reached from it) */
  also?: string[]
}

/**
 * Flat navigation: the daily work first, studio setup below a small label.
 * No collapsible groups — every page is one tap away.
 */
export function Sidebar() {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const locale = useLocale()
  const { isOpen, toggleSidebar } = useSidebar()

  // "/tr/dashboard/students" → "/dashboard/students"
  const path = pathname.startsWith(`/${locale}/`) ? pathname.slice(locale.length + 1) : pathname

  const daily: NavLink[] = [
    { label: t('home'), icon: Home, href: '/dashboard' },
    { label: t('attendance'), icon: ClipboardCheck, href: '/dashboard/attendance' },
    { label: t('calendar'), icon: Calendar, href: '/dashboard/calendar' },
    { label: t('students'), icon: Users, href: '/dashboard/students' },
    { label: t('courses'), icon: BookOpen, href: '/dashboard/courses' },
    {
      label: t('instructors'),
      icon: UserCheck,
      href: '/dashboard/instructors',
      also: [
        '/dashboard/instructor-rates',
        '/dashboard/instructor-earnings',
        '/dashboard/instructor-payouts',
        '/dashboard/course-profitability',
      ],
    },
    { label: t('cashRegister'), icon: Wallet, href: '/dashboard/cash-register' },
  ]
  const setup: NavLink[] = [
    { label: t('packages'), icon: Package, href: '/dashboard/packages' },
    { label: t('branches'), icon: MapPin, href: '/dashboard/branches' },
    { label: t('danceTypes'), icon: Music2, href: '/dashboard/dance-types' },
    { label: t('settings'), icon: Settings, href: '/dashboard/settings', also: ['/dashboard/history'] },
  ]

  const matches = (href: string) =>
    href === '/dashboard' ? path === href : path === href || path.startsWith(href + '/')
  const isActive = (item: NavLink) => matches(item.href) || (item.also ?? []).some(matches)

  const closeOnMobile = () => {
    if (isOpen && window.innerWidth < 768) toggleSidebar()
  }

  const renderItem = (item: NavLink) => {
    const Icon = item.icon
    const active = isActive(item)
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={closeOnMobile}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <Icon className="size-[18px] shrink-0" />
        <span className="truncate">{item.label}</span>
      </Link>
    )
  }

  const content = (
    <>
      <div className="flex h-14 items-center border-b border-border px-4 md:h-16 md:px-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label={t('label')}>
        <div className="space-y-0.5">{daily.map(renderItem)}</div>
        <div className="space-y-0.5">
          <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">{t('setup')}</p>
          {setup.map(renderItem)}
        </div>
      </nav>
    </>
  )

  return (
    <>
      <aside className="hidden h-full w-64 flex-col overflow-hidden border-r border-border bg-background md:flex print:hidden">
        {content}
      </aside>
      <Sheet open={isOpen} onOpenChange={(open) => open !== isOpen && toggleSidebar()}>
        <SheetContent side="left" className="w-64 gap-0 p-0 md:hidden" showCloseButton={false}>
          <SheetTitle className="sr-only">{t('label')}</SheetTitle>
          <div className="flex h-full flex-col overflow-hidden">{content}</div>
        </SheetContent>
      </Sheet>
    </>
  )
}
