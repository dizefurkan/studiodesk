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
  },
  {
    label: 'Students',
    icon: Users,
    href: '/dashboard/students',
  },
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
    label: 'Courses',
    icon: BookOpen,
    href: '/dashboard/courses',
  },
  {
    label: 'Calendar',
    icon: Calendar,
    href: '/dashboard/calendar',
  },
  {
    label: 'Attendance',
    icon: ClipboardCheck,
    href: '/dashboard/attendance',
  },
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
  {
    label: 'Instructor Earnings',
    icon: TrendingUp,
    href: '/dashboard/instructor-earnings',
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/dashboard/settings',
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(true)

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="hidden md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="text-[#111827]"
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
        <div className="h-16 border-b border-[#E5E7EB] flex items-center px-6 gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-[#111827]">StudioDesk</h1>
            <p className="text-xs text-[#9CA3AF]">Studio Management</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link
                key={item.href}
                href={item.href}
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
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-[#E5E7EB] p-4 space-y-3">
          <div className="px-4 py-3 bg-[#F3F4F6] rounded-lg">
            <p className="text-xs font-semibold text-[#111827] mb-1">Quick Tip</p>
            <p className="text-xs text-[#6B7280]">
              Keep your student and instructor information up to date.
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
