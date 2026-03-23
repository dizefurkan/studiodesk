'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

interface AttendanceHistoryRecord {
  id: string
  session_date: string
  attendance_count: number
}

interface AttendanceDateSelectorProps {
  selectedDate: string
  onDateChange: (date: string) => void
  attendanceHistory?: AttendanceHistoryRecord[]
}

export function AttendanceDateSelector({ selectedDate, onDateChange, attendanceHistory = [] }: AttendanceDateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const popoverRef = useRef<HTMLDivElement>(null)

  // Format date display
  const formatDateDisplay = (date: string) => {
    const selected = new Date(date)
    const today = new Date(new Date().toISOString().split('T')[0])
    const diffTime = selected.getTime() - today.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

    const formattedDate = selected.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

    const dayName = selected.toLocaleString('tr-TR', { weekday: 'long' })

    // Today
    if (diffDays === 0) {
      return `Bugün (${formattedDate})`
    }

    // Tomorrow
    if (diffDays === 1) {
      return `Yarın (${formattedDate})`
    }

    // This week (2-6 days)
    if (diffDays > 1 && diffDays < 7) {
      return `${dayName} (${formattedDate})`
    }

    // Next week (7-13 days)
    if (diffDays >= 7 && diffDays < 14) {
      return `Haftaya ${dayName} (${formattedDate})`
    }

    // Farther dates
    return `${diffDays} gün sonra ${formattedDate} ${dayName}`
  }

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Generate calendar days for current month
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const attendanceDates = new Set(attendanceHistory.map((a) => a.session_date))

  const renderCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth)

    const days: (number | null)[] = []

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    const monthName = currentMonth.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })

    return (
      <div className="w-80 bg-white border border-[#E5E7EB] rounded-lg shadow-lg p-4">
        {/* Month header with navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(new Date(year, month - 1))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft size={18} />
          </button>
          <h3 className="font-semibold text-[#111827] capitalize">{monthName}</h3>
          <button
            onClick={() => setCurrentMonth(new Date(year, month + 1))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['P', 'S', 'Ç', 'P', 'C', 'C', 'P'].map((day, idx) => (
            <div key={`weekday-${idx}`} className="text-center text-xs font-semibold text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} />
            }

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const isSelected = selectedDate === dateStr
            const hasAttendance = attendanceDates.has(dateStr)
            const isToday = dateStr === new Date().toISOString().split('T')[0]

            return (
              <button
                key={day}
                onClick={() => {
                  onDateChange(dateStr)
                  setIsOpen(false)
                }}
                className={`h-8 text-xs font-medium rounded transition-colors ${
                  isSelected
                    ? 'bg-[#4F46E5] text-white'
                    : hasAttendance
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : isToday
                        ? 'border-2 border-[#4F46E5] text-[#4F46E5]'
                        : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="relative inline-block mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-[#4F46E5] rounded-lg hover:bg-blue-100 transition-colors group"
      >
        <Calendar className="text-[#4F46E5] group-hover:text-blue-700" size={18} />
        <span className="text-[#4F46E5] font-medium group-hover:text-blue-700">{formatDateDisplay(selectedDate)}</span>
      </button>

      {/* Date Picker Popover */}
      {isOpen && (
        <div ref={popoverRef} className="absolute top-full left-0 z-50 mt-2">
          {renderCalendar()}
        </div>
      )}
    </div>
  )
}
