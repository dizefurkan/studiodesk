import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { ClipboardCheck, Pencil } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { getCourse } from '@/lib/actions/courses.actions'
import { getCourseAttendanceHistory } from '@/lib/actions/course-attendance.actions'
import { getEntityHistory } from '@/lib/actions/history.actions'
import { getCourseLabelIds, getLabels } from '@/lib/actions/labels.actions'
import { LabelPicker } from '@/components/labels/LabelPicker'
import { weekdayNames } from '@/lib/i18n/dates'
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
  const DAYS = weekdayNames(await getLocale())
  const [historyResult, entityHistory, labelsResult, courseLabels] = await Promise.all([
    getCourseAttendanceHistory(course.id),
    getEntityHistory('course', id, 20),
    getLabels(),
    getCourseLabelIds(course.id),
  ])
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
          <CourseStudentsContainer courseId={course.id} danceTypeId={course.dance_type_id} labelIds={courseLabelIds} />
        </TabsContent>
        <TabsContent value="attendance" className="pt-2">
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
