import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { ClipboardCheck, Pencil } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { getCourse } from '@/lib/actions/courses.actions'
import { getCourseAttendanceHistory, getCourseSummary } from '@/lib/actions/course-attendance.actions'
import { formatCurrency } from '@/lib/utils/format'
import { Card } from '@/components/ui/card'
import { getEntityHistory } from '@/lib/actions/history.actions'
import { getCourseLabelIds, getLabels } from '@/lib/actions/labels.actions'
import { LabelPicker } from '@/components/labels/LabelPicker'
import { formatDay, parseDateOnly, weekdayNames } from '@/lib/i18n/dates'
import { formatTime } from '@/lib/utils/formatTime'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DetailHeader } from '@/components/common/DetailHeader'
import { CourseStudentsContainer } from '@/components/courses/CourseStudentsContainer'
import { AttendanceHistorySection } from '@/components/courses/AttendanceHistorySection'
import { ActivityTimelineWrapper } from '@/components/history/ActivityTimelineWrapper'

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTranslations()
  const td = await getTranslations('detailPages')
  const tt = await getTranslations('detailTabs')
  const { id } = await params
  const result = await getCourse(id)
  if (result.error || !result.data) notFound()

  const course = result.data
  const locale = await getLocale()
  const DAYS = weekdayNames(locale)
  const [historyResult, entityHistory, labelsResult, courseLabels, summaryResult] = await Promise.all([
    getCourseAttendanceHistory(course.id),
    getEntityHistory('course', id, 20),
    getLabels(),
    getCourseLabelIds(course.id),
    getCourseSummary(course.id),
  ])
  const summary = summaryResult.data
  const tiles = summary
    ? [
        { label: t('courseSummary.lessons'), value: String(summary.lessons) },
        { label: t('courseSummary.attendance'), value: String(summary.present), hint: t('courseSummary.records', { count: summary.records }) },
        {
          label: t('courseSummary.rate'),
          value: summary.rate === null ? '–' : new Intl.NumberFormat(locale, { style: 'percent' }).format(summary.rate),
        },
        ...(summary.earnings !== null
          ? [{ label: t('courseSummary.earnings'), value: formatCurrency(summary.earnings, summary.currency) }]
          : []),
      ]
    : []
  const courseLabelIds = courseLabels.data ?? []
  const attendanceHistory = historyResult.data || []
  const instructors = (course.course_instructors ?? []).map((ci) => ci.instructors).filter((i) => !!i)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <DetailHeader
        backHref="/dashboard/courses"
        backLabel={t('common.backToCourses')}
        title={course.name}
        meta={
          <div className="space-y-1">
            <p>
              {[
                `${DAYS[course.day_of_week]} ${formatTime(course.start_time)}–${formatTime(course.end_time)}`,
                course.branches?.name,
                course.dance_types?.name,
                t('courses.createdOn', { date: formatDay(locale, new Date(course.created_at), 'medium') }),
                summary &&
                  t(summary.firstLesson.planned ? 'courses.firstLessonPlanned' : 'courses.firstLesson', {
                    date: formatDay(locale, parseDateOnly(summary.firstLesson.date), 'medium'),
                  }),
              ]
                .filter(Boolean)
                .join(' • ')}
            </p>
            {instructors.length > 0 && (
              <p className="flex flex-wrap gap-x-1">
                {instructors.map((i, idx) => (
                  <span key={i.id}>
                    <Link href={`/dashboard/instructors/${i.id}`} className="text-foreground hover:text-primary">
                      {i.first_name} {i.last_name}
                    </Link>
                    {idx < instructors.length - 1 && ','}
                  </span>
                ))}
              </p>
            )}
            <LabelPicker
              target="course"
              id={course.id}
              labels={(labelsResult.data ?? []).map((l) => ({ id: l.id, name: l.name }))}
              selectedIds={courseLabelIds}
            />
          </div>
        }
        actions={
          <>
            <Button asChild>
              <Link href={`/dashboard/attendance?course=${course.id}`}>
                <ClipboardCheck /> {t('attendanceSheet.take')}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/dashboard/courses/${course.id}/edit`}>
                <Pencil /> {td('edit')}
              </Link>
            </Button>
          </>
        }
      />

      <Tabs defaultValue="students">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto border-b border-border [&>button]:flex-none [&>button]:px-3">
          <TabsTrigger value="students">{tt('students')}</TabsTrigger>
          <TabsTrigger value="attendance">
            {tt('attendance')} <span className="text-muted-foreground">{attendanceHistory.length}</span>
          </TabsTrigger>
          <TabsTrigger value="activity">{tt('activity')}</TabsTrigger>
        </TabsList>
        <TabsContent value="students" className="pt-2">
          <CourseStudentsContainer
            courseId={course.id}
            courseName={course.name}
            danceTypeId={course.dance_type_id}
            labelIds={courseLabelIds}
          />
        </TabsContent>
        <TabsContent value="attendance" className="space-y-6 pt-2">
          {tiles.length > 0 && (
            <section aria-label={t('courseSummary.title')}>
              <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {tiles.map((tile) => (
                  <Card key={tile.label} className="gap-1 p-4">
                    <dt className="text-xs text-muted-foreground">{tile.label}</dt>
                    <dd className="font-display text-2xl font-medium tabular-nums">{tile.value}</dd>
                    {tile.hint && <dd className="text-xs text-muted-foreground">{tile.hint}</dd>}
                  </Card>
                ))}
              </dl>
            </section>
          )}
          <AttendanceHistorySection attendanceHistory={attendanceHistory} />
        </TabsContent>
        <TabsContent value="activity" className="pt-2">
          <ActivityTimelineWrapper
            entity="course"
            entityId={course.id}
            initialLogs={entityHistory || []}
            title={td('activityTimeline')}
            description={td('courseTimeline')}
            showFullPage={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
