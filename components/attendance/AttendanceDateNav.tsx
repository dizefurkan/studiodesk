'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { addDays, isAfter, isToday, isYesterday, startOfToday } from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale'
import { useOrganizationPrefs } from '@/lib/context/OrganizationPrefsContext'
import { formatDay, parseDateOnly, toDateString } from '@/lib/i18n/dates'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface AttendanceDateNavProps {
  /** With a course: steps a week at a time (‹ previous lesson · next lesson ›). Without: a day at a time. */
  courseId?: string
  date: string
  /** Weekdays with lessons (0 = Sunday), shown in bold in the calendar */
  lessonDays: number[]
  /** Days that already have a taken sheet */
  takenDates?: string[]
}

/** ‹ previous · [date] · next › — changes the `date` search param of the attendance page. */
export function AttendanceDateNav({ courseId, date, lessonDays, takenDates = [] }: AttendanceDateNavProps) {
  const tx = useTranslations('attendanceSheet')
  const t = useTranslations('common')
  const locale = useLocale()
  const dateLocale = useDateFnsLocale()
  const { weekStartDay } = useOrganizationPrefs()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const current = parseDateOnly(date)
  const today = startOfToday()
  const taken = new Set(takenDates)

  const go = (d: Date) => {
    setOpen(false)
    router.replace(
      courseId
        ? `/dashboard/attendance?course=${courseId}&date=${toDateString(d)}`
        : `/dashboard/attendance?date=${toDateString(d)}`
    )
  }

  const label = formatDay(locale, current, 'long')
  const prefix = isToday(current) ? t('today') : isYesterday(current) ? t('yesterday') : null
  const step = courseId ? 7 : 1
  const next = addDays(current, step)

  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="icon" onClick={() => go(addDays(current, -step))} aria-label={courseId ? tx('previousLesson') : tx('previousDay')}>
        <ChevronLeft />
      </Button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="min-w-0 flex-1 justify-start sm:flex-none">
            <CalendarDays />
            <span className="truncate">{prefix ? `${prefix}, ${label}` : label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            locale={dateLocale}
            weekStartsOn={weekStartDay as 0 | 1 | 2 | 3 | 4 | 5 | 6}
            selected={current}
            defaultMonth={current}
            onSelect={(d) => d && go(d)}
            disabled={(d) => isAfter(d, today)}
            modifiers={{
              lesson: (d) => lessonDays.includes(d.getDay()),
              taken: (d) => taken.has(toDateString(d)),
            }}
            modifiersClassNames={{
              lesson: '[&>button]:font-semibold [&>button]:text-foreground',
              taken: "[&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-1 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-green-600 [&>button]:relative",
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      <Button
        variant="outline"
        size="icon"
        onClick={() => go(next)}
        disabled={isAfter(next, today)}
        aria-label={courseId ? tx('nextLesson') : tx('nextDay')}
      >
        <ChevronRight />
      </Button>
    </div>
  )
}
