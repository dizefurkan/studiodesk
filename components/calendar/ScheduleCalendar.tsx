'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock, DoorOpen, Users } from 'lucide-react'
import { Link, useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/utils/formatTime'
import { addDaysToDateString, formatDay, parseDateOnly, toDateString } from '@/lib/i18n/dates'
import { orderedWeekdays } from '@/lib/context/OrganizationPrefsContext'
import type { ScheduleCourse, ScheduleSession } from '@/lib/actions/schedule.actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { CALENDAR_VIEWS, hourRange, layoutLanes, minutes, type CalendarView, type Lesson } from './lessons'


type Branch = { id: string; name: string; studios: Array<{ id: string; name: string }> }

const HOUR_PX = 72

/**
 * The studio timetable in four views: a day's list, a week as an hour × day grid, a day per
 * room, and a month overview. Lessons show the course, time, instructors and room, and open
 * the attendance sheet for that day. View, date and branch live in the URL.
 */
export function ScheduleCalendar({
  view,
  date,
  today,
  weekStartDay,
  courses,
  sessions,
  branches,
  branchId,
}: {
  view: CalendarView
  date: string
  today: string
  weekStartDay: number
  courses: ScheduleCourse[]
  sessions: ScheduleSession[]
  branches: Branch[]
  branchId: string | null
}) {
  const t = useTranslations('calendar')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()

  const go = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const visible = branchId ? courses.filter((c) => c.branch_id === branchId) : courses
  const sessionFor = (courseId: string, d: string) => sessions.find((s) => s.course_id === courseId && s.session_date === d)
  const lessonsOn = (d: string): Lesson[] => {
    const dow = parseDateOnly(d).getDay()
    return visible
      .filter((c) => c.day_of_week === dow)
      .sort((a, b) => minutes(a.start_time) - minutes(b.start_time))
      .map((course) => ({ course, date: d, session: sessionFor(course.id, d) }))
      // Not before the course existed, unless attendance was taken that day
      .filter((l) => l.date >= l.course.createdOn || (l.session?.attendanceCount ?? 0) > 0)
  }

  // Dates for the current view
  const weekStart = addDaysToDateString(date, -((parseDateOnly(date).getDay() - weekStartDay + 7) % 7))
  const weekDates = Array.from({ length: 7 }, (_, i) => addDaysToDateString(weekStart, i))
  const step = (dir: -1 | 1) => {
    if (view === 'week') return addDaysToDateString(date, dir * 7)
    if (view === 'month') {
      const d = parseDateOnly(date)
      return toDateString(new Date(d.getFullYear(), d.getMonth() + dir, 1))
    }
    return addDaysToDateString(date, dir)
  }

  const label = (() => {
    if (view === 'week') {
      const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' })
      return fmt.formatRange(parseDateOnly(weekDates[0]), parseDateOnly(weekDates[6]))
    }
    if (view === 'month') return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(parseDateOnly(date))
    return formatDay(locale, parseDateOnly(date), 'long')
  })()

  const viewIcons = { day: CalendarDays, week: Clock, rooms: DoorOpen, month: CalendarDays }

  return (
    <div className="space-y-4">
      {/* Toolbar: view, date navigation, branch */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <ToggleGroup
          type="single"
          variant="outline"
          value={view}
          onValueChange={(v) => v && go({ view: v === 'week' ? null : v })}
          aria-label={t('viewLabel')}
          className="flex-wrap"
        >
          {CALENDAR_VIEWS.map((v) => {
            const Icon = viewIcons[v]
            return (
              <ToggleGroupItem key={v} value={v} className="px-3">
                <Icon /> {t(`views.${v}`)}
              </ToggleGroupItem>
            )
          })}
        </ToggleGroup>

        <div className="flex flex-wrap items-center gap-2">
          {branches.length > 1 && (
            <Select value={branchId ?? 'all'} onValueChange={(v) => go({ branch: v === 'all' ? null : v })}>
              <SelectTrigger className="w-44" aria-label={t('branch')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allBranches')}</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" aria-label={t('previous')} onClick={() => go({ date: step(-1) })}>
              <ChevronLeft />
            </Button>
            <Button variant="outline" onClick={() => go({ date: null })} disabled={date === today && view !== 'month'}>
              {t('today')}
            </Button>
            <Button variant="outline" size="icon" aria-label={t('next')} onClick={() => go({ date: step(1) })}>
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>
      <h2 className="text-lg font-semibold first-letter:uppercase">{label}</h2>

      {view === 'day' && <DayList lessons={lessonsOn(date)} today={today} />}
      {view === 'week' && (
        <TimeGrid
          columns={weekDates.map((d) => ({
            key: d,
            title: formatDay(locale, parseDateOnly(d), 'short'),
            highlight: d === today,
            onTitleClick: () => go({ view: 'day', date: d }),
            lessons: lessonsOn(d),
          }))}
          today={today}
          showRoom
        />
      )}
      {view === 'rooms' && <RoomsGrid lessons={lessonsOn(date)} branches={branches} branchId={branchId} today={today} />}
      {view === 'month' && (
        <MonthGrid
          date={date}
          today={today}
          weekStartDay={weekStartDay}
          lessonsOn={lessonsOn}
          onPick={(d) => go({ view: 'day', date: d })}
        />
      )}
    </div>
  )
}

/** Lesson status: attendance taken, still to take (past or today), or upcoming. */
function useStatus() {
  const t = useTranslations('calendar')
  return (lesson: Lesson, today: string) => {
    if (lesson.session && lesson.session.attendanceCount > 0)
      return {
        tone: 'done' as const,
        text: t('status.taken', { present: lesson.session.presentCount, total: lesson.session.attendanceCount }),
      }
    if (lesson.date <= today) return { tone: 'due' as const, text: t('status.due') }
    return { tone: 'upcoming' as const, text: t('status.upcoming') }
  }
}

const instructorNames = (c: ScheduleCourse) => c.instructors.map((i) => `${i.first_name} ${i.last_name}`).join(', ')

/** The day's lessons as a list, with every detail and the attendance action. */
function DayList({ lessons, today }: { lessons: Lesson[]; today: string }) {
  const t = useTranslations('calendar')
  const status = useStatus()
  if (lessons.length === 0) {
    return <Card className="p-10 text-center text-sm text-muted-foreground">{t('noLessonsDay')}</Card>
  }
  return (
    <Card className="gap-0 divide-y divide-border p-0">
      {lessons.map((l) => {
        const s = status(l, today)
        return (
          <div key={l.course.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="w-28 shrink-0">
              <p className="font-display text-xl font-medium tabular-nums">{formatTime(l.course.start_time)}</p>
              <p className="text-xs tabular-nums text-muted-foreground">
                {t('until', { time: formatTime(l.course.end_time) })}
              </p>
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <Link href={`/dashboard/courses/${l.course.id}`} className="font-medium text-foreground hover:text-primary">
                {l.course.name}
              </Link>
              <p className="text-sm text-muted-foreground">
                {[l.course.danceTypeName, l.course.studioName, l.course.branchName].filter(Boolean).join(' · ')}
              </p>
              <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span>{instructorNames(l.course) || <span className="text-muted-foreground">{t('noInstructor')}</span>}</span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Users className="size-3.5" /> {t('students', { count: l.course.studentCount })}
                </span>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <StatusBadge tone={s.tone} text={s.text} />
              {s.tone !== 'upcoming' && (
                <Button asChild size="sm" variant={s.tone === 'done' ? 'outline' : 'default'}>
                  <Link href={`/dashboard/attendance?course=${l.course.id}&date=${l.date}`}>
                    {s.tone === 'done' ? t('viewAttendance') : t('takeAttendance')}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </Card>
  )
}

function StatusBadge({ tone, text }: { tone: 'done' | 'due' | 'upcoming'; text: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        'whitespace-nowrap',
        tone === 'done' && 'bg-success/15 text-success',
        tone === 'due' && 'bg-warning/15 text-warning'
      )}
    >
      {tone === 'done' && <Check />} {text}
    </Badge>
  )
}

type Column = { key: string; title: string; subtitle?: string; highlight?: boolean; onTitleClick?: () => void; lessons: Lesson[] }

/** Hours down the side, one column per day or room, lessons as blocks sized by their length. */
function TimeGrid({ columns, today, showRoom = false }: { columns: Column[]; today: string; showRoom?: boolean }) {
  const t = useTranslations('calendar')
  const status = useStatus()
  const { from, to } = hourRange(columns.flatMap((c) => c.lessons))
  const hours = Array.from({ length: to - from }, (_, i) => from + i)
  const height = (to - from) * HOUR_PX

  return (
    <Card className="overflow-x-auto p-0">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `3.5rem repeat(${columns.length}, minmax(0, 1fr))`,
          // Wide enough for the lesson names; scrolls sideways on small screens
          minWidth: 56 + columns.length * 130,
        }}
      >
        {/* Column headers */}
        <div className="sticky top-0 z-10 border-b border-border bg-card" />
        {columns.map((c) => (
          <div
            key={c.key}
            className={cn('border-b border-l border-border bg-card px-2 py-2 text-center', c.highlight && 'bg-highlight/20')}
          >
            {c.onTitleClick ? (
              <button type="button" onClick={c.onTitleClick} className="text-sm font-medium hover:text-primary hover:underline">
                {c.title}
              </button>
            ) : (
              <p className="truncate text-sm font-medium">{c.title}</p>
            )}
            {c.subtitle && <p className="truncate text-xs text-muted-foreground">{c.subtitle}</p>}
          </div>
        ))}

        {/* Hour labels */}
        <div className="relative" style={{ height }}>
          {hours.map((h) => (
            <span
              key={h}
              className="absolute right-2 -translate-y-1/2 text-xs tabular-nums text-muted-foreground"
              style={{ top: (h - from) * HOUR_PX }}
            >
              {h > from && `${String(h).padStart(2, '0')}:00`}
            </span>
          ))}
        </div>

        {/* Day / room columns */}
        {columns.map((c) => (
          <div key={c.key} className={cn('relative border-l border-border', c.highlight && 'bg-highlight/5')} style={{ height }}>
            {hours.map((h) => (
              <div key={h} className="absolute inset-x-0 border-t border-border/60" style={{ top: (h - from) * HOUR_PX }} />
            ))}
            {layoutLanes(c.lessons).map(({ lesson, lane, lanes }) => {
              const start = minutes(lesson.course.start_time)
              const end = minutes(lesson.course.end_time)
              const s = status(lesson, today)
              return (
                <Link
                  key={lesson.course.id}
                  href={`/dashboard/attendance?course=${lesson.course.id}&date=${lesson.date}`}
                  title={[
                    lesson.course.name,
                    `${formatTime(lesson.course.start_time)}–${formatTime(lesson.course.end_time)}`,
                    instructorNames(lesson.course),
                    lesson.course.studioName,
                    s.text,
                  ]
                    .filter(Boolean)
                    .join('\n')}
                  className={cn(
                    'absolute overflow-hidden rounded-md border border-border border-l-4 bg-card px-1.5 py-1 text-xs shadow-sm transition-colors hover:bg-muted',
                    s.tone === 'done' && 'border-l-success',
                    s.tone === 'due' && 'border-l-warning',
                    s.tone === 'upcoming' && 'border-l-primary'
                  )}
                  style={{
                    top: ((start - from * 60) / 60) * HOUR_PX + 1,
                    height: Math.max(((end - start) / 60) * HOUR_PX - 2, 22),
                    left: `calc(${(lane / lanes) * 100}% + 2px)`,
                    width: `calc(${100 / lanes}% - 4px)`,
                  }}
                >
                  <p className="line-clamp-2 break-words font-medium leading-tight text-foreground">{lesson.course.name}</p>
                  <p className="truncate tabular-nums text-muted-foreground">
                    {formatTime(lesson.course.start_time)}–{formatTime(lesson.course.end_time)}
                  </p>
                  <p className="truncate text-muted-foreground">{instructorNames(lesson.course) || t('noInstructor')}</p>
                  {showRoom && lesson.course.studioName && (
                    <p className="truncate text-muted-foreground">{lesson.course.studioName}</p>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </div>
    </Card>
  )
}

/** One day with a column per room (grouped by branch when showing all branches). */
function RoomsGrid({
  lessons,
  branches,
  branchId,
  today,
}: {
  lessons: Lesson[]
  branches: Branch[]
  branchId: string | null
  today: string
}) {
  const t = useTranslations('calendar')
  const shown = branchId ? branches.filter((b) => b.id === branchId) : branches
  const many = shown.length > 1
  const columns: Column[] = shown.flatMap((b) =>
    b.studios.map((s) => ({
      key: s.id,
      title: s.name,
      subtitle: many ? b.name : undefined,
      lessons: lessons.filter((l) => l.course.studio_id === s.id),
    }))
  )
  const unassigned = lessons.filter((l) => !l.course.studio_id || !columns.some((c) => c.key === l.course.studio_id))
  if (unassigned.length > 0) columns.push({ key: 'none', title: t('noRoom'), lessons: unassigned })

  if (columns.length === 0) {
    return <Card className="p-10 text-center text-sm text-muted-foreground">{t('noRooms')}</Card>
  }
  return (
    <div className="space-y-2">
      <TimeGrid columns={columns} today={today} />
      {unassigned.length > 0 && <p className="text-xs text-muted-foreground">{t('noRoomHint')}</p>}
    </div>
  )
}

/** Month overview: a few lessons per day; a day opens its list. */
function MonthGrid({
  date,
  today,
  weekStartDay,
  lessonsOn,
  onPick,
}: {
  date: string
  today: string
  weekStartDay: number
  lessonsOn: (d: string) => Lesson[]
  onPick: (d: string) => void
}) {
  const t = useTranslations('calendar')
  const locale = useLocale()
  const d = parseDateOnly(date)
  const first = toDateString(new Date(d.getFullYear(), d.getMonth(), 1))
  const lead = (parseDateOnly(first).getDay() - weekStartDay + 7) % 7
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  const cells = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => addDaysToDateString(first, i)),
  ]
  const weekdays = orderedWeekdays(weekStartDay)
  const short = new Intl.DateTimeFormat(locale, { weekday: 'short' })

  return (
    <Card className="overflow-x-auto p-0">
      <div className="grid min-w-[700px] grid-cols-7">
        {weekdays.map((w) => (
          <div key={w} className="border-b border-border px-2 py-2 text-center text-xs font-medium text-muted-foreground">
            {short.format(new Date(2026, 1, 1 + w))}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <div key={`b${i}`} className="min-h-28 border-b border-l border-border bg-muted/30" />
          const lessons = lessonsOn(cell)
          return (
            <button
              key={cell}
              type="button"
              onClick={() => onPick(cell)}
              className={cn(
                'flex min-h-28 flex-col items-stretch justify-start border-b border-l border-border p-1.5 text-left transition-colors hover:bg-muted/50',
                cell === today && 'bg-highlight/15'
              )}
            >
              <span className={cn('self-start text-xs font-medium', cell === today && 'rounded-full bg-highlight px-1.5 text-highlight-foreground')}>
                {parseDateOnly(cell).getDate()}
              </span>
              <ul className="mt-1 space-y-0.5">
                {lessons.slice(0, 3).map((l) => (
                  <li key={l.course.id} className="flex items-center gap-1 truncate text-[11px]">
                    {l.session && l.session.attendanceCount > 0 && <Check className="size-3 shrink-0 text-success" />}
                    <span className="tabular-nums text-muted-foreground">{formatTime(l.course.start_time)}</span>
                    <span className="truncate">{l.course.name}</span>
                  </li>
                ))}
                {lessons.length > 3 && (
                  <li className="text-[11px] text-muted-foreground">{t('more', { count: lessons.length - 3 })}</li>
                )}
              </ul>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
