import { getTranslations } from 'next-intl/server'
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
      `id, notes, course_id,
       attendances(id, is_present, notes, deduct_credits, student:students(id, first_name, last_name), studio:studios(id, name)),
       session_instructors(instructor:instructors(id, first_name, last_name))`
    )
    .eq('id', sessionId)
    .maybeSingle()

  if (!session) return null

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
            </p>
          </div>
          <UndoAttendanceButton sessionId={session.id} />
        </div>

        {(instructors.length > 0 || studio) && (
          <p className="text-sm text-muted-foreground">
            {[instructors.map((i) => `${i.first_name} ${i.last_name}`).join(', '), studio?.name]
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
