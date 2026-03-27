'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard,
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
  Menu,
  X,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const menuItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    category: false,
  },
  {
    label: 'Core Operations',
    category: true,
    items: [
      {
        label: 'Students',
        icon: Users,
        href: '/dashboard/students',
      },
      {
        label: 'Courses',
        icon: BookOpen,
        href: '/dashboard/courses',
      },
      {
        label: 'Attendance',
        icon: ClipboardCheck,
        href: '/dashboard/attendance',
      },
      {
        label: 'Calendar',
        icon: Calendar,
        href: '/dashboard/calendar',
      },
    ],
  },
  {
    label: 'Instructor Management',
    category: true,
    items: [
      {
        label: 'Instructors',
        icon: UserCheck,
        href: '/dashboard/instructors',
      },
      {
        label: 'Instructor Rates',
        icon: DollarSign,
        href: '/dashboard/instructor-rates',
      },
      {
        label: 'Instructor Earnings',
        icon: TrendingUp,
        href: '/dashboard/instructor-earnings',
      },
    ],
  },
  {
    label: 'Financial',
    category: true,
    items: [
      {
        label: 'Packages',
        icon: Package,
        href: '/dashboard/packages',
      },
      {
        label: 'Cash Register',
        icon: DollarSign,
        href: '/dashboard/cash-register',
      },
    ],
  },
  {
    label: 'Settings',
    category: true,
    items: [
      {
        label: 'Branches',
        icon: MapPin,
        href: '/dashboard/branches',
      },
      {
        label: 'Dance Types',
        icon: Music2,
        href: '/dashboard/dance-types',
      },
      {
        label: 'System Settings',
        icon: Settings,
        href: '/dashboard/settings',
      },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Core Operations': true,
    'Instructor Management': false,
    'Financial': false,
    'Settings': false,
  })

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="text-[#111827] h-10 w-10"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'bg-white border-r border-[#E5E7EB] transition-all duration-300 flex flex-col',
          isOpen ? 'w-64' : 'w-0 md:w-64',
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
              const isActive = pathname === item.href || pathname.startsWith((item.href || '') + '/')

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
                  onClick={() => setIsOpen(false)}
                >
                  <Icon size={20} className="shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            }

            // Category with subitems
            const isExpanded = expandedCategories[item.label]
            const toggleCategory = () => {
              setExpandedCategories((prev) => ({
                ...prev,
                [item.label]: !prev[item.label],
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
                          onClick={() => setIsOpen(false)}
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
            <p className="text-xs font-semibold text-[#111827] mb-1">Quick Tip</p>
            <p className="text-xs text-[#6B7280]">
              Keep your information up to date.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
