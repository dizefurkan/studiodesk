import { getCourses } from '@/lib/actions/courses.actions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Calendar, Clock, Users } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const monthStr = typeof params.month === 'string' ? params.month : new Date().toISOString().split('T')[0]
  const yearStr = typeof params.year === 'string' ? params.year : String(new Date().getFullYear())

  const coursesResult = await getCourses()
  const courses = coursesResult.data || []

  const year = parseInt(yearStr)
  const month = parseInt(monthStr.split('-')[1] || String(new Date().getMonth() + 1))

  // Generate calendar grid
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const daysInMonth = lastDay.getDate()
  const startDay = firstDay.getDay()

  const calendarDays = []
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i)
  }

  // Navigation
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">Calendar</h1>
          <p className="text-gray-600 mt-1">View your class schedule and sessions</p>
        </div>
      </div>

      {/* Month Navigation */}
      <Card className="border-[#E5E7EB] p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#111827]">
            {MONTHS[month - 1]} {year}
          </h2>
          <div className="flex gap-2">
            <Link
              href={`/dashboard/calendar?month=${String(prevMonth).padStart(2, '0')}&year=${prevYear}`}
            >
              <Button variant="outline" className="border-[#E5E7EB]">
                Previous
              </Button>
            </Link>
            <Link href="/dashboard/calendar">
              <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
                Today
              </Button>
            </Link>
            <Link
              href={`/dashboard/calendar?month=${String(nextMonth).padStart(2, '0')}&year=${nextYear}`}
            >
              <Button variant="outline" className="border-[#E5E7EB]">
                Next
              </Button>
            </Link>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {DAYS.map((day) => (
            <div key={day} className="text-center font-medium text-[#111827] py-2">
              {day.slice(0, 3)}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border-2 min-h-[120px] ${
                day === null
                  ? 'bg-gray-50 border-gray-100'
                  : 'border-[#E5E7EB] bg-white hover:border-[#4F46E5] hover:bg-blue-50 transition-all'
              }`}
            >
              {day !== null && (
                <div>
                  <p className="font-bold text-[#111827] mb-2">{day}</p>
                  {/* Show courses for this day */}
                  {courses
                    .filter((course: any) => course.day_of_week === new Date(year, month - 1, day).getDay())
                    .map((course: any) => (
                      <div
                        key={course.id}
                        className="text-xs bg-[#4F46E5] bg-opacity-10 text-white p-1 rounded mb-1 truncate"
                        title={course.name}
                      >
                        {course.name}
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Upcoming Sessions */}
      <div>
        <h3 className="text-2xl font-bold text-[#111827] mb-4">Upcoming Classes</h3>
        {courses.length === 0 ? (
          <Card className="border-[#E5E7EB] p-12 text-center">
            <div className="text-gray-500">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">No courses scheduled</p>
              <p className="text-sm mt-1">Create courses to display them on the calendar</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {courses.slice(0, 5).map((course: any) => (
              <Card key={course.id} className="border-[#E5E7EB] p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Link href={`/dashboard/courses/${course.id}`}>
                      <h4 className="font-semibold text-[#111827] hover:text-[#4F46E5]">{course.name}</h4>
                    </Link>
                    <p className="text-sm text-gray-600 mt-1">{course.branches?.name}</p>
                    <div className="flex gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock size={14} />
                        {DAYS[course.day_of_week]} {course.start_time}
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users size={14} />
                        {course.capacity} max
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
