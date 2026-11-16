import { getLocale, getTranslations } from 'next-intl/server'
import { ArrowRight, Check, ClipboardCheck, MessageCircle, UserPlus } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { getOrganization } from '@/lib/auth/getOrganization'
import { getCurrentUserProfile } from '@/lib/auth/getCurrentUser'
import { createAdminClient } from '@/lib/supabase/admin'
import { getScheduleCourses, getSessionsInRange } from '@/lib/actions/schedule.actions'
import { getHistoryLogs } from '@/lib/actions/history.actions'
import { addDaysToDateString, formatDay, lastOccurrence, parseDateOnly, todayInTimeZone } from '@/lib/i18n/dates'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LessonRow } from '@/components/attendance/LessonRow'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { HistoryComponent } from '@/components/history/HistoryComponent'

export default async function DashboardPage() {
  const t = await getTranslations()
  const tx = await getTranslations('home')
  const locale = await getLocale()
  const organization = await getOrganization()
  if (!organization) return null

  const currency = organization.currency || 'TRY'
  const today = todayInTimeZone(organization.timezone)
  const todayDate = parseDateOnly(today)
  const monthStart = today.slice(0, 8) + '01'
  const prevMonthStart = (() => {
    const d = new Date(todayDate.getFullYear(), todayDate.getMonth() - 1, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  })()
  const chartStart = (() => {
    const d = new Date(todayDate.getFullYear(), todayDate.getMonth() - 11, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  })()

  const admin = createAdminClient()
  const orgId = organization.id

  const [
    profile,
    { data: courses = [] },
    { data: sessions = [] },
    { count: studentCount },
    { data: income },
    { data: lowCredit },
    setup,
    recent,
  ] = await Promise.all([
    getCurrentUserProfile(),
    getScheduleCourses(),
    getSessionsInRange(addDaysToDateString(today, -6), today),
    admin
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .eq('is_active', true),
    admin
      .from('cash_transactions')
      .select('amount, created_at, branches!inner(organization_id)')
      .eq('branches.organization_id', orgId)
      .eq('type', 'income')
      .gte('created_at', chartStart),
    admin
      .from('student_packages')
      .select('id, remaining_credits, expire_date, students!inner(id, first_name, last_name, organization_id, deleted_at), packages(name)')
      .eq('students.organization_id', orgId)
      .is('students.deleted_at', null)
      .eq('students.is_active', true)
      .lte('remaining_credits', 1)
      .order('remaining_credits'),
    getSetupProgress(orgId),
    getHistoryLogs(5),
  ])

  // Lessons today and attendance still to take this week
  const todayDow = todayDate.getDay()
  const takenFor = (courseId: string, date: string) =>
    sessions.find((s) => s.course_id === courseId && s.session_date === date && s.attendanceCount > 0)
  const todays = courses
    .filter((c) => c.day_of_week === todayDow)
    .map((course) => ({ course, date: today, session: takenFor(course.id, today) }))
  const pendingThisWeek = courses.filter((c) => !takenFor(c.id, lastOccurrence(c.day_of_week, today))).length

  // Revenue: this month vs last month, and the last 12 months for the chart
  const months = Array.from({ length: 12 }, (_, i) => new Date(todayDate.getFullYear(), todayDate.getMonth() - 11 + i, 1))
  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const byMonth = new Map<string, number>()
  for (const row of income ?? []) {
    const key = row.created_at.slice(0, 7)
    byMonth.set(key, (byMonth.get(key) ?? 0) + (row.amount || 0))
  }
  const revenue = byMonth.get(monthStart.slice(0, 7)) ?? 0
  const lastMonthRevenue = byMonth.get(prevMonthStart.slice(0, 7)) ?? 0
  const change = lastMonthRevenue > 0 ? ((revenue - lastMonthRevenue) / lastMonthRevenue) * 100 : null
  const chartData = months.map((m) => ({
    name: new Intl.DateTimeFormat(locale, { month: 'short' }).format(m),
    revenue: byMonth.get(monthKey(m)) ?? 0,
  }))

  // Students whose last credit is about to run out (usable, not expired), one row per student
  const lowCreditStudents = new Map<string, { id: string; name: string; credits: number; pkg: string }>()
  for (const p of lowCredit ?? []) {
    if (p.expire_date && p.expire_date.slice(0, 10) < today) continue
    const s = p.students
    if (!s || lowCreditStudents.has(s.id)) continue
    lowCreditStudents.set(s.id, {
      id: s.id,
      name: `${s.first_name} ${s.last_name}`,
      credits: p.remaining_credits,
      pkg: p.packages?.name ?? '',
    })
  }
  const renewals = [...lowCreditStudents.values()].slice(0, 6)

  const firstName = profile?.full_name?.split(' ')[0]

  return (
    <div className="space-y-6">
      {/* Greeting + the two things people come here to do */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {firstName ? tx('greeting', { name: firstName }) : tx('greetingNoName')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{formatDay(locale, todayDate, 'long')}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button asChild>
            <Link href="/dashboard/attendance">
              <ClipboardCheck /> {tx('takeAttendance')}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/students/new">
              <UserPlus /> {tx('addStudent')}
            </Link>
          </Button>
        </div>
      </div>

      {setup.done < setup.steps.length && <SetupCard setup={setup} title={tx('setupTitle')} progressLabel={tx('setupProgress', { done: setup.done, total: setup.steps.length })} labels={{
        branches: tx('setup.branches'),
        danceTypes: tx('setup.danceTypes'),
        instructors: tx('setup.instructors'),
        rates: tx('setup.rates'),
        packages: tx('setup.packages'),
        courses: tx('setup.courses'),
      }} />}

      {/* Key numbers */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={tx('stats.students')} value={String(studentCount ?? 0)} href="/dashboard/students" />
        <Stat label={tx('stats.courses')} value={String(courses.length)} href="/dashboard/courses" />
        <Stat
          label={tx('stats.revenue')}
          value={formatCurrency(revenue, currency)}
          hint={
            change === null
              ? tx('stats.noLastMonth')
              : tx('stats.vsLastMonth', { change: `${change >= 0 ? '+' : ''}${change.toFixed(0)}%` })
          }
          hintTone={change === null ? undefined : change >= 0 ? 'up' : 'down'}
          href="/dashboard/cash-register"
        />
        <Stat
          label={tx('stats.pendingAttendance')}
          value={String(pendingThisWeek)}
          hint={tx('stats.thisWeek')}
          hintTone={pendingThisWeek > 0 ? 'warn' : undefined}
          href="/dashboard/attendance"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Today's lessons */}
        <Card className="gap-0 pb-0 lg:col-span-3">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle>{tx('todaysLessons')}</CardTitle>
            {todays.length > 0 && <CardDescription>{tx('lessonCount', { count: todays.length })}</CardDescription>}
            <CardAction>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/calendar">
                  {tx('calendar')} <ArrowRight />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          {todays.length === 0 ? (
            <CardContent className="py-8 text-center text-sm text-muted-foreground">{tx('noLessonsToday')}</CardContent>
          ) : (
            <div className="divide-y divide-border">
              {todays.map((r) => (
                <LessonRow
                  key={r.course.id}
                  {...r}
                  takeLabel={t('attendanceSheet.take')}
                  studentsLabel={t('attendanceSheet.studentCount', { count: r.course.studentCount })}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Credits running out → sell a package */}
        <Card className="gap-0 pb-0 lg:col-span-2">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle>{tx('renewals')}</CardTitle>
            <CardDescription>{tx('renewalsDescription')}</CardDescription>
            {renewals.length > 0 && (
              <CardAction>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/messages?audience=low_credits&category=payment_reminder">
                    <MessageCircle /> {tx('remind')}
                  </Link>
                </Button>
              </CardAction>
            )}
          </CardHeader>
          {renewals.length === 0 ? (
            <CardContent className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Check className="size-4 text-green-600" /> {tx('noRenewals')}
            </CardContent>
          ) : (
            <div className="divide-y divide-border">
              {renewals.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <Link href={`/dashboard/students/${s.id}`} className="block truncate text-sm font-medium hover:text-primary">
                      {s.name}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {[s.pkg, tx('creditsLeft', { count: s.credits })].filter(Boolean).join(' • ')}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/students/${s.id}?purchase=1`}>{t('attendanceSheet.sellPackage')}</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RevenueChart data={chartData} currency={currency} />
        </div>
        <div className="lg:col-span-2">
          <HistoryComponent logs={recent} title={t('dashboard.recentActivity')} maxItems={5} />
        </div>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
  hintTone,
  href,
}: {
  label: string
  value: string
  hint?: string
  hintTone?: 'up' | 'down' | 'warn'
  href: string
}) {
  return (
    <Link href={href} className="group">
      <Card className="h-full gap-1 p-4 transition-colors group-hover:border-primary/40">
        <p className="truncate text-xs text-muted-foreground sm:text-sm">{label}</p>
        <p className="truncate text-xl font-bold tabular-nums text-foreground sm:text-2xl">{value}</p>
        {hint && (
          <p
            className={cn(
              'truncate text-xs',
              hintTone === 'up' && 'text-green-700 dark:text-green-400',
              hintTone === 'down' && 'text-red-700 dark:text-red-400',
              hintTone === 'warn' && 'text-amber-700 dark:text-amber-400',
              !hintTone && 'text-muted-foreground'
            )}
          >
            {hint}
          </p>
        )}
      </Card>
    </Link>
  )
}

type SetupStep = { key: 'branches' | 'danceTypes' | 'instructors' | 'rates' | 'packages' | 'courses'; done: boolean; href: string }

async function getSetupProgress(orgId: string): Promise<{ steps: SetupStep[]; done: number }> {
  const admin = createAdminClient()
  const [branches, danceTypes, instructors, rates, packages, courses] = await Promise.all([
    admin.from('branches').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).is('deleted_at', null),
    admin.from('dance_types').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).is('deleted_at', null),
    admin.from('instructors').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).is('deleted_at', null),
    admin
      .from('instructor_rates')
      .select('id, branches!inner(organization_id)', { count: 'exact', head: true })
      .eq('branches.organization_id', orgId),
    admin.from('packages').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).is('deleted_at', null),
    admin
      .from('courses')
      .select('id, branches!inner(organization_id)', { count: 'exact', head: true })
      .eq('branches.organization_id', orgId)
      .is('deleted_at', null),
  ])
  const steps: SetupStep[] = [
    { key: 'branches', done: (branches.count ?? 0) > 0, href: '/dashboard/branches' },
    { key: 'danceTypes', done: (danceTypes.count ?? 0) > 0, href: '/dashboard/dance-types' },
    { key: 'instructors', done: (instructors.count ?? 0) > 0, href: '/dashboard/instructors' },
    { key: 'rates', done: (rates.count ?? 0) > 0, href: '/dashboard/instructor-rates' },
    { key: 'packages', done: (packages.count ?? 0) > 0, href: '/dashboard/packages' },
    { key: 'courses', done: (courses.count ?? 0) > 0, href: '/dashboard/courses' },
  ]
  return { steps, done: steps.filter((s) => s.done).length }
}

function SetupCard({
  setup,
  title,
  progressLabel,
  labels,
}: {
  setup: { steps: SetupStep[]; done: number }
  title: string
  progressLabel: string
  labels: Record<SetupStep['key'], string>
}) {
  return (
    <Card className="gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{progressLabel}</p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary" style={{ width: `${(setup.done / setup.steps.length) * 100}%` }} />
      </div>
      <div className="flex flex-wrap gap-2">
        {setup.steps.map((s) => (
          <Button key={s.key} asChild variant={s.done ? 'ghost' : 'outline'} size="sm" className={cn(s.done && 'text-muted-foreground line-through')}>
            <Link href={s.href}>
              {s.done && <Check />} {labels[s.key]}
            </Link>
          </Button>
        ))}
      </div>
    </Card>
  )
}
