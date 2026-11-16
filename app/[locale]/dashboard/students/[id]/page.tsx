import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { ArrowLeft, Mail, Pencil, Phone } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { getStudent, getStudentPackages } from '@/lib/actions/students.actions'
import { getPackages } from '@/lib/actions/packages.actions'
import { getOrganization } from '@/lib/auth/getOrganization'
import { getEntityHistory, getStudentAttendanceHistory, getStudentPackageHistory } from '@/lib/actions/history.actions'
import { formatDay, parseDateOnly } from '@/lib/i18n/dates'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StudentCredits } from '@/components/students/StudentCredits'
import { StudentPurchaseDialog } from '@/components/students/StudentPurchaseDialog'
import { StudentStatusButton } from '@/components/students/StudentStatusButton'
import { StudentCoursesSection } from '@/components/students/StudentCoursesSection'
import { StudentHistory, type AttendanceHistoryItem, type PackageHistoryItem } from '@/components/students/StudentHistory'
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
  const ts = await getTranslations('studentStatus')
  const locale = await getLocale()
  const { id } = await params
  const { purchase } = await searchParams
  const result = await getStudent(id)
  if (result.error || !result.data) notFound()

  const student = result.data
  const organization = await getOrganization()
  const currency = organization?.currency || 'TRY'

  const [packagesResult, availablePackagesResult, attendanceResult, packageHistoryResult, entityHistory] =
    await Promise.all([
      getStudentPackages(id),
      getPackages(),
      getStudentAttendanceHistory(id),
      getStudentPackageHistory(id),
      getEntityHistory('student', id, 20),
    ])

  const attendance = (attendanceResult.data ?? []) as AttendanceHistoryItem[]
  const purchases = (packageHistoryResult.data ?? []) as PackageHistoryItem[]
  const present = attendance.filter((a) => a.is_present !== false)
  const lastLesson = present
    .map((a) => a.course_sessions?.session_date)
    .filter((d): d is string => !!d)
    .sort()
    .at(-1)
  const initials = `${student.first_name[0] ?? ''}${student.last_name[0] ?? ''}`.toLocaleUpperCase(locale)

  const purchaseDialog = (
    <StudentPurchaseDialog
      studentId={id}
      packages={availablePackagesResult.data || []}
      currency={currency}
      defaultOpen={purchase === '1'}
    />
  )

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link href="/dashboard/students" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {tx('backToList')}
      </Link>

      {/* Identity + actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-highlight font-display text-xl font-medium text-highlight-foreground">
            {initials}
          </span>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
                {student.first_name} {student.last_name}
              </h1>
              {!student.is_active && <Badge variant="outline">{ts('passive')}</Badge>}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {student.phone && (
                <a href={`tel:${student.phone}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
                  <Phone className="size-3.5" /> {student.phone}
                </a>
              )}
              {student.email && (
                <a href={`mailto:${student.email}`} className="inline-flex min-w-0 items-center gap-1.5 hover:text-foreground">
                  <Mail className="size-3.5 shrink-0" /> <span className="truncate">{student.email}</span>
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {purchaseDialog}
          <StudentStatusButton
            studentId={student.id}
            name={`${student.first_name} ${student.last_name}`}
            isActive={student.is_active}
          />
          <Button asChild variant="outline">
            <Link href={`/dashboard/students/${student.id}/edit`}>
              <Pencil /> {td('edit')}
            </Link>
          </Button>
        </div>
      </div>

      {!student.is_active && (
        <p className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          {ts('passiveNotice')}
          {student.status_changed_at && (
            <>
              {' '}
              {ts('passiveSince', { date: formatDay(locale, new Date(student.status_changed_at)) })}
            </>
          )}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_320px] xl:items-start">
        {/* Main: what happened */}
        <Tabs defaultValue="courses" className="min-w-0 xl:order-1">
          <TabsList variant="line" className="w-full justify-start overflow-x-auto border-b border-border [&>button]:flex-none [&>button]:px-3">
            <TabsTrigger value="courses">{tt('courses')}</TabsTrigger>
            <TabsTrigger value="attendance">
              {tt('attendance')} <span className="text-muted-foreground">{attendance.length}</span>
            </TabsTrigger>
            <TabsTrigger value="purchases">
              {tt('purchases')} <span className="text-muted-foreground">{purchases.length}</span>
            </TabsTrigger>
            <TabsTrigger value="activity">{tt('activity')}</TabsTrigger>
          </TabsList>
          <TabsContent value="courses" className="pt-3">
            <StudentCoursesSection studentId={id} />
          </TabsContent>
          <TabsContent value="attendance" className="pt-3">
            <StudentHistory view="attendance" attendanceHistory={attendance} packageHistory={purchases} />
          </TabsContent>
          <TabsContent value="purchases" className="pt-3">
            <StudentHistory view="credits" attendanceHistory={attendance} packageHistory={purchases} />
          </TabsContent>
          <TabsContent value="activity" className="pt-3">
            <ActivityTimelineWrapper
              entity="student"
              entityId={id}
              initialLogs={entityHistory || []}
              title={td('activityTimeline')}
              description={tx('timelineDescription')}
              showFullPage={false}
            />
          </TabsContent>
        </Tabs>

        {/* Side: what matters at the desk */}
        <aside className="order-first grid items-start gap-4 sm:grid-cols-2 xl:sticky xl:top-6 xl:order-2 xl:grid-cols-1">
          <StudentCredits
            packages={packagesResult.data || []}
            sellAction={
              <StudentPurchaseDialog studentId={id} packages={availablePackagesResult.data || []} currency={currency} />
            }
          />

          <Card className="gap-0 p-0">
            <dl className="grid grid-cols-2 divide-x divide-border">
              <div className="p-4">
                <dt className="text-xs text-muted-foreground">{tx('lessonsAttended')}</dt>
                <dd className="mt-1 font-display text-2xl font-medium tabular-nums">{present.length}</dd>
              </div>
              <div className="p-4">
                <dt className="text-xs text-muted-foreground">{tx('lastLesson')}</dt>
                <dd className="mt-1 text-sm font-medium">
                  {lastLesson ? formatDay(locale, parseDateOnly(lastLesson), 'medium') : '—'}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="gap-3 p-4">
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{tx('joined')}</span>
              <span>{formatDay(locale, new Date(student.created_at), 'medium')}</span>
            </div>
            {student.notes ? (
              <div className="border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">{tx('notes')}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{student.notes}</p>
              </div>
            ) : (
              <Link
                href={`/dashboard/students/${student.id}/edit`}
                className="border-t border-border pt-3 text-sm text-muted-foreground hover:text-foreground"
              >
                {tx('addNote')}
              </Link>
            )}
          </Card>
        </aside>
      </div>
    </div>
  )
}
