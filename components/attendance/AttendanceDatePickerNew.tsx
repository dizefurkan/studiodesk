"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { format, differenceInDays } from "date-fns"

import { cn } from "@/lib/utils/cn"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface AttendanceDatePickerProps {
  value?: string
  onDateChange?: (dateStr: string) => void
  markedDates?: string[]
  className?: string
  locale?: "tr-TR" | "en-US"
}

/**
 * Specialized date picker for attendance with Turkish date formatting
 * Includes support for marking dates with attendance history
 */
const AttendanceDatePicker = React.forwardRef<
  HTMLButtonElement,
  AttendanceDatePickerProps
>(
  (
    {
      value,
      onDateChange,
      markedDates = [],
      className,
      locale = "tr-TR",
    },
    ref
  ) => {
    const selectedDate = value ? new Date(value + "T00:00:00") : undefined

    // Format date display with Turkish labels (Bugün, Yarın, etc.)
    const formatDateDisplay = (dateStr: string) => {
      const selected = new Date(dateStr + "T00:00:00")
      const today = new Date(new Date().toISOString().split("T")[0])
      const diffDays = differenceInDays(selected, today)

      const formattedDate = selected.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })

      const dayName = selected.toLocaleString("tr-TR", { weekday: "long" })

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

      // Past or far future dates
      return `${Math.abs(diffDays)} gün ${diffDays < 0 ? "önce" : "sonra"} ${formattedDate}`
    }

    const handleSelectDate = (date: Date | undefined) => {
      if (date) {
        const dateStr = format(date, "yyyy-MM-dd")
        onDateChange?.(dateStr)
      }
    }

    const markedDatesSet = new Set(markedDates)

    const isDateDisabled = (date: Date) => {
      const dateStr = format(date, "yyyy-MM-dd")
      return markedDatesSet.has(dateStr)
    }

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-[#4F46E5] text-[#4F46E5] hover:bg-blue-100 transition-colors group",
              className
            )}
          >
            <CalendarIcon className="text-[#4F46E5] group-hover:text-blue-700" size={18} />
            <span className="font-medium group-hover:text-blue-700">
              {value ? formatDateDisplay(value) : "Pick a date"}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelectDate}
            disabled={isDateDisabled}
            markedDates={markedDatesSet}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    )
  }
)
AttendanceDatePicker.displayName = "AttendanceDatePicker"

export { AttendanceDatePicker }
