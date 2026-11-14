"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { format, differenceInDays } from "date-fns"
import { useLocale, useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
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
    },
    ref
  ) => {
    const tx = useTranslations("attendanceDatePicker")
    const locale = useLocale()
    const selectedDate = value ? new Date(value + "T00:00:00") : undefined

    // Relative label: today / tomorrow / weekday / next week / N days ago or ahead
    const formatDateDisplay = (dateStr: string) => {
      const selected = new Date(dateStr + "T00:00:00")
      const today = new Date(new Date().toISOString().split("T")[0])
      const diffDays = differenceInDays(selected, today)

      const formattedDate = selected.toLocaleDateString(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })

      const dayName = selected.toLocaleString(locale, { weekday: "long" })

      // Today
      if (diffDays === 0) {
        return tx("today", { date: formattedDate })
      }

      // Tomorrow
      if (diffDays === 1) {
        return tx("tomorrow", { date: formattedDate })
      }

      // This week (2-6 days)
      if (diffDays > 1 && diffDays < 7) {
        return tx("weekday", { day: dayName, date: formattedDate })
      }

      // Next week (7-13 days)
      if (diffDays >= 7 && diffDays < 14) {
        return tx("nextWeek", { day: dayName, date: formattedDate })
      }

      // Past or far future dates
      return diffDays < 0
        ? tx("daysAgo", { count: Math.abs(diffDays), date: formattedDate })
        : tx("daysAhead", { count: diffDays, date: formattedDate })
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
              "inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-primary text-primary hover:bg-blue-100 transition-colors group",
              className
            )}
          >
            <CalendarIcon className="text-primary group-hover:text-primary/90" size={18} />
            <span className="font-medium group-hover:text-primary/90">
              {value ? formatDateDisplay(value) : tx("pickDate")}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelectDate}
            disabled={isDateDisabled}
            modifiers={{ marked: (d: Date) => markedDatesSet.has(format(d, "yyyy-MM-dd")) }}
            modifiersClassNames={{ marked: "[&>button]:line-through [&>button]:text-muted-foreground" }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    )
  }
)
AttendanceDatePicker.displayName = "AttendanceDatePicker"

export { AttendanceDatePicker }
