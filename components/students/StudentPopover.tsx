'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { BookOpen, Zap } from 'lucide-react'

interface StudentPopoverProps {
  type: 'courses' | 'credits'
  courses?: Array<{ id: string; name: string }>
  credits?: number
  packageDetails?: Array<{
    id: string
    name: string
    danceType: string
    danceTypeId: string
    remaining: number
  }>
  filteredDanceTypeId?: string
}

function PopoverContent({
  isOpen,
  triggerRef,
  title,
  children,
}: {
  isOpen: boolean
  triggerRef: React.RefObject<HTMLDivElement | null>
  title: string
  children: React.ReactNode
}) {
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return

    const updatePosition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        setPopoverPos({
          top: rect.bottom + 8 + window.scrollY,
          left: rect.left + window.scrollX,
        })
      }
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, triggerRef])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div
      className="fixed z-[9999] bg-white border border-[#E5E7EB] rounded-lg shadow-lg p-3 w-56"
      style={{
        top: `${popoverPos.top}px`,
        left: `${popoverPos.left}px`,
      }}
    >
      <h4 className="font-semibold text-sm text-[#111827] mb-3">{title}</h4>
      {children}
    </div>,
    document.body
  )
}

export function StudentPopover({ type, courses, credits, packageDetails, filteredDanceTypeId }: StudentPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)

  if (type === 'courses') {
    return (
      <div className="relative inline-block">
        <div
          ref={triggerRef}
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className="flex items-center gap-1 cursor-pointer hover:text-[#4F46E5]"
        >
          <BookOpen size={14} className="text-purple-500" />
          <span className="text-[#111827] font-semibold">
            {courses?.length || 0}
          </span>
        </div>

        <PopoverContent isOpen={!!(isOpen && courses && courses.length > 0)} triggerRef={triggerRef} title="Enrolled Courses">
          <ul className="space-y-1">
            {courses?.map((course) => (
              <li key={course.id} className="text-xs text-gray-600">
                • {course.name}
              </li>
            ))}
          </ul>
        </PopoverContent>
      </div>
    )
  }

  return (
    <div className="relative inline-block">
      {/* Get filtered dance type package if available */}
      {filteredDanceTypeId && packageDetails ? (
        <div className="flex items-start gap-2">
          {/* Directly show filtered dance type credits */}
          <div className="flex items-center gap-1">
            <Zap size={14} className="text-amber-500" />
            <span className="font-semibold text-[#111827]">
              {packageDetails.find(p => p.danceTypeId === filteredDanceTypeId)?.remaining || 0}
            </span>
            <span className="text-xs text-gray-500">
              {packageDetails.find(p => p.danceTypeId === filteredDanceTypeId)?.danceType}
            </span>
          </div>

          {/* Show popover only if multiple packages */}
          {packageDetails.length > 1 && (
            <div
              ref={triggerRef}
              onClick={() => setIsOpen(!isOpen)}
              onMouseEnter={() => setIsOpen(true)}
              onMouseLeave={() => setIsOpen(false)}
              className="text-[#4F46E5] cursor-pointer hover:underline text-xs font-semibold"
            >
              +{packageDetails.length - 1}
            </div>
          )}
        </div>
      ) : (
        <div
          ref={triggerRef}
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className={`flex items-center gap-1 cursor-pointer hover:text-[#4F46E5] ${
            (credits || 0) === 0 ? 'text-red-600' : 'text-[#111827]'
          }`}
        >
          <Zap size={14} className={credits === 0 ? 'text-red-500' : 'text-amber-500'} />
          <span className="font-semibold">{credits || 0}</span>
        </div>
      )}

      <PopoverContent
        isOpen={isOpen}
        triggerRef={triggerRef}
        title={filteredDanceTypeId ? 'Other Credits' : 'Credits by Dance Type'}
      >
        {packageDetails && packageDetails.length > 0 ? (
          <div className="space-y-2">
            {packageDetails
              .filter(pkg => !filteredDanceTypeId || pkg.danceTypeId !== filteredDanceTypeId)
              .map((pkg, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">{pkg.danceType}:</span>
                    <span
                      className={`font-semibold ${
                        pkg.remaining === 0 ? 'text-red-600' : 'text-[#111827]'
                      }`}
                    >
                      {pkg.remaining}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">credit{pkg.remaining !== 1 ? 's' : ''}</span>
                </div>
              ))}
            {!filteredDanceTypeId && (
              <div className="pt-2 mt-2 border-t border-[#E5E7EB] text-sm font-semibold text-[#111827]">
                Total: {credits}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-red-600 font-medium">No credits</p>
        )}
      </PopoverContent>
    </div>
  )
}
