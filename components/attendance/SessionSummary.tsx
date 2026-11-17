import { getLocale, getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPayAccess } from '@/lib/auth/payAccess'
import { getOrganization } from '@/lib/auth/getOrganization'
import { todayInTimeZone } from '@/lib/i18n/dates'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { UndoAttendanceButton } from './UndoAttendanceButton'

/** Read-only view of a taken attendance sheet, with an undo action. Server component. */
export async function SessionSummary({ sessionId }: { sessionId: string }) {
  const tx = await getTranslations('attendanceSheet')
  const supabase = await createServerSupabaseClient()

  const { data: session } = await supabase
    .from('course_sessions')
    .select(
      `id, notes, course_id, course:courses(dance_type_id),
       attendances(id, is_present, notes, deduct_credits, student_package:student_packages(packages(price, total_credits)), student:students(id, first_name, last_name), studio:studios(id, name)),
       session_instructors(instructor:instructors(id, first_name, last_name))`
    )
    .eq('id', sessionId)
    .maybeSingle()

  if (!session) return null

  const locale = await getLocale()
  const organization = await getOrganization()
  const currency = organization?.currency || 'TRY'
  const today = todayInTimeZone(organization?.timezone)
  const danceTypeId = session.course?.dance_type_id

  // Credits each student has left now for this course's class type (unexpired packages)
  const studentIds = (session.attendances ?? []).map((a) => a.student?.id).filter((id): id is string => !!id)
  const { data: packages } = studentIds.length
    ? await supabase
        .from('student_packages')
        .select('student_id, remaining_credits, expire_date, packages!inner(dance_type_id)')
        .in('student_id', studentIds)
        .eq('packages.dance_type_id', danceTypeId ?? '')
    : { data: [] }
  const creditsLeft = new Map<string, number>()
  for (const p of packages ?? []) {
    if (p.expire_date && p.expire_date.slice(0, 10) < today) continue
    creditsLeft.set(p.student_id, (creditsLeft.get(p.student_id) ?? 0) + p.remaining_credits)
  }

  // Instructor pay for this lesson: owners and managers only
  const access = await getPayAccess()
  const { data: earnings } =
    access?.canManage && organization
      ? await createAdminClient()
          .from('instructor_earnings')
          .select('amount, instructor:instructors!inner(id, first_name, last_name, organization_id)')
          .eq('session_id', session.id)
          .eq('instructor.organization_id', organization.id)
      : { data: null }
  const payTotal = (earnings ?? []).reduce((sum, e) => sum + Number(e.amount), 0)
  const percent = new Intl.NumberFormat(locale, { style: 'percent' })

  const records = [...(session.attendances ?? [])].sort((a, b) =>
    `${a.student?.first_name} ${a.student?.last_name}`.localeCompare(`${b.student?.first_name} ${b.student?.last_name}`)
  )
  const present = records.filter((r) => r.is_present).length
  const absent = records.length - present
  const instructors = (session.session_instructors ?? []).map((si) => si.instructor).filter((i) => i !== null)
  const studio = records.find((r) => r.studio?.name)?.studio

  return (
    <div className="space-y-4">
      <Card className="gap-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 font-medium text-foreground">
              <Check className="size-4 text-green-600" /> {tx('taken')}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-medium text-green-700 dark:text-green-400">{tx('presentCount', { count: present })}</span>
              {' • '}
              <span className="font-medium text-red-700 dark:text-red-400">{tx('absentCount', { count: absent })}</span>
              {records.length > 0 && (
                <>
                  {' • '}
                  {tx('rate', { rate: percent.format(present / records.length) })}
                </>
              )}
            </p>
          </div>
          <UndoAttendanceButton sessionId={session.id} />
        </div>

        {(instructors.length > 0 || studio) && (
          <p className="text-sm text-muted-foreground">
            {/* Instructors with what they earned for this lesson (pay shown to owners and managers only) */}
            {[
              instructors
                .map((i) => {
                  const pay = earnings?.filter((e) => e.instructor.id === i.id).reduce((sum, e) => sum + Number(e.amount), 0)
                  const name = `${i.first_name} ${i.last_name}`
                  return earnings && pay !== undefined ? `${name} ${formatCurrency(pay, currency)}` : name
                })
                .join(', '),
              earnings && earnings.length > 1 ? tx('payTotalInline', { total: formatCurrency(payTotal, currency) }) : null,
              studio?.name,
            ]
              .filter(Boolean)
              .join(' • ')}
          </p>
        )}

        {session.notes && (
          <p className="whitespace-pre-wrap rounded-lg bg-muted px-3 py-2 text-sm text-foreground">{session.notes}</p>
        )}
      </Card>

      <Card className="gap-0 divide-y divide-border p-0">
        {records.map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
            <span
              className={
                r.is_present
                  ? 'flex size-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                  : 'flex size-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
              }
            >
              {r.is_present ? <Check className="size-4" /> : <X className="size-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <Link
                href={`/dashboard/students/${r.student?.id}`}
                className="block truncate text-sm font-medium text-foreground hover:text-primary"
              >
                {r.student?.first_name} {r.student?.last_name}
              </Link>
              {r.notes && <p className="truncate text-xs text-muted-foreground">{r.notes}</p>}
            </div>
            <div className="shrink-0 text-right text-xs">
              {(() => {
                const left = r.student?.id ? (creditsLeft.get(r.student.id) ?? 0) : 0
                const pkg = r.student_package?.packages
                const value = pkg && pkg.total_credits ? Number(pkg.price) / pkg.total_credits : null
                return (
                  <>
                    <p
                      className={cn(
                        'tabular-nums',
                        left === 0 ? 'text-danger' : left <= 1 ? 'text-warning' : 'text-muted-foreground'
                      )}
                    >
                      {tx('creditsLeftNow', { count: left })}
                    </p>
                    {r.is_present && r.deduct_credits && value !== null && (
                      <p className="tabular-nums text-muted-foreground">
                        {tx('lessonValue', { price: formatCurrency(value, currency) })}
                      </p>
                    )}
                  </>
                )
              })()}
            </div>
            {!r.deduct_credits && (
              <Badge variant="secondary" className="shrink-0">
                {tx('noCreditTaken')}
              </Badge>
            )}
          </div>
        ))}
      </Card>
    </div>
  )
}
