'use client'

import { useState, useRef, useEffect } from 'react'
import { BookOpen, Zap } from 'lucide-react'

interface StudentPopoverProps {
  type: 'courses' | 'credits'
  courses?: Array<{ id: string; name: string }>
  credits?: number
  packageDetails?: Array<{
    name: string
    danceType: string
    remaining: number
  }>
}

export function StudentPopover({ type, courses, credits, packageDetails }: StudentPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<'top' | 'bottom'>('top')
  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen || !triggerRef.current || !popoverRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const popoverRect = popoverRef.current.getBoundingClientRect()

    if (triggerRect.top - popoverRect.height < 0) {
      setPosition('bottom')
    } else {
      setPosition('top')
    }
  }, [isOpen])

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

        {isOpen && courses && courses.length > 0 && (
          <div
            ref={popoverRef}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
            className={`absolute left-0 z-50 bg-white border border-[#E5E7EB] rounded-lg shadow-lg p-3 w-48 ${
              position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
          >
            <h4 className="font-semibold text-sm text-[#111827] mb-2">
              Enrolled Courses
            </h4>
            <ul className="space-y-1">
              {courses.map((course) => (
                <li key={course.id} className="text-xs text-gray-600">
                  • {course.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative inline-block">
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

      {isOpen && (
        <div
          ref={popoverRef}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className={`absolute left-0 z-50 bg-white border border-[#E5E7EB] rounded-lg shadow-lg p-3 w-56 ${
            position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          <h4 className="font-semibold text-sm text-[#111827] mb-3">
            Credits by Dance Type
          </h4>
          {packageDetails && packageDetails.length > 0 ? (
            <div className="space-y-2">
              {packageDetails.map((pkg, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">{pkg.danceType}:</span>
                    <span className={`font-semibold ${
                      pkg.remaining === 0 ? 'text-red-600' : 'text-[#111827]'
                    }`}>
                      {pkg.remaining}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">credit{pkg.remaining !== 1 ? 's' : ''}</span>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-[#E5E7EB] text-sm font-semibold text-[#111827]">
                Total: {credits}
              </div>
            </div>
          ) : (
            <p className="text-sm text-red-600 font-medium">No credits</p>
          )}
        </div>
      )}
    </div>
  )
}
