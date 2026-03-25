'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ExternalLink, ArrowRightLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface InstructorDropdownProps {
  instructor: {
    id: string
    first_name: string
    last_name: string
  }
  replacementInstructor?: {
    id: string
    first_name: string
    last_name: string
  }
  isOverridden: boolean
  onReplaceClick: () => void
  onClearOverride: () => void
}

export function InstructorDropdown({
  instructor,
  replacementInstructor,
  isOverridden,
  onReplaceClick,
  onClearOverride,
}: InstructorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Show replacement instructor if available, otherwise show original
  const displayInstructor = replacementInstructor || instructor

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#4F46E5] text-white text-sm font-medium hover:bg-[#4338CA] transition-colors"
      >
        <span>{displayInstructor.first_name} {displayInstructor.last_name}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-[#D1D5DB] rounded-lg shadow-lg z-40 min-w-max">
          <Link
            href={`/dashboard/instructors/${instructor.id}`}
            className="flex items-center gap-3 px-4 py-2 text-sm text-[#111827] hover:bg-gray-100 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <ExternalLink size={16} className="text-gray-600" />
            <span>Go to Instructor Detail</span>
          </Link>
          <button
            onClick={() => {
              onReplaceClick()
              setIsOpen(false)
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#111827] hover:bg-gray-100 transition-colors"
          >
            <ArrowRightLeft size={16} className="text-gray-600" />
            <span>Replace Instructor</span>
          </button>
          {isOverridden && (
            <button
              onClick={() => {
                onClearOverride()
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-[#E5E7EB]"
            >
              <Trash2 size={16} className="text-red-600" />
              <span>Clear Override</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
