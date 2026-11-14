import { getTranslations } from 'next-intl/server'
import { ArrowLeft } from 'lucide-react'
import { isToday, isYesterday } from 'date-fns'
import { Link } from '@/i18n/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatDay, parseDateOnly } from '@/lib/i18n/dates'
import { Button } from '@/components/ui/button'
import { SessionSummary } from '@/components/attendance/SessionSummary'

export default async function AttendanceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; sessionId: string }>
}) {
  const { sessionId, locale } = await params
  const t = await getTranslations()
  const tx = await getTranslations('attendanceSheet')
  const supabase = await createServerSupabaseClient()

  const { data: session } = await supabase
    .from('course_sessions')
    .select('id, session_date, course:courses(id, name, branch:branches(name))')
    .eq('id', sessionId)
    .maybeSingle()

  const back = (
    <Link
      href="/dashboard/attendance"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> {t('attendance.title')}
    </Link>
  )

  if (!session) {
    return (
      <div className="space-y-4">
        {back}
        <p className="text-muted-foreground">{t('attendanceDetail.sessionNotFound')}</p>
      </div>
    )
  }

  const day = parseDateOnly(session.session_date)
  const label = formatDay(locale, day, 'long')
  const prefix = isToday(day) ? t('common.today') : isYesterday(day) ? t('common.yesterday') : null

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-4">
        {back}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{session.course?.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {[prefix ? `${prefix}, ${label}` : label, session.course?.branch?.name].filter(Boolean).join(' • ')}
            </p>
          </div>
          {session.course && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/attendance?course=${session.course.id}&date=${session.session_date}`}>
                {tx('otherDates')}
              </Link>
            </Button>
          )}
        </div>
      </div>
      <SessionSummary sessionId={session.id} />
    </div>
  )
}
