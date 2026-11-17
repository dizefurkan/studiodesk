'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowRightLeft, CalendarPlus, UserMinus, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Link, useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/format'
import { useOrganizationPrefs } from '@/lib/context/OrganizationPrefsContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { DataTable } from '@/components/table/data-table'
import { ColumnHeader } from '@/components/table/column-header'
import { StudentCourseDialog } from '@/components/students/StudentCourseDialog'
import { ExtendPackageDialog, type ExtendablePackage } from './ExtendPackageDialog'
import {
  addStudentToCourse,
  getCourseStudents,
  getFormerCourseStudents,
  removeStudentFromCourse,
} from '@/lib/actions/course-students.actions'
import type { ActionData } from '@/lib/types/actions'

type CourseStudent = ActionData<typeof getCourseStudents>[number]
type FormerStudent = ActionData<typeof getFormerCourseStudents>[number]

interface CourseStudentsSectionProps {
  courseId: string
  courseName: string
  danceTypeId: string
  /** Called with the number of active students */
  onStudentsLoaded?: (count: number) => void
  /** Called after an enrollment changed (moved, removed, re-added) */
  onChanged?: () => void
}

/** Credits at or below this are "running low" (same rule as the home screen) */
const LOW_CREDITS = 1
const FILTERS = ['active', 'low', 'empty', 'passive', 'former', 'all'] as const
type Filter = (typeof FILTERS)[number]

/**
 * Students of a course with credit filters. Each row shows credits left and what one lesson
 * costs the student, and lets you move them to another class, extend their package or remove
 * them (removed students stay under "Former").
 */
