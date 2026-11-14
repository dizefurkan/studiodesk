import { Check, ChevronRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { ScheduleCourse } from '@/lib/actions/schedule.actions'
import { formatTime } from '@/lib/utils/formatTime'
import { Badge } from '@/components/ui/badge'

/** One lesson in a list: time, course, and whether attendance was taken. Links to the sheet. */
export function LessonRow({
  course,
  date,
  session,
  dayLabel,
  takeLabel,
  studentsLabel,
}: {
  course: ScheduleCourse
  date: string
  session?: { attendanceCount: number; presentCount: number }
  dayLabel?: string
  takeLabel: string
  studentsLabel: string
}) {
  return (
    <Link
      href={`/dashboard/attendance?course=${course.id}&date=${date}`}
      className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/50 sm:px-4"
    >
      <div className="w-16 shrink-0">
        {dayLabel && <p className="truncate text-xs text-muted-foreground">{dayLabel}</p>}
        <p className="text-sm font-semibold tabular-nums text-foreground">{formatTime(course.start_time)}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{course.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[course.branchName, course.danceTypeName, studentsLabel].filter(Boolean).join(' • ')}
        </p>
      </div>
      {session ? (
        <Badge variant="secondary" className="shrink-0 gap-1 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
          <Check className="size-3" />
          {session.presentCount}/{session.attendanceCount}
        </Badge>
      ) : (
        <span className="shrink-0 text-sm font-medium text-primary">{takeLabel}</span>
      )}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}
