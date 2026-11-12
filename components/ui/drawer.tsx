'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: React.ReactNode
  side?: 'left' | 'right'
}

export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  side = 'right',
}: DrawerProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer Panel */}
      <div
        className={cn(
          'fixed top-0 z-50 h-full w-64 transform transition-transform duration-300 ease-in-out bg-white flex flex-col',
          side === 'left' ? 'left-0' : 'right-0',
          open
            ? side === 'left'
              ? 'translate-x-0'
              : 'translate-x-0'
            : side === 'left'
            ? '-translate-x-full'
            : 'translate-x-full',
          'md:hidden'
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between border-b border-border h-14 px-4 sm:px-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-foreground truncate">{title}</h2>
              {description && (
                <p className="text-xs text-muted-foreground truncate">{description}</p>
              )}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground/70 hover:bg-muted hover:text-muted-foreground transition-colors ml-2 shrink-0"
              aria-label="Close drawer"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 space-y-4">
          {children}
        </div>
      </div>
    </>
  )
}
