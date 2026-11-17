import { getTranslations } from 'next-intl/server'
import { Plus } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { getOrganization } from '@/lib/auth/getOrganization'
import { getScheduleCourses, getScheduleRooms, getSessionsInRange } from '@/lib/actions/schedule.actions'
import { addDaysToDateString, parseDateOnly, toDateString, todayInTimeZone } from '@/lib/i18n/dates'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ScheduleCalendar } from '@/components/calendar/ScheduleCalendar'
import { CALENDAR_VIEWS, type CalendarView } from '@/components/calendar/lessons'

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const t = await getTranslations('calendar')
  const params = await searchParams
  const str = (k: string) => (typeof params[k] === 'string' ? (params[k] as string) : undefined)

  const organization = await getOrganization()
  const today = todayInTimeZone(organization?.timezone)
  const weekStartDay = organization?.week_start_day ?? 1
  const view: CalendarView = (CALENDAR_VIEWS as readonly string[]).includes(str('view') ?? '')
    ? (str('view') as CalendarView)
    : 'week'
  const dateParam = str('date')
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today

  // Sessions for everything the view can show (a whole month covers every view)
  const d = parseDateOnly(date)
  const monthStart = toDateString(new Date(d.getFullYear(), d.getMonth(), 1))
  const monthEnd = toDateString(new Date(d.getFullYear(), d.getMonth() + 1, 0))
  const from = addDaysToDateString(date, -7) < monthStart ? addDaysToDateString(date, -7) : monthStart
  const to = addDaysToDateString(date, 7) > monthEnd ? addDaysToDateString(date, 7) : monthEnd

  const [coursesResult, roomsResult, sessionsResult] = await Promise.all([
    getScheduleCourses(),
    getScheduleRooms(),
    getSessionsInRange(from, to),
  ])
  const courses = coursesResult.data ?? []
  const branches = roomsResult.data ?? []
  const branchParam = str('branch')
  const branchId = branchParam && branches.some((b) => b.id === branchParam) ? branchParam : null

  const createAction = (
    <Button asChild>
      <Link href="/dashboard/courses/new">
        <Plus /> {t('createCourse')}
      </Link>
    </Button>
  )

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />
      {courses.length === 0 ? (
        <EmptyState title={t('noCoursesScheduled')} description={t('createCoursesMessage')} action={createAction} />
      ) : (
        <ScheduleCalendar
          view={view}
          date={date}
          today={today}
          weekStartDay={weekStartDay}
          courses={courses}
          sessions={sessionsResult.data ?? []}
          branches={branches}
          branchId={branchId}
        />
      )}
    </div>
  )
}
