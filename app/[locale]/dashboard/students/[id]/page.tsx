import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Mail, Pencil, Phone } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { getStudent, getStudentPackages } from '@/lib/actions/students.actions'
import { getPackages } from '@/lib/actions/packages.actions'
import { getOrganization } from '@/lib/auth/getOrganization'
import { getEntityHistory, getStudentAttendanceHistory, getStudentPackageHistory } from '@/lib/actions/history.actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DetailHeader } from '@/components/common/DetailHeader'
import { FormattedDate } from '@/components/common/FormattedDate'
import { StudentCredits } from '@/components/students/StudentCredits'
import { StudentPurchaseDialog } from '@/components/students/StudentPurchaseDialog'
import { StudentCoursesSection } from '@/components/students/StudentCoursesSection'
import { StudentHistory } from '@/components/students/StudentHistory'
import { ActivityTimelineWrapper } from '@/components/history/ActivityTimelineWrapper'

export default async function StudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const tx = await getTranslations('studentDetail')
  const td = await getTranslations('detailPages')
  const tt = await getTranslations('detailTabs')
  const { id } = await params
  const { purchase } = await searchParams
  const result = await getStudent(id)
  if (result.error || !result.data) notFound()

  const student = result.data
  const organization = await getOrganization()
  const currency = organization?.currency || 'TRY'

  const [packagesResult, availablePackagesResult, attendanceHistoryResult, packageHistoryResult, entityHistory] =
    await Promise.all([
      getStudentPackages(id),
      getPackages(),
      getStudentAttendanceHistory(id),
      getStudentPackageHistory(id),
      getEntityHistory('student', id, 20),
    ])

  const attendanceHistory = attendanceHistoryResult.data || []
  const packageHistory = packageHistoryResult.data || []

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <DetailHeader
        backHref="/dashboard/students"
        backLabel={tx('backToList')}
        title={`${student.first_name} ${student.last_name}`}
        meta={
          <span className="flex flex-wrap gap-x-4 gap-y-1">
            {student.email && (
              <a href={`mailto:${student.email}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
                <Mail className="size-3.5" /> {student.email}
              </a>
            )}
            {student.phone && (
              <a href={`tel:${student.phone}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
                <Phone className="size-3.5" /> {student.phone}
              </a>
            )}
          </span>
        }
        actions={
          <>
            <StudentPurchaseDialog
              studentId={id}
              packages={availablePackagesResult.data || []}
              currency={currency}
              defaultOpen={purchase === '1'}
            />
            <Button asChild variant="outline">
              <Link href={`/dashboard/students/${student.id}/edit`}>
                <Pencil /> {td('edit')}
              </Link>
            </Button>
          </>
        }
      />

      {/* What matters most at the desk: credits left */}
      <StudentCredits packages={packagesResult.data || []} />

      <Tabs defaultValue="courses">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto border-b border-border [&>button]:flex-none [&>button]:px-3">
          <TabsTrigger value="courses">{tt('courses')}</TabsTrigger>
          <TabsTrigger value="attendance">
            {tt('attendance')} <span className="text-muted-foreground">{attendanceHistory.length}</span>
          </TabsTrigger>
          <TabsTrigger value="purchases">
            {tt('purchases')} <span className="text-muted-foreground">{packageHistory.length}</span>
          </TabsTrigger>
          <TabsTrigger value="activity">{tt('activity')}</TabsTrigger>
          <TabsTrigger value="info">{tt('info')}</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="pt-2">
          <StudentCoursesSection studentId={id} />
        </TabsContent>
        <TabsContent value="attendance" className="pt-2">
          <StudentHistory view="attendance" attendanceHistory={attendanceHistory} packageHistory={packageHistory} />
        </TabsContent>
        <TabsContent value="purchases" className="pt-2">
          <StudentHistory view="credits" attendanceHistory={attendanceHistory} packageHistory={packageHistory} />
        </TabsContent>
        <TabsContent value="activity" className="pt-2">
          <ActivityTimelineWrapper
            entity="student"
            entityId={id}
            initialLogs={entityHistory || []}
            title={td('activityTimeline')}
            description={tx('timelineDescription')}
            showFullPage={false}
          />
        </TabsContent>
        <TabsContent value="info" className="pt-2">
          <Card className="gap-4 p-6">
            {student.notes && (
              <div>
                <p className="text-sm text-muted-foreground">{tx('notes')}</p>
                <p className="mt-1 whitespace-pre-wrap text-foreground">{student.notes}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{tx('joined')}</p>
                <p className="font-medium text-foreground">
                  <FormattedDate value={student.created_at} />
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{tx('updated')}</p>
                <p className="font-medium text-foreground">
                  <FormattedDate value={student.updated_at} />
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
