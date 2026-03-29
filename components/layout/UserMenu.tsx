'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { logout } from '@/lib/actions/auth.actions'
import { Button } from '@/components/ui/button'
import { LogOut, Settings, User } from 'lucide-react'
import { ROLE_LABELS } from '@/lib/constants/roles'

interface UserMenuProps {
  userName: string
  userEmail: string
  userRole: string
  initials: string
}

export function UserMenu({ userName, userEmail, userRole, initials }: UserMenuProps) {
  const t = useTranslations()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setIsOpen(false)
    await logout()
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#F3F4F6] transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-[#4F46E5] flex items-center justify-center text-white text-xs font-semibold">
          {initials}
        </div>
        <div className="hidden md:block text-left text-sm">
          <p className="font-medium text-[#111827]">{userName}</p>
          <p className="text-xs text-[#9CA3AF]">{ROLE_LABELS[userRole] || userRole}</p>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-50">
          {/* User Info */}
          <div className="p-4 border-b border-[#E5E7EB]">
            <p className="font-semibold text-[#111827]">{userName}</p>
            <p className="text-xs text-[#6B7280]">{userEmail}</p>
            <p className="text-xs font-medium text-[#4F46E5] mt-2">
              {ROLE_LABELS[userRole] || userRole}
            </p>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#F3F4F6] text-sm text-[#111827] transition-colors">
              <User size={16} />
              <span>{t('auth.register')}</span>
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#F3F4F6] text-sm text-[#111827] transition-colors">
              <Settings size={16} />
              <span>{t('settings.general')}</span>
            </button>
          </div>

          {/* Logout Button */}
          <div className="p-2 border-t border-[#E5E7EB]">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-sm text-red-600 font-medium transition-colors"
            >
              <LogOut size={16} />
              <span>{t('auth.logout')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
