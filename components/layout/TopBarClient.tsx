'use client'

import { useSidebar } from '@/lib/context/SidebarContext'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'

interface TopBarClientProps {
  children: React.ReactNode
}

export function TopBarClient({ children }: TopBarClientProps) {
  const { isOpen, toggleSidebar } = useSidebar()

  return (
    <div className="flex items-center justify-between w-full h-full">
      {/* Mobile Hamburger - Left side */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-[#111827] h-8 w-8 hover:bg-[#F3F4F6]"
          title="Toggle sidebar"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Main Content */}
      {children}
    </div>
  )
}
