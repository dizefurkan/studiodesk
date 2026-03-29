'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { getCourses, generateCourseSessions, getCourseSessions } from '@/lib/actions/courses.actions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import Link from 'next/link'
import { Calendar, Clock, CheckCircle, Grid3x3, List, Users, Info } from 'lucide-react'
import { formatTime } from '@/lib/utils/formatTime'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const t = useTranslations()
  const monthStr = new Date().toISOString().split('T')[0]
  const yearStr = String(new Date().getFullYear())

  // Data fetching
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesResult = await getCourses()
        const coursesData = coursesResult.data || []
        setCourses(coursesData)

        // Auto-generate sessions
        const today = new Date()
        const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)

        try {
          for (const course of coursesData) {
            try {
              const sessionsResult = await getCourseSessions(
                course.id,
                today.toISOString().split('T')[0],
                twoWeeksFromNow.toISOString().split('T')[0],
              )
              const existingSessions = sessionsResult.data || []
              if (existingSessions.length === 0) {
                await generateCourseSessions(course.id, today, twoWeeksFromNow)
              }
            } catch (courseError) {
              console.error(`Error processing course ${course.id}:`, courseError)
            }
          }
        } catch (error) {
          console.error('Error in auto-generate sessions:', error)
        }
        setLoading(false)
      } catch (error) {
        console.error('Error fetching courses:', error)
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  // Helper: Get calendar days for month view
  const getCalendarDays = (m: number, y: number) => {
    const firstDay = new Date(y, m - 1, 1)
    const lastDay = new Date(y, m, 0)
    const daysInMonth = lastDay.getDate()
    const startDay = firstDay.getDay()

    const days = []
    for (let i = 0; i < startDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  // Helper: Get week days (Monday-Sunday)
  const getWeekDays = (date: Date) => {
    const curr = new Date(date)
    const first = curr.getDate() - curr.getDay()
    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(curr.setDate(first + i))
      weekDays.push(new Date(day))
    }
    return weekDays
  }

  // Helper: Get courses for specific day
  const getCoursesForDay = (dayOfWeek: number) => {
    return courses.filter((course: any) => course.day_of_week === dayOfWeek)
  }

  // Helper: Get courses for week
  const getWeekCourses = (weekDays: Date[]) => {
    const weekCourses: any[] = []
    weekDays.forEach((day) => {
      const dayOfWeek = day.getDay()
      const dayCoursesForDay = getCoursesForDay(dayOfWeek)
      dayCoursesForDay.forEach((course: any) => {
        weekCourses.push({
          ...course,
          date: day,
        })
      })
    })
    return weekCourses.sort((a: any, b: any) => {
      const timeA = parseInt(a.start_time.replace(':', ''))
      const timeB = parseInt(b.start_time.replace(':', ''))
      return timeA - timeB
    })
  }

  // Navigation handlers
  const goToPrevMonth = () => {
    if (month === 1) {
      setMonth(12)
      setYear(year - 1)
    } else {
      setMonth(month - 1)
    }
  }

  const goToNextMonth = () => {
    if (month === 12) {
      setMonth(1)
      setYear(year + 1)
    } else {
      setMonth(month + 1)
    }
  }

  const goToToday = () => {
    const today = new Date()
    setMonth(today.getMonth() + 1)
    setYear(today.getFullYear())
    setCurrentDate(today)
  }

  const goToPrevWeek = () => {
    const prev = new Date(currentDate)
    prev.setDate(prev.getDate() - 7)
    setCurrentDate(prev)
  }

  const goToNextWeek = () => {
    const next = new Date(currentDate)
    next.setDate(next.getDate() + 7)
    setCurrentDate(next)
  }

  // Get calendar data
  const calendarDays = getCalendarDays(month, year)
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year

  // Week view data
  const weekDays = getWeekDays(currentDate)
  const weekCourses = getWeekCourses(weekDays)

  // Render Month View
  const renderMonthView = () => (
    <div className="space-y-4">
      {/* Info banner for mobile */}
      <div className="md:hidden bg-blue-50 border border-[#4F46E5] border-opacity-30 rounded-lg p-3 flex gap-3">
        <Info size={20} className="text-[#4F46E5] shrink-0 mt-0.5" />
        <p className="text-sm text-[#374151]">
          {t('courses.selectDayViewClasses')}
        </p>
      </div>

      <Card className="border-[#E5E7EB] p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-[#111827]">
            {MONTHS[month - 1]} {year}
          </h2>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              className="border-[#E5E7EB] text-sm"
              onClick={goToPrevMonth}
            >
              Previous
            </Button>
            <Button
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm"
              onClick={goToToday}
            >
            Today
          </Button>
          <Button
            variant="outline"
            className="border-[#E5E7EB] text-sm"
            onClick={goToNextMonth}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 gap-1 md:gap-2 min-w-fit md:min-w-none">
          {/* Day headers */}
          {DAYS.map((day) => (
            <div key={day} className="text-center font-medium text-[#111827] py-2 text-xs md:text-sm">
              {day.slice(0, 3)}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, idx) => {
            const today = new Date()
            const isToday = day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear()
            const dayKey = day ? `${year}-${month}-${day}` : null
            const isExpanded = expandedDay === dayKey
            const dayOfWeek = day ? new Date(year, month - 1, day).getDay() : 0
            const dayCoursesForDay = day ? getCoursesForDay(dayOfWeek) : []
            const visibleCourses = isExpanded ? dayCoursesForDay : dayCoursesForDay.slice(0, 3)
            const remainingCount = dayCoursesForDay.length - 3

            return (
              <div
                key={idx}
                className={`p-2 md:p-4 rounded-lg border-2 min-h-20 md:min-h-30 flex flex-col relative ${
                  day === null
                    ? 'bg-gray-50 border-gray-100'
                    : isToday
                    ? 'border-[#4F46E5] bg-blue-50 hover:border-[#4338CA] hover:bg-blue-100 transition-all cursor-pointer'
                    : 'border-[#E5E7EB] bg-white hover:border-[#4F46E5] hover:bg-blue-50 transition-all cursor-pointer'
                }`}
              >
                {day !== null && (
                  <div className="h-full overflow-hidden flex flex-col">
                    <p className={`font-bold mb-1 text-sm md:text-base ${isToday ? 'text-[#4F46E5]' : 'text-[#111827]'}`}>{day}</p>

                    {/* Desktop View: Course names */}
                    <div className="hidden md:flex flex-col flex-1 space-y-1">
                      {visibleCourses.map((course: any) => (
                        <div
                          key={course.id}
                          className="text-xs bg-[#4F46E5] text-white p-1 rounded truncate hover:bg-[#4338CA] transition-all"
                          title={`${course.name} - ${formatTime(course.start_time)}`}
                        >
                          {course.name}
                        </div>
                      ))}
                    </div>

                    {/* Mobile View: Course count button with Popover */}
                    <div className="md:hidden flex-1 flex items-center justify-center">
                      {dayCoursesForDay.length > 0 ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              className="text-lg font-bold text-[#4F46E5] hover:text-[#4338CA] transition-colors"
                              title={`${dayCoursesForDay.length} class(es)`}
                            >
                              +{dayCoursesForDay.length}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-3">
                              <h4 className="font-bold text-[#111827] text-sm">{dayCoursesForDay.length} Classes on Day {day}</h4>
                              {dayCoursesForDay.map((course: any) => (
                                <div
                                  key={course.id}
                                  className="p-3 bg-white border border-[#E5E7EB] rounded-lg"
                                >
                                  <p className="font-semibold text-[#111827] text-sm">{course.name}</p>
                                  <div className="flex justify-between items-center mt-2 text-xs text-[#6B7280]">
                                    <span>
                                      {formatTime(course.start_time)} - {formatTime(course.end_time)}
                                    </span>
                                    {course.branches && (
                                      <span className="font-medium">{course.branches.name}</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <span className="text-xs text-[#D1D5DB]">—</span>
                      )}
                    </div>

                    {/* Desktop: Show more button */}
                    <div className="hidden md:block">
                      {remainingCount > 0 && !isExpanded && (
                        <button
                          onClick={() => setExpandedDay(dayKey)}
                          className="text-xs text-[#4F46E5] font-semibold mt-1 hover:text-[#4338CA] transition-colors"
                        >
                          +{remainingCount} more
                        </button>
                      )}
                      {isExpanded && remainingCount > 0 && (
                        <button
                          onClick={() => setExpandedDay(null)}
                          className="text-xs text-[#4F46E5] font-semibold mt-1 hover:text-[#4338CA] transition-colors"
                        >
                          Show less
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Card>
    </div>
  )

  // Render Week View
  const renderWeekView = () => {
    const weekStart = new Date(weekDays[0])
    const weekEnd = new Date(weekDays[6])

    return (
      <Card className="border-[#E5E7EB] p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-[#111827]">
            Week {weekStart.getDate()} - {weekEnd.getDate()} {MONTHS[weekEnd.getMonth()]} {weekEnd.getFullYear()}
          </h2>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              className="border-[#E5E7EB] text-sm"
              onClick={goToPrevWeek}
            >
              Previous
            </Button>
            <Button
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm"
              onClick={goToToday}
            >
              Today
            </Button>
            <Button
              variant="outline"
              className="border-[#E5E7EB] text-sm"
              onClick={goToNextWeek}
            >
              Next
            </Button>
          </div>
        </div>

        {/* Week Grid */}
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="grid grid-cols-7 gap-2 p-4 md:p-0" style={{ minWidth: '1000px' }}>
            {weekDays.map((day, idx) => {
              const dayCoursesCount = getCoursesForDay(day.getDay()).length

              return (
                <div
                  key={idx}
                  className="flex-1 min-w-0 border-2 border-[#E5E7EB] rounded-lg p-3 hover:border-[#4F46E5] transition-all"
                >
                  <div className="text-center mb-3">
                    <p className="text-xs md:text-sm font-medium text-[#6B7280]">
                      {DAYS[day.getDay()].slice(0, 3)}
                    </p>
                    <p className="text-lg md:text-xl font-bold text-[#111827]">{day.getDate()}</p>
                  </div>
                  <div className="space-y-2">
                    {getCoursesForDay(day.getDay()).map((course: any) => (
                      <Link
                        key={course.id}
                        href={`/dashboard/courses/${course.id}`}
                        className="block p-2 bg-[#4F46E5] text-white rounded text-xs hover:bg-[#4338CA] transition-all"
                      >
                        <p className="font-semibold truncate">{course.name}</p>
                        <p className="text-[11px] text-blue-100">{formatTime(course.start_time)}</p>
                      </Link>
                    ))}
                    {dayCoursesCount === 0 && (
                      <p className="text-xs text-[#D1D5DB] text-center py-2">No classes</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Card>
    )
  }

  // Render Agenda View
  const renderAgendaView = () => (
    <div className="space-y-4">
      {weekDays.map((day) => {
        const dayCoursesForDay = getCoursesForDay(day.getDay())
        const dayFormatted = new Intl.DateTimeFormat('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(day)

        return (
          <div key={day.toISOString()}>
            <h3 className="text-lg font-bold text-[#111827] mb-3">{dayFormatted}</h3>
            {dayCoursesForDay.length === 0 ? (
              <Card className="border-[#E5E7EB] p-4 text-center text-gray-500">
                <p className="text-sm">No classes scheduled</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {dayCoursesForDay
                  .sort((a: any, b: any) => {
                    const timeA = parseInt(a.start_time.replace(':', ''))
                    const timeB = parseInt(b.start_time.replace(':', ''))
                    return timeA - timeB
                  })
                  .map((course: any) => (
                    <Card key={course.id} className="border-[#E5E7EB] p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1 w-full md:w-auto">
                          <Link href={`/dashboard/courses/${course.id}`}>
                            <h4 className="font-semibold text-[#111827] hover:text-[#4F46E5] text-base md:text-lg">
                              {course.name}
                            </h4>
                          </Link>
                          <p className="text-sm text-gray-600 mt-1">{course.branches?.name}</p>
                          <div className="flex gap-4 mt-3 text-sm flex-wrap">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Clock size={14} />
                              {formatTime(course.start_time)} - {formatTime(course.end_time)}
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                              <Users size={14} />
                              {course.instructorCount || 0} instructor(s)
                            </div>
                          </div>
                        </div>
                        <Link href={`/dashboard/attendance?course=${course.id}`}>
                          <Button className="bg-green-600 hover:bg-green-700 text-white gap-2 shrink-0 w-full md:w-auto">
                            <CheckCircle size={16} />
                            Attendance
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#111827]">Calendar</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">View your class schedule and sessions</p>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={() => setViewMode('month')}
          className={`gap-2 text-sm ${
            viewMode === 'month'
              ? 'bg-[#4F46E5] text-white hover:bg-[#4338CA]'
              : 'border-[#E5E7EB] text-[#111827] hover:bg-gray-50'
          }`}
          variant={viewMode === 'month' ? 'default' : 'outline'}
        >
          <Grid3x3 size={16} />
          <span className="hidden sm:inline">Month</span>
        </Button>
        <Button
          onClick={() => setViewMode('week')}
          className={`gap-2 text-sm ${
            viewMode === 'week'
              ? 'bg-[#4F46E5] text-white hover:bg-[#4338CA]'
              : 'border-[#E5E7EB] text-[#111827] hover:bg-gray-50'
          }`}
          variant={viewMode === 'week' ? 'default' : 'outline'}
        >
          <Calendar size={16} />
          <span className="hidden sm:inline">Week</span>
        </Button>
        <Button
          onClick={() => setViewMode('agenda')}
          className={`gap-2 text-sm ${
            viewMode === 'agenda'
              ? 'bg-[#4F46E5] text-white hover:bg-[#4338CA]'
              : 'border-[#E5E7EB] text-[#111827] hover:bg-gray-50'
          }`}
          variant={viewMode === 'agenda' ? 'default' : 'outline'}
        >
          <List size={16} />
          <span className="hidden sm:inline">Agenda</span>
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <Card className="border-[#E5E7EB] p-12 text-center">
          <div className="text-gray-500">
            <Calendar size={48} className="mx-auto mb-4 opacity-50 animate-pulse" />
            <p className="text-lg">Loading calendar...</p>
          </div>
        </Card>
      )}

      {/* View Content */}
      {!loading && (
        <>
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'agenda' && renderAgendaView()}
        </>
      )}

      {/* Empty State */}
      {!loading && courses.length === 0 && (
        <Card className="border-[#E5E7EB] p-12 text-center">
          <div className="text-gray-500">
            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No courses scheduled</p>
            <p className="text-sm mt-1">Create courses to display them on the calendar</p>
          </div>
        </Card>
      )}
    </div>
  )
}

export default CalendarPage
