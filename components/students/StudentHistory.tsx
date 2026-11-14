'use client'

import { useLocale, useTranslations } from 'next-intl'
import { CalendarX2, Check, PackageOpen, X } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { formatDay, parseDateOnly } from '@/lib/i18n/dates'
import { Card } from '@/components/ui/card'

export interface AttendanceHistoryItem {
  id: string
  created_at: string
  is_present?: boolean
  deduct_credits?: boolean
  notes?: string | null
  course_sessions?: {
    id?: string
    session_date: string
    course?: {
      id: string
      name: string
      dance_types?: { name: string } | null
      branches?: { name: string } | null
    } | null
  } | null
}

export interface PackageHistoryItem {
  id: string
  created_at: string
  remaining_credits: number
  creditsUsed: number
  attendanceCount: number
  package?: {
    id: string
    name: string
    total_credits: number
    dance_types?: { name: string } | null
  } | null
}

interface StudentHistoryProps {
  attendanceHistory: AttendanceHistoryItem[]
  packageHistory: PackageHistoryItem[]
  view: 'attendance' | 'credits'
}

/** The student's attendance (grouped by month) or package purchases, as compact lists. */
export function StudentHistory({ attendanceHistory, packageHistory, view }: StudentHistoryProps) {
  return view === 'attendance' ? (
    <AttendanceList items={attendanceHistory} />
  ) : (
    <PurchaseList items={packageHistory} />
  )
}

function Empty({ icon: Icon, text }: { icon: typeof CalendarX2; text: string }) {
  return (
    <Card className="items-center gap-2 py-10 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="text-sm text-muted-foreground">{text}</p>
    </Card>
  )
}

function AttendanceList({ items }: { items: AttendanceHistoryItem[] }) {
  const tx = useTranslations('studentHistory')
  const locale = useLocale()
  if (items.length === 0) return <Empty icon={CalendarX2} text={tx('noAttendance')} />

  // newest first, grouped by the lesson's month
  const sorted = [...items].sort((a, b) =>
    (b.course_sessions?.session_date ?? '').localeCompare(a.course_sessions?.session_date ?? '')
  )
  const groups = new Map<string, AttendanceHistoryItem[]>()
  for (const r of sorted) {
    const key = (r.course_sessions?.session_date ?? r.created_at).slice(0, 7)
    groups.set(key, [...(groups.get(key) ?? []), r])
  }
  const monthLabel = (key: string) =>
    new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(parseDateOnly(key + '-01'))

  return (
    <div className="space-y-6">
      {[...groups.entries()].map(([key, rows]) => {
        const present = rows.filter((r) => r.is_present !== false).length
        return (
          <section key={key}>
            <div className="mb-2 flex items-baseline justify-between px-1">
              <h3 className="text-sm font-medium text-foreground first-letter:uppercase">{monthLabel(key)}</h3>
              <p className="text-xs text-muted-foreground">{tx('monthSummary', { present, total: rows.length })}</p>
            </div>
            <Card className="gap-0 divide-y divide-border p-0">
              {rows.map((r) => {
                const ok = r.is_present !== false
                const course = r.course_sessions?.course
                const date = r.course_sessions?.session_date
                return (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg',
                        ok ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                      )}
                      aria-label={ok ? tx('present') : tx('absent')}
                    >
                      {ok ? <Check className="size-4" /> : <X className="size-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      {course ? (
                        <Link href={`/dashboard/courses/${course.id}`} className="block truncate text-sm font-medium hover:underline">
                          {course.name}
                        </Link>
                      ) : (
                        <p className="truncate text-sm font-medium">{tx('unknownCourse')}</p>
                      )}
                      <p className="truncate text-xs text-muted-foreground">
                        {[course?.dance_types?.name, course?.branches?.name, r.notes].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {date && <p className="text-sm tabular-nums">{formatDay(locale, parseDateOnly(date), 'short')}</p>}
                      {r.deduct_credits === false && (
                        <p className="text-xs text-muted-foreground">{tx('noCreditTaken')}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </Card>
          </section>
        )
      })}
    </div>
  )
}

function PurchaseList({ items }: { items: PackageHistoryItem[] }) {
  const tx = useTranslations('studentHistory')
  const locale = useLocale()
  if (items.length === 0) return <Empty icon={PackageOpen} text={tx('noPurchases')} />

  return (
    <Card className="gap-0 divide-y divide-border p-0">
      {items.map((p) => {
        const total = p.package?.total_credits ?? 0
        const left = p.remaining_credits ?? 0
        const used = Math.max(0, total - left)
        const pct = total > 0 ? (used / total) * 100 : 0
        return (
          <div key={p.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_200px] sm:items-center">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{p.package?.name ?? tx('unknownPackage')}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[p.package?.dance_types?.name, tx('purchased', { date: formatDay(locale, new Date(p.created_at), 'medium') })]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
            <div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{tx('usedOf', { used, total })}</span>
                <span className={cn('font-medium tabular-nums', left === 0 ? 'text-muted-foreground' : 'text-foreground')}>
                  {left === 0 ? tx('finished') : tx('left', { count: left })}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        )
      })}
    </Card>
  )
}
