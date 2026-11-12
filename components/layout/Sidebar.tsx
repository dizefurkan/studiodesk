'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useSidebar } from '@/lib/context/SidebarContext'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/brand/Logo'
import {
  Home,
  Users,
  UserCheck,
  MapPin,
  Music2,
  BookOpen,
  Calendar,
  ClipboardCheck,
  Package,
  DollarSign,
  TrendingUp,
  Settings,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Sidebar() {
  const t = useTranslations()
  const pathname = usePathname()
  const locale = useLocale()
  const { isOpen, toggleSidebar } = useSidebar()
  
  // Remove locale prefix from pathname for route matching
  // e.g., "/tr/dashboard/students" → "/dashboard/students"
  const pathWithoutLocale = pathname.startsWith(`/${locale}/`)
    ? pathname.slice(locale.length + 1)
    : pathname
  
  const menuItems = [
    {
      label: t('dashboard.title'),
      icon: Home,
      href: '/dashboard',
      category: false,
    },
    {
      label: t('dashboard.coreOperations'),
      category: true,
      items: [
        {
          label: t('dashboard.students'),
          icon: Users,
          href: '/dashboard/students',
        },
        {
          label: t('dashboard.courses'),
          icon: BookOpen,
          href: '/dashboard/courses',
        },
        {
          label: t('dashboard.attendance'),
          icon: ClipboardCheck,
          href: '/dashboard/attendance',
        },
        {
          label: t('dashboard.calendar'),
          icon: Calendar,
          href: '/dashboard/calendar',
        },
      ],
    },
    {
      label: t('dashboard.instructorManagement'),
      category: true,
      items: [
        {
          label: t('dashboard.instructors'),
          icon: UserCheck,
          href: '/dashboard/instructors',
        },
        {
          label: t('dashboard.instructorRates'),
          icon: DollarSign,
          href: '/dashboard/instructor-rates',
        },
        {
          label: t('dashboard.instructorEarnings'),
          icon: TrendingUp,
          href: '/dashboard/instructor-earnings',
        },
      ],
    },
    {
      label: t('dashboard.financial'),
      category: true,
      items: [
        {
          label: t('dashboard.packages'),
          icon: Package,
          href: '/dashboard/packages',
        },
        {
          label: t('dashboard.cashRegister'),
          icon: DollarSign,
          href: '/dashboard/cash-register',
        },
      ],
    },
    {
      label: t('dashboard.settings'),
      category: true,
      items: [
        {
          label: t('dashboard.branches'),
          icon: MapPin,
          href: '/dashboard/branches',
        },
        {
          label: t('dashboard.danceTypes'),
          icon: Music2,
          href: '/dashboard/dance-types',
        },
        {
          label: t('dashboard.settings'),
          icon: Settings,
          href: '/dashboard/settings',
        },
      ],
    },
  ]

  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({
    1: true,   // Core Operations
    2: false,  // Instructor Management
    3: false,  // Financial
    4: false,  // Settings
  })

  const handleNavClick = () => {
    // Close sidebar on mobile when user navigates
    if (isOpen && window.innerWidth < 768) {
      toggleSidebar()
    }
  }

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          'w-64 bg-background border-r border-border transition-transform duration-300 flex flex-col overflow-hidden transform',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          'fixed md:relative h-full z-40'
        )}
      >
        {/* Logo Section */}
        <div className="h-14 md:h-16 border-b border-border flex items-center px-3 md:px-6 gap-2 md:gap-3">
          <Logo />
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-2 md:px-3 py-4 md:py-6 space-y-2 md:space-y-3">
          {menuItems.map((item, idx) => {
            // Dashboard - single item
            if (!item.category) {
              const Icon = item.icon as any
            // Dashboard only active on exact path
              const isActive = pathWithoutLocale === item.href

              return (
                <Link
                  key={item.href || `item-${idx}`}
                  href={item.href || '/'}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium',
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                  onClick={handleNavClick}
                >
                  <Icon size={20} className="shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            }

            // Category with subitems
            const categoryIdx = idx
            const isExpanded = expandedCategories[categoryIdx]
            const toggleCategory = () => {
              setExpandedCategories((prev) => ({
                ...prev,
                [categoryIdx]: !prev[categoryIdx],
              }))
            }

            // Check if any subitem is active
            const hasActiveChild = item.items?.some(
              (subitem: any) => pathWithoutLocale === subitem.href || pathWithoutLocale.startsWith(subitem.href + '/')
            )

            return (
              <div key={item.label}>
                {/* Category Header */}
                <Button variant="ghost" className={cn('w-full justify-between px-4 py-2.5 h-auto font-semibold', hasActiveChild ? 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary' : 'text-foreground/80')}
                  onClick={toggleCategory}
                >
                  <span>{item.label}</span>
                  <ChevronDown
                    size={16}
                    className={cn('transition-transform', isExpanded ? 'rotate-180' : '')}
                  />
                </Button>

                {/* Category Items */}
                {isExpanded && (
                  <div className="mt-1 ml-2 space-y-1 border-l border-border pl-3">
                    {item.items?.map((subitem: any) => {
                      const SubIcon = subitem.icon
                      const isSubActive =
                        pathWithoutLocale === subitem.href || pathWithoutLocale.startsWith(subitem.href + '/')

                      return (
                        <Link
                          key={subitem.href}
                          href={subitem.href}
                          className={cn(
                            'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm font-medium',
                            isSubActive
                              ? 'bg-primary text-white'
                              : 'text-muted-foreground hover:bg-muted'
                          )}
                          onClick={handleNavClick}
                        >
                          <SubIcon size={18} className="shrink-0" />
                          <span>{subitem.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-border p-2 md:p-4 space-y-2 md:space-y-3">
          <div className="px-3 md:px-4 py-2 md:py-3 bg-muted rounded-lg">
            <p className="text-xs font-semibold text-foreground mb-1">{t('dashboard.quickTip')}</p>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.keepInfoUpdated')}
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={toggleSidebar}
        />
      )}
    </>
  )
}
