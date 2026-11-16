'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowRightLeft, BookOpen, ChevronRight, MoreHorizontal, Plus, UserMinus } from 'lucide-react'
import { toast } from 'sonner'
import { Link, useRouter } from '@/i18n/navigation'
import { getStudentEnrolledCourses, removeStudentFromCourse } from '@/lib/actions/course-students.actions'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { StudentCourseDialog } from './StudentCourseDialog'
import { useLocaleNames } from '@/hooks/useLocaleNames'
import { formatTime } from '@/lib/utils/formatTime'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface CourseWithStats {
  courseId: string
  courseName: string
  branchName?: string
  danceTypeName?: string
  dayOfWeek: number
  startTime: string
  endTime: string
  enrolledAt: string
  attendanceCount: number
  remainingCredits: number
}

/** Courses the student is enrolled in: one row each with schedule, lessons attended and credits left. */
export function StudentCoursesSection({ studentId }: { studentId: string }) {
  const tx = useTranslations('studentCourses')
  const { DAYS } = useLocaleNames()
  const { DAYS: SHORT_DAYS } = useLocaleNames({ weekday: 'short' })
  const router = useRouter()
  const confirm = useConfirm()
  const [courses, setCourses] = useState<CourseWithStats[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  // null: closed; {}: add a class; { fromCourse }: move out of that class
  const [dialog, setDialog] = useState<{ fromCourse?: { id: string; name: string } } | null>(null)

  useEffect(() => {
    let cancelled = false
    getStudentEnrolledCourses(studentId).then((res) => {
      if (cancelled) return
      if (res.error) setError(res.error)
      else setCourses([...(res.data?.active ?? []), ...(res.data?.completed ?? [])])
    })
    return () => {
      cancelled = true
    }
  }, [studentId, reloadKey])

  const reload = useCallback(() => {
    setReloadKey((k) => k + 1)
    router.refresh()
  }, [router])

  const remove = async (c: CourseWithStats) => {
    const ok = await confirm({
      title: tx('removeConfirmTitle', { course: c.courseName }),
      description: tx('removeConfirmDescription'),
      confirmLabel: tx('remove'),
      destructive: true,
    })
    if (!ok) return
    const res = await removeStudentFromCourse(c.courseId, studentId)
    if (res.error) {
      toast.error(res.error)
      return
    }
    toast.success(tx('removed'))
    reload()
  }

  // Mounted only while open, so each opening starts with nothing selected
  const dialogEl = dialog && (
    <StudentCourseDialog
      studentId={studentId}
      fromCourse={dialog?.fromCourse}
      open
      onOpenChange={(o) => !o && setDialog(null)}
      onDone={reload}
    />
  )

  const addButton = (
    <Button variant="outline" size="sm" onClick={() => setDialog({})}>
      <Plus /> {tx('addToCourse')}
    </Button>
  )

  if (error) return <Card className="p-6 text-sm text-destructive">{error}</Card>

  if (!courses) {
    return (
      <Card className="gap-0 divide-y divide-border p-0">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-4">
            <Skeleton className="size-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </Card>
    )
  }

  if (courses.length === 0) {
    return (
      <Card className="items-center gap-2 py-10 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <BookOpen className="size-5" />
        </span>
        <p className="text-sm font-medium">{tx('emptyTitle')}</p>
        <p className="text-sm text-muted-foreground">{tx('emptyDescription')}</p>
        <div className="mt-2">{addButton}</div>
        {dialogEl}
      </Card>
    )
  }

  return (
    <div className="space-y-3">
    <div className="flex justify-end">{addButton}</div>
    <Card className="gap-0 divide-y divide-border p-0">
      {courses.map((c) => (
        <div key={c.courseId} className="flex items-center gap-1 pr-2 transition-colors hover:bg-muted/50">
        <Link
          href={`/dashboard/courses/${c.courseId}`}
          className="group flex min-w-0 flex-1 items-center gap-3 py-4 pl-4"
        >
          <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-muted text-center leading-none">
            <span className="text-[10px] text-muted-foreground">{SHORT_DAYS[c.dayOfWeek]}</span>
            <span className="mt-0.5 text-xs font-semibold tabular-nums">{formatTime(c.startTime)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{c.courseName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {[c.danceTypeName, c.branchName, `${DAYS[c.dayOfWeek]} ${formatTime(c.startTime)}–${formatTime(c.endTime)}`]
                .filter(Boolean)
                .join(', ')}
            </p>
          </div>
          <div className="hidden shrink-0 text-right sm:block">
            <p className="text-sm tabular-nums">{tx('lessons', { count: c.attendanceCount })}</p>
            <p className={cn('text-xs tabular-nums', c.remainingCredits <= 1 ? 'text-warning' : 'text-muted-foreground')}>
              {tx('creditsLeft', { count: c.remainingCredits })}
            </p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={tx('actions', { course: c.courseName })}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setDialog({ fromCourse: { id: c.courseId, name: c.courseName } })}>
                <ArrowRightLeft /> {tx('changeCourse')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => remove(c)}>
                <UserMinus /> {tx('remove')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </Card>
    {dialogEl}
    </div>
  )
}
