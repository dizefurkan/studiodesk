"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns"

import { cn } from "@/lib/utils/cn"
import { Button } from "@/components/ui/button"

export interface CalendarProps {
  mode?: "single" | "multiple" | "range"
  selected?: Date | Date[] | undefined
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  fromDate?: Date
  toDate?: Date
  showOutsideDays?: boolean
  className?: string
  classNames?: Partial<Record<string, string>>
  disabled_?: (date: Date) => boolean
  footer?: React.ReactNode
  markedDates?: Set<string>
  initialFocus?: boolean
}

function Calendar(
  props: CalendarProps & Omit<React.HTMLAttributes<HTMLDivElement>, keyof CalendarProps>
) {
  const {
    className,
    classNames,
    showOutsideDays = true,
    selected,
    onSelect,
    disabled,
    fromDate,
    toDate,
    markedDates = new Set(),
    initialFocus,
    // Spread remaining HTML attributes
    ...htmlProps
  } = props
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    (selected instanceof Date ? selected : new Date())
  )

  const firstDayOfMonth = startOfMonth(currentMonth)
  const lastDayOfMonth = endOfMonth(currentMonth)

  // Get calendar grid including previous/next month days
  const startDate = startOfWeek(firstDayOfMonth)
  const endDate = endOfWeek(lastDayOfMonth)

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  })

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const handleSelectDate = (date: Date) => {
    if (disabled?.(date)) return
    onSelect?.(date)
  }

  const isDateSelected = (date: Date) => {
    if (!selected) return false
    if (selected instanceof Date) return isSameDay(selected, date)
    if (Array.isArray(selected)) return selected.some((d) => isSameDay(d, date))
    return false
  }

  const isDateMarked = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return markedDates.has(dateStr)
  }

  const isDateToday = (date: Date) => isToday(date)

  return (
    <div className={cn("p-3", className)} {...htmlProps}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#111827]">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreviousMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-2 text-center">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-xs font-medium text-[#6B7280]"
          >
            {day[0]}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((date) => {
          const isCurrentMonth = isSameMonth(date, currentMonth)
          const isSelected = isDateSelected(date)
          const isDisabled = disabled?.(date)
          const isMarked = isDateMarked(date)
          const isCurrentDay = isDateToday(date)

          return (
            <button
              key={date.toString()}
              onClick={() => handleSelectDate(date)}
              disabled={isDisabled || !isCurrentMonth}
              className={cn(
                "h-8 w-8 rounded text-sm font-medium transition-colors",
                isCurrentMonth
                  ? isDisabled
                    ? "cursor-not-allowed text-[#D1D5DB]"
                    : "hover:bg-[#F3F4F6] cursor-pointer text-[#111827]"
                  : "text-[#D1D5DB]",
                isSelected && "bg-[#4F46E5] text-white hover:bg-[#4338CA]",
                isMarked && !isSelected && "bg-green-100 text-green-800 hover:bg-green-200",
                isCurrentDay && !isSelected && "border-2 border-[#4F46E5] text-[#4F46E5]"
              )}
            >
              {format(date, "d")}
            </button>
          )
        })}
      </div>
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
