'use client'

import { Link } from '@/i18n/navigation'
import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ColumnDef } from '@tanstack/react-table'
import { Trash2 } from 'lucide-react'
import { getCourseStudents, removeStudentFromCourse } from '@/lib/actions/course-students.actions'
import { useLocale, useTranslations } from 'next-intl'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { toast } from 'sonner'
import { DataTable } from '@/components/table/data-table'
import { ColumnHeader } from '@/components/table/column-header'

interface CourseStudent {
  id: string
  student_id: string
  joined_at: string
  courses?: {
    dance_type_id: string
  }
  students: {
    id: string
    first_name: string
    last_name: string
    phone?: string | null
    is_active?: boolean
    student_packages?: Array<{
      id: string
      remaining_credits: number
      expire_date?: string | null
      packages?: {
        id: string
        dance_type_id: string
      }
    }>
  }
}

interface CourseStudentsSectionProps {
  courseId: string
  danceTypeId: string
  /** Called with the number of active students */
  onStudentsLoaded?: (count: number) => void
}

/** Credits at or below this are "running low" (same rule as the home screen) */
const LOW_CREDITS = 1
const FILTERS = ['active', 'low', 'empty', 'passive', 'all'] as const
type Filter = (typeof FILTERS)[number]

export function CourseStudentsSection({ courseId, danceTypeId, onStudentsLoaded }: CourseStudentsSectionProps) {
  const tx = useTranslations('courseStudents')
  const locale = useLocale()
  const t = useTranslations()
  const [students, setStudents] = useState<CourseStudent[]>([])
  const [loading, setLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('active')
  // Load students on mount
  const loadStudents = async () => {
    setIsLoading(true)
    try {
      const result = await getCourseStudents(courseId)
      if (result.data) {
        setStudents(result.data)
        onStudentsLoaded?.(result.data.filter((s) => s.students?.is_active !== false).length)
      }
    } catch (error) {
      console.error('Error loading students:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [courseId])

  const confirm = useConfirm()

  const handleRemoveStudent = async (studentId: string, name: string) => {
    const ok = await confirm({
      title: tx('removeConfirmTitle', { name }),
      description: tx('removeConfirmDescription'),
      confirmLabel: tx('remove'),
      destructive: true,
    })
    if (!ok) return

    setLoading(true)
    try {
      const result = await removeStudentFromCourse(courseId, studentId)
      if (result.success) {
        await loadStudents()
      } else {
        toast.error(result.error || tx('removeFailed'))
      }
    } catch (error) {
      console.error('Error removing student:', error)
      toast.error(tx('removeFailed'))
    } finally {
      setLoading(false)
    }
  }

  // Usable credits for this course's class type: packages of that type that haven't expired
  const today = new Date().toISOString().slice(0, 10)
  const creditsFor = (student: CourseStudent['students']): number | null => {
    const packages = (student.student_packages ?? []).filter((p) => p.packages?.dance_type_id === danceTypeId)
    if (packages.length === 0) return null
    return packages
      .filter((p) => !p.expire_date || p.expire_date.slice(0, 10) >= today)
      .reduce((sum, p) => sum + p.remaining_credits, 0)
  }

  const groups = useMemo(() => {
    const active = students.filter((s) => s.students?.is_active !== false)
    const credits = (s: CourseStudent) => creditsFor(s.students) ?? 0
    return {
      active,
      low: active.filter((s) => credits(s) > 0 && credits(s) <= LOW_CREDITS),
      empty: active.filter((s) => credits(s) === 0),
      passive: students.filter((s) => s.students?.is_active === false),
      all: students,
    } satisfies Record<Filter, CourseStudent[]>
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, danceTypeId])

  const columns: ColumnDef<CourseStudent>[] = [
    {
      id: 'name',
      header: () => <ColumnHeader k="studentName" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/students/${row.original.students.id}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.students.first_name} {row.original.students.last_name}
          </Link>
          {row.original.students.is_active === false && (
            <Badge variant="outline">{t('studentStatus.passive')}</Badge>
          )}
        </div>
      ),
    },
    {
      id: 'credits',
      header: t('courses.credits'),
      cell: ({ row }) => {
        // No package for this class type counts as out of credits
        const credits = creditsFor(row.original.students) ?? 0
        return (
          <Badge
            variant="secondary"
            className={cn(
              'tabular-nums',
              credits === 0 && 'bg-danger/15 text-danger',
              credits > 0 && credits <= LOW_CREDITS && 'bg-warning/15 text-warning'
            )}
          >
            {credits}
          </Badge>
        )
      },
    },
    {
      id: 'joined',
      header: () => <ColumnHeader k="joined" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{new Date(row.original.joined_at).toLocaleDateString(locale)}</span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">{tx('action')}</span>,
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive"
            aria-label={tx('remove')}
            onClick={() =>
              handleRemoveStudent(
                row.original.student_id,
                `${row.original.students.first_name} ${row.original.students.last_name}`
              )
            }
            disabled={loading}
          >
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={filter}
        onValueChange={(v) => v && setFilter(v as Filter)}
        aria-label={tx('filterLabel')}
        className="flex-wrap"
      >
        {FILTERS.map((f) => (
          <ToggleGroupItem key={f} value={f} className="px-3">
            {tx(`filters.${f}`)}
            <span
              className={cn(
                'tabular-nums text-muted-foreground',
                f === 'low' && groups.low.length > 0 && 'text-warning',
                f === 'empty' && groups.empty.length > 0 && 'text-danger'
              )}
            >
              {groups[f].length}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <DataTable<CourseStudent, unknown>
        columns={columns}
        data={groups[filter]}
        loading={isLoading}
        enableSearch={false}
        enableFilters={false}
        enablePagination={false}
        emptyMessage={students.length === 0 ? tx('empty') : tx(`emptyFilter.${filter}`)}
      />
    </div>
  )
}