export function CourseStudentsSection({
  courseId,
  courseName,
  danceTypeId,
  onStudentsLoaded,
  onChanged,
}: CourseStudentsSectionProps) {
  const tx = useTranslations('courseStudents')
  const locale = useLocale()
  const router = useRouter()
  const confirm = useConfirm()
  const { currency } = useOrganizationPrefs()
  const [students, setStudents] = useState<CourseStudent[]>([])
  const [former, setFormer] = useState<FormerStudent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState<Filter>('active')
  const [moving, setMoving] = useState<{ studentId: string } | null>(null)
  const [extending, setExtending] = useState<{ name: string; studentId: string; packages: ExtendablePackage[] } | null>(null)

  // The parent passes a new callback each render; keep the latest without reloading
  const onLoadedRef = useRef(onStudentsLoaded)
  useEffect(() => {
    onLoadedRef.current = onStudentsLoaded
  })

  const load = useCallback(async () => {
    setIsLoading(true)
    const [current, past] = await Promise.all([getCourseStudents(courseId), getFormerCourseStudents(courseId)])
    if (current.data) {
      setStudents(current.data)
      onLoadedRef.current?.(current.data.filter((s) => s.students?.is_active !== false).length)
    }
    setFormer(past.data ?? [])
    setIsLoading(false)
  }, [courseId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const changed = () => {
    void load()
    onChanged?.()
    router.refresh()
  }

  const today = new Date().toISOString().slice(0, 10)
  const typePackages = (s: CourseStudent) =>
    (s.students?.student_packages ?? []).filter((p) => p.packages?.dance_type_id === danceTypeId)
  const usable = (s: CourseStudent) =>
    typePackages(s).filter((p) => !p.expire_date || p.expire_date.slice(0, 10) >= today)
  const creditsOf = (s: CourseStudent) => usable(s).reduce((sum, p) => sum + p.remaining_credits, 0)

  /** What one lesson costs: price ÷ lessons of the package credits come from next (else the latest one) */
  const lessonPrice = (s: CourseStudent): number | null => {
    const next = usable(s)
      .filter((p) => p.remaining_credits > 0)
      .sort((a, b) => (a.expire_date ?? '9999').localeCompare(b.expire_date ?? '9999'))[0]
    const latest = [...typePackages(s)].sort((a, b) => (b.purchase_date ?? '').localeCompare(a.purchase_date ?? ''))[0]
    const pkg = (next ?? latest)?.packages
    if (!pkg || !pkg.total_credits || pkg.price == null) return null
    return Number(pkg.price) / pkg.total_credits
  }

  const groups = useMemo(() => {
    const active = students.filter((s) => s.students?.is_active !== false)
    return {
      active,
      low: active.filter((s) => creditsOf(s) > 0 && creditsOf(s) <= LOW_CREDITS),
      empty: active.filter((s) => creditsOf(s) === 0),
      passive: students.filter((s) => s.students?.is_active === false),
      all: students,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, danceTypeId])

  const counts: Record<Filter, number> = {
    active: groups.active.length,
    low: groups.low.length,
    empty: groups.empty.length,
    passive: groups.passive.length,
    former: former.length,
    all: groups.all.length,
  }

  const remove = async (s: CourseStudent) => {
    const name = `${s.students.first_name} ${s.students.last_name}`
    const ok = await confirm({
      title: tx('removeConfirmTitle', { name }),
      description: tx('removeConfirmDescription'),
      confirmLabel: tx('remove'),
      destructive: true,
    })
    if (!ok) return
    setBusy(true)
    const res = await removeStudentFromCourse(courseId, s.student_id)
    setBusy(false)
    if (res.error) {
      toast.error(res.error)
      return
    }
    toast.success(tx('removed', { name }))
    changed()
  }

  const readd = async (f: FormerStudent) => {
    setBusy(true)
    const res = await addStudentToCourse(courseId, f.studentId)
    setBusy(false)
    if (res.error) {
      toast.error(res.error)
      return
    }
    toast.success(tx('readded', { name: `${f.firstName} ${f.lastName}` }))
    setFilter('active')
    changed()
  }

  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })

  const nameCell = (id: string, first: string, last: string, passive: boolean) => (
    <div className="flex items-center gap-2">
      <Link href={`/dashboard/students/${id}`} className="font-medium text-primary underline-offset-4 hover:underline">
        {first} {last}
      </Link>
      {passive && <Badge variant="outline">{tx('passiveBadge')}</Badge>}
    </div>
  )

  const columns: ColumnDef<CourseStudent>[] = [
    {
      id: 'name',
      header: () => <ColumnHeader k="studentName" />,
      cell: ({ row }) =>
        nameCell(
          row.original.students.id,
          row.original.students.first_name,
          row.original.students.last_name,
          row.original.students.is_active === false
        ),
    },
    {
      id: 'credits',
      header: () => <ColumnHeader k="credits" />,
      cell: ({ row }) => {
        const credits = creditsOf(row.original)
        const price = lessonPrice(row.original)
        return (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Badge
              variant="secondary"
              className={cn(
                'tabular-nums',
                credits === 0 && 'bg-danger/15 text-danger',
                credits > 0 && credits <= LOW_CREDITS && 'bg-warning/15 text-warning'
              )}
            >
              {tx('creditsLeft', { count: credits })}
            </Badge>
            {price !== null && (
              <span className="text-xs tabular-nums text-muted-foreground">
                {tx('perLesson', { price: formatCurrency(price, currency) })}
              </span>
            )}
          </div>
        )
      },
    },
    {
      id: 'joined',
      header: () => <ColumnHeader k="joined" />,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">{dateFmt.format(new Date(row.original.joined_at))}</span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">{tx('action')}</span>,
      cell: ({ row }) => {
        const s = row.original
        const name = `${s.students.first_name} ${s.students.last_name}`
        return (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => setMoving({ studentId: s.student_id })}>
              <ArrowRightLeft /> <span className="hidden lg:inline">{tx('actions.move')}</span>
              <span className="sr-only lg:hidden">{tx('actions.move')}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() =>
                setExtending({
                  name,
                  studentId: s.student_id,
                  packages: typePackages(s).map((p) => ({
                    id: p.id,
                    name: p.packages?.name ?? '',
                    remaining: p.remaining_credits,
                    expireDate: p.expire_date?.slice(0, 10) ?? null,
                  })),
                })
              }
            >
              <CalendarPlus /> <span className="hidden lg:inline">{tx('actions.extend')}</span>
              <span className="sr-only lg:hidden">{tx('actions.extend')}</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive" disabled={busy} onClick={() => remove(s)}>
              <UserMinus /> <span className="hidden lg:inline">{tx('actions.remove')}</span>
              <span className="sr-only lg:hidden">{tx('actions.remove')}</span>
            </Button>
          </div>
        )
      },
    },
  ]

  const formerColumns: ColumnDef<FormerStudent>[] = [
    {
      id: 'name',
      header: () => <ColumnHeader k="studentName" />,
      cell: ({ row }) => nameCell(row.original.studentId, row.original.firstName, row.original.lastName, !row.original.isActive),
    },
    {
      id: 'left',
      header: () => <span>{tx('former.left')}</span>,
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="whitespace-nowrap">{dateFmt.format(new Date(row.original.leftAt))}</span>
          <p className="text-xs text-muted-foreground">
            {row.original.reason === 'moved' && row.original.movedTo ? (
              <>
                {tx('former.movedTo')}{' '}
                <Link href={`/dashboard/courses/${row.original.movedTo.id}`} className="text-primary hover:underline">
                  {row.original.movedTo.name}
                </Link>
              </>
            ) : (
              tx('former.removed')
            )}
          </p>
        </div>
      ),
    },
    {
      id: 'joined',
      header: () => <ColumnHeader k="joined" />,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {row.original.joinedAt ? dateFmt.format(new Date(row.original.joinedAt)) : '–'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">{tx('action')}</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => readd(row.original)}>
            <UserPlus /> {tx('former.readd')}
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
                f === 'low' && counts.low > 0 && 'text-warning',
                f === 'empty' && counts.empty > 0 && 'text-danger'
              )}
            >
              {counts[f]}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {filter === 'former' ? (
        <DataTable<FormerStudent, unknown>
          columns={formerColumns}
          data={former}
          loading={isLoading}
          enableSearch={false}
          enableFilters={false}
          enablePagination={false}
          emptyMessage={tx('emptyFilter.former')}
        />
      ) : (
        <DataTable<CourseStudent, unknown>
          columns={columns}
          data={groups[filter]}
          loading={isLoading}
          enableSearch={false}
          enableFilters={false}
          enablePagination={false}
          emptyMessage={students.length === 0 ? tx('empty') : tx(`emptyFilter.${filter}`)}
        />
      )}

      {moving && (
        <StudentCourseDialog
          studentId={moving.studentId}
          fromCourse={{ id: courseId, name: courseName }}
          open
          onOpenChange={(o) => !o && setMoving(null)}
          onDone={changed}
        />
      )}
      {extending && (
        <ExtendPackageDialog
          studentName={extending.name}
          studentId={extending.studentId}
          packages={extending.packages}
          open
          onOpenChange={(o) => !o && setExtending(null)}
          onDone={changed}
        />
      )}
    </div>
  )
}
