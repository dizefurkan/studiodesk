'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useSidebar } from '@/lib/context/SidebarContext'
import { cn } from '@/lib/utils/cn'
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

export function Sidebar() {
  const t = useTranslations()
  const pathname = usePathname()
  const { isOpen, toggleSidebar } = useSidebar()
  
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
          'w-64 bg-white border-r border-[#E5E7EB] transition-transform duration-300 flex flex-col overflow-hidden transform',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          'fixed md:relative h-full z-40'
        )}
      >
        {/* Logo Section */}
        <div className="h-14 md:h-16 border-b border-[#E5E7EB] flex items-center px-3 md:px-6 gap-2 md:gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base md:text-lg font-semibold text-[#111827] truncate">StudioDesk</h1>
            <p className="text-xs text-[#9CA3AF] truncate">Studio Management</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-2 md:px-3 py-4 md:py-6 space-y-2 md:space-y-3">
          {menuItems.map((item, idx) => {
            // Dashboard - single item
            if (!item.category) {
              const Icon = item.icon as any
              // Dashboard only active on exact path
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href || `item-${idx}`}
                  href={item.href || '/'}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium',
                    isActive
                      ? 'bg-[#4F46E5] text-white'
                      : 'text-[#6B7280] hover:bg-[#F3F4F6]'
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
              (subitem: any) => pathname === subitem.href || pathname.startsWith(subitem.href + '/')
            )

            return (
              <div key={item.label}>
                {/* Category Header */}
                <button
                  onClick={toggleCategory}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors text-sm font-semibold',
                    hasActiveChild
                      ? 'text-[#4F46E5] bg-blue-50'
                      : 'text-[#374151] hover:bg-[#F3F4F6]'
                  )}
                >
                  <span>{item.label}</span>
                  <ChevronDown
                    size={16}
                    className={cn('transition-transform', isExpanded ? 'rotate-180' : '')}
                  />
                </button>

                {/* Category Items */}
                {isExpanded && (
                  <div className="mt-1 ml-2 space-y-1 border-l border-[#E5E7EB] pl-3">
                    {item.items?.map((subitem: any) => {
                      const SubIcon = subitem.icon
                      const isSubActive =
                        pathname === subitem.href || pathname.startsWith(subitem.href + '/')

                      return (
                        <Link
                          key={subitem.href}
                          href={subitem.href}
                          className={cn(
                            'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm font-medium',
                            isSubActive
                              ? 'bg-[#4F46E5] text-white'
                              : 'text-[#6B7280] hover:bg-[#F3F4F6]'
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
        <div className="border-t border-[#E5E7EB] p-2 md:p-4 space-y-2 md:space-y-3">
          <div className="px-3 md:px-4 py-2 md:py-3 bg-[#F3F4F6] rounded-lg">
            <p className="text-xs font-semibold text-[#111827] mb-1">{t('dashboard.quickTip')}</p>
            <p className="text-xs text-[#6B7280]">
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
