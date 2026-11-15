import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { ChevronRight, FileText, Mail, Pencil, Phone } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { getInstructor } from '@/lib/actions/instructors.actions'
import {
  getInstructorCourses,
  getInstructorMonthlyStats,
  getInstructorTotalEarnings,
} from '@/lib/actions/instructor-detail.actions'
import { getEntityHistory } from '@/lib/actions/history.actions'
import { getOrganization } from '@/lib/auth/getOrganization'
import { canSeeInstructor, getPayAccess } from '@/lib/auth/payAccess'
import { formatTime } from '@/lib/utils/formatTime'
import { formatCurrency } from '@/lib/utils/format'
import { weekdayNames } from '@/lib/i18n/dates'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DetailHeader } from '@/components/common/DetailHeader'
import { InstructorAttendanceHistory } from '@/components/instructors/InstructorAttendanceHistory'
import { ActivityTimelineWrapper } from '@/components/history/ActivityTimelineWrapper'

export default async function InstructorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const tx = await getTranslations('instructorDetail')
  const td = await getTranslations('detailPages')
  const tt = await getTranslations('detailTabs')
  const DAYS = weekdayNames(await getLocale())
  const currency = (await getOrganization())?.currency || 'TRY'
  const { id } = await params
  const result = await getInstructor(id)
  if (result.error || !result.data) notFound()

  const instructor = result.data
  const [coursesResult, statsResult, totalEarningsResult, entityHistory] = await Promise.all([
    getInstructorCourses(id),
    getInstructorMonthlyStats(id),
    getInstructorTotalEarnings(id),
    getEntityHistory('instructor', id, 20),
  ])
  const courses = coursesResult.data || []
  const stats = statsResult.data
  const totalStats = totalEarningsResult.data

  const access = await getPayAccess()
  const canSeePay = !!access && canSeeInstructor(access, id)

  const tiles = [
    {
      pay: true,
      label: tx('monthEarnings'),
      value: formatCurrency(stats?.totalEarnings ?? 0, currency),
      hint: tx('sessionCount', { count: stats?.earningCount || 0 }),
    },
    {
      label: tx('monthSessions'),
      value: String(stats?.sessionCount || 0),
      hint: tx('studentsMarked', { count: stats?.attendanceCount || 0 }),
    },
    {
      pay: true,
      label: tx('totalEarnings'),
      value: formatCurrency(totalStats?.totalEarnings ?? 0, currency),
      hint: tx('classCount', { count: totalStats?.sessionCount || 0 }),
    },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <DetailHeader
        backHref="/dashboard/instructors"
        backLabel={tx('backToList')}
        title={`${instructor.first_name} ${instructor.last_name}`}
        meta={
          <span className="flex flex-wrap gap-x-4 gap-y-1">
            {instructor.email && (
              <a href={`mailto:${instructor.email}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
                <Mail className="size-3.5" /> {instructor.email}
              </a>
            )}
            {instructor.phone && (
              <a href={`tel:${instructor.phone}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
                <Phone className="size-3.5" /> {instructor.phone}
              </a>
            )}
          </span>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {canSeePay && (
              <Button asChild variant="outline">
                <Link href={`/dashboard/instructor-earnings/statement?instructor=${instructor.id}`}>
                  <FileText /> {tx('statement')}
                </Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href={`/dashboard/instructors/${instructor.id}/edit`}>
                <Pencil /> {td('edit')}
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {tiles.filter((tile) => canSeePay || !tile.pay).map((tile, i, shown) => (
          <Card key={tile.label} className={i === 2 && shown.length === 3 ? 'col-span-2 gap-1 p-4 md:col-span-1' : 'gap-1 p-4'}>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">{tile.label}</p>
            <p className="truncate text-xl font-bold tabular-nums sm:text-2xl">{tile.value}</p>
            <p className="truncate text-xs text-muted-foreground">{tile.hint}</p>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="courses">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto border-b border-border [&>button]:flex-none [&>button]:px-3">
          <TabsTrigger value="courses">
            {tt('courses')} <span className="text-muted-foreground">{courses.length}</span>
          </TabsTrigger>
          <TabsTrigger value="attendance">{tt('attendance')}</TabsTrigger>
          <TabsTrigger value="activity">{tt('activity')}</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="pt-2">
          {courses.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">{tx('noCourses')}</Card>
          ) : (
            <Card className="gap-0 divide-y divide-border p-0">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/dashboard/courses/${course.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{course.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[
                        `${DAYS[course.day_of_week]} ${formatTime(course.start_time)}–${formatTime(course.end_time)}`,
                        course.branches?.name,
                        course.dance_types?.name,
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </Card>
          )}
        </TabsContent>
        <TabsContent value="attendance" className="pt-2">
          <InstructorAttendanceHistory instructorId={id} showCourseInfo showInstructors />
        </TabsContent>
        <TabsContent value="activity" className="pt-2">
          <ActivityTimelineWrapper
            entity="instructor"
            entityId={id}
            initialLogs={entityHistory || []}
            title={td('activityTimeline')}
            description={tx('timelineDescription')}
            showFullPage={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
