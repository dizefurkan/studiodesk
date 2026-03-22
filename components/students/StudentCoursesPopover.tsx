'use client'

import { useState } from 'react'
import { BookOpen, X } from 'lucide-react'

interface StudentCoursesPopoverProps {
  courseNames: string[]
  enrolledCount: number
}

export function StudentCoursesPopover({ courseNames, enrolledCount }: StudentCoursesPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity"
      >
        <BookOpen size={14} className="text-purple-500" />
        <span className="text-[#111827] font-semibold">{enrolledCount}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-[#E5E7EB] rounded-lg shadow-lg p-4 min-w-max z-50">
          <div className="flex items-center justify-between gap-4 mb-3">
            <h4 className="font-semibold text-[#111827]">Enrolled Courses</h4>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-2 text-sm">
            {courseNames && courseNames.length > 0 ? (
              courseNames.map((courseName, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[#111827]">
                  <BookOpen size={12} className="text-purple-500" />
                  <span>{courseName}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Not enrolled in any courses</p>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-[#E5E7EB] text-sm font-semibold">
            Total: {enrolledCount} course{enrolledCount !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
