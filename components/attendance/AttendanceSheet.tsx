'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Check, ChevronDown, MessageSquare, Search, UserRoundPlus, X } from 'lucide-react'
import { Link, useRouter } from '@/i18n/navigation'
import { recordBatchAttendance } from '@/lib/actions/attendance.actions'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { InstructorSelector } from './InstructorSelector'
import { StudioDropdown, type Studio } from './StudioDropdown'

type Person = { id: string; first_name: string; last_name: string }

export interface SheetStudent extends Person {
  /** Remaining credits for this course's dance type */
  credits: number
  /** Package the credit is taken from (null = no usable package) */
  packageId: string | null
}

type Status = 'present' | 'absent'

interface Mark {
  status?: Status
  note: string
  deductCredit: boolean
}

interface AttendanceSheetProps {
  courseId: string
  danceTypeId: string
  date: string
  students: SheetStudent[]
  studios: Studio[]
  instructors: Person[]
  allInstructors: Person[]
  instructorRates: Array<{ instructor_id: string; dance_type_id: string; ratio_per_class: number }>
}

const SEARCH_THRESHOLD = 8

/**
 * Take attendance for one course on one day. Mobile first: one row per student with a
 * two-button present/absent toggle, a sticky save bar, and the rarely-used options
 * (studio, substitute instructor, notes, "don't take a credit") folded away.
 */
export function AttendanceSheet({
  courseId,
  danceTypeId,
  date,
  students,
  studios,
  instructors,
  allInstructors,
  instructorRates,
}: AttendanceSheetProps) {
  const tx = useTranslations('attendanceSheet')
  const router = useRouter()

  const [marks, setMarks] = useState<Record<string, Mark>>({})
  const [openNotes, setOpenNotes] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [studioId, setStudioId] = useState<string | null>(studios.length === 1 ? studios[0].id : null)
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [replacing, setReplacing] = useState<string | null>(null)
  const [showOptions, setShowOptions] = useState(false)
  const [lessonNote, setLessonNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const withCredits = useMemo(() => students.filter((s) => s.packageId && s.credits > 0), [students])
  const withoutCredits = useMemo(() => students.filter((s) => !s.packageId || s.credits <= 0), [students])

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase()
    if (!q) return withCredits
    return withCredits.filter((s) => `${s.first_name} ${s.last_name}`.toLocaleLowerCase().includes(q))
  }, [withCredits, query])

  const markOf = (id: string): Mark => marks[id] ?? { note: '', deductCredit: true }
  const update = (id: string, patch: Partial<Mark>) =>
    setMarks((prev) => ({ ...prev, [id]: { ...markOf(id), ...patch } }))

  const setAll = (status: Status) =>
    setMarks((prev) => {
      const next = { ...prev }
      for (const s of withCredits) next[s.id] = { ...(prev[s.id] ?? { note: '', deductCredit: true }), status }
      return next
    })

  const toggleNote = (id: string) =>
    setOpenNotes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const presentCount = withCredits.filter((s) => marks[s.id]?.status === 'present').length
  const absentCount = withCredits.filter((s) => marks[s.id]?.status === 'absent').length
  const unmarked = withCredits.length - presentCount - absentCount

  const nameOf = (id: string) => {
    const p = allInstructors.find((i) => i.id === id) ?? instructors.find((i) => i.id === id)
    return p ? `${p.first_name} ${p.last_name}` : ''
  }

  const save = async () => {
    setError('')
    if (unmarked > 0) {
      setError(tx('markEveryone', { count: unmarked }))
      return
    }
    setSaving(true)
    try {
      const batch = withCredits.map((s) => {
        const m = markOf(s.id)
        return {
          studentId: s.id,
          studentPackageId: s.packageId ?? '',
          status: m.status === 'present' ? ('geldi' as const) : ('gelmedi' as const),
          notes: m.note.trim() || undefined,
          deductCredits: m.deductCredit,
        }
      })
      const result = await recordBatchAttendance(
        courseId,
        '',
        batch,
        studioId,
        instructors.map((i) => overrides[i.id] ?? i.id),
        date,
        lessonNote.trim() || null
      )
      if (result.error) {
        setError(result.error)
        return
      }
      toast.success(tx('saved', { present: presentCount, absent: absentCount }))
      router.refresh()
    } catch {
      setError(tx('saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  if (students.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="font-medium text-foreground">{tx('noStudentsTitle')}</p>
        <p className="mt-1 text-sm text-muted-foreground">{tx('noStudentsDescription')}</p>
        <Button asChild variant="outline" className="mx-auto mt-4">
          <Link href={`/dashboard/courses/${courseId}`}>
            <UserRoundPlus /> {tx('addStudents')}
          </Link>
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Session options: who teaches, which room, a note for the lesson */}
      <Card className="gap-0 p-0">
        <button
          type="button"
          onClick={() => setShowOptions((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          aria-expanded={showOptions}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{tx('sessionDetails')}</p>
            <p className="truncate text-xs text-muted-foreground">
              {[
                instructors.map((i) => nameOf(overrides[i.id] ?? i.id)).join(', ') || tx('noInstructor'),
                studios.find((s) => s.id === studioId)?.name,
              ]
                .filter(Boolean)
                .join(' • ')}
            </p>
          </div>
          <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', showOptions && 'rotate-180')} />
        </button>

        {showOptions && (
          <div className="space-y-4 border-t border-border px-4 py-4">
            {instructors.length > 0 && (
              <div className="space-y-2">
                <Label>{tx('instructors')}</Label>
                <div className="space-y-2">
                  {instructors.map((ins) => {
                    const replacement = overrides[ins.id]
                    return (
                      <div key={ins.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                        <div className="min-w-0 text-sm">
                          <p className="truncate font-medium text-foreground">{nameOf(replacement ?? ins.id)}</p>
                          {replacement && (
                            <p className="truncate text-xs text-muted-foreground">
                              {tx('substituteFor', { name: `${ins.first_name} ${ins.last_name}` })}
                            </p>
                          )}
                        </div>
                        {replacement ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setOverrides((prev) => {
                                const next = { ...prev }
                                delete next[ins.id]
                                return next
                              })
                            }
                          >
                            {tx('undoSubstitute')}
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => setReplacing(ins.id)}>
                            {tx('substitute')}
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {studios.length > 0 && (
              <div className="space-y-2">
                <Label>{tx('studio')}</Label>
                <StudioDropdown studios={studios} selectedStudioId={studioId} onSelect={setStudioId} />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="lesson-note">{tx('lessonNote')}</Label>
              <Textarea
                id="lesson-note"
                rows={2}
                value={lessonNote}
                onChange={(e) => setLessonNote(e.target.value)}
                placeholder={tx('lessonNotePlaceholder')}
              />
            </div>
          </div>
        )}
      </Card>

      {replacing && (
        <InstructorSelector
          instructors={instructors}
          allInstructors={allInstructors}
          instructorRates={instructorRates}
          danceTypeId={danceTypeId}
          editingInstructorId={replacing}
          selectedReplacementId={overrides[replacing]}
          instructorOverrides={overrides}
          onSave={(id) => {
            setOverrides((prev) => ({ ...prev, [replacing]: id }))
            setReplacing(null)
          }}
          onClose={() => setReplacing(null)}
        />
      )}

      {/* Toolbar */}
      {withCredits.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {withCredits.length > SEARCH_THRESHOLD ? (
            <InputGroup className="sm:max-w-xs">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tx('searchPlaceholder')}
              />
            </InputGroup>
          ) : (
            <p className="text-sm text-muted-foreground">{tx('studentCount', { count: withCredits.length })}</p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => setAll('present')}>
              <Check /> {tx('allPresent')}
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 sm:flex-none" onClick={() => setMarks({})}>
              {tx('clear')}
            </Button>
          </div>
        </div>
      )}

      {/* Students */}
      {withCredits.length > 0 && (
        <Card className="gap-0 divide-y divide-border p-0">
          {visible.map((s) => {
            const m = markOf(s.id)
            const notesOpen = openNotes.has(s.id)
            return (
              <div
                key={s.id}
                className={cn(
                  'px-3 py-3 sm:px-4',
                  m.status === 'present' && 'bg-green-50/60 dark:bg-green-950/20',
                  m.status === 'absent' && 'bg-red-50/60 dark:bg-red-950/20'
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/students/${s.id}`}
                      className="block truncate font-medium text-foreground hover:text-primary"
                    >
                      {s.first_name} {s.last_name}
                    </Link>
                    <p className={cn('text-xs', s.credits <= 1 ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground')}>
                      {tx('creditsLeft', { count: s.credits })}
                      {(m.note || !m.deductCredit) && (
                        <span className="text-muted-foreground">
                          {!m.deductCredit && ` • ${tx('noCreditTaken')}`}
                          {m.note && ` • ${m.note}`}
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn('shrink-0', (notesOpen || m.note || !m.deductCredit) && 'text-primary')}
                    onClick={() => toggleNote(s.id)}
                    aria-label={tx('moreOptions')}
                    aria-expanded={notesOpen}
                  >
                    <MessageSquare />
                  </Button>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    spacing={0}
                    value={m.status ?? ''}
                    onValueChange={(v) => update(s.id, { status: (v || undefined) as Status | undefined })}
                    className="shrink-0"
                    aria-label={tx('statusFor', { name: `${s.first_name} ${s.last_name}` })}
                  >
                    <ToggleGroupItem
                      value="present"
                      className="h-10 px-3 data-[state=on]:border-green-600 data-[state=on]:bg-green-600 data-[state=on]:text-white"
                      aria-label={tx('present')}
                    >
                      <Check />
                      <span className="hidden sm:inline">{tx('present')}</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="absent"
                      className="h-10 px-3 data-[state=on]:border-red-600 data-[state=on]:bg-red-600 data-[state=on]:text-white"
                      aria-label={tx('absent')}
                    >
                      <X />
                      <span className="hidden sm:inline">{tx('absent')}</span>
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                {notesOpen && (
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Input
                      value={m.note}
                      onChange={(e) => update(s.id, { note: e.target.value })}
                      placeholder={tx('notePlaceholder')}
                      className="sm:flex-1"
                    />
                    <Label className="flex items-center gap-2 text-sm font-normal">
                      <Switch checked={m.deductCredit} onCheckedChange={(v) => update(s.id, { deductCredit: v })} />
                      {tx('takeCredit')}
                    </Label>
                  </div>
                )}
              </div>
            )
          })}
          {visible.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">{tx('noMatch')}</p>
          )}
        </Card>
      )}

      {/* Students who can't be marked until they buy a package */}
      {withoutCredits.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {tx('noCreditsTitle', { count: withoutCredits.length })}
          </h2>
          <Card className="gap-0 divide-y divide-border p-0">
            {withoutCredits.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
                <span className="truncate text-sm text-foreground">
                  {s.first_name} {s.last_name}
                </span>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/students/${s.id}?purchase=1`}>{tx('sellPackage')}</Link>
                </Button>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Sticky save bar */}
      {withCredits.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:left-64">
          <div className="mx-auto flex max-w-4xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              {error ? (
                <p className="text-destructive">{error}</p>
              ) : (
                <p className="text-muted-foreground">
                  <span className="font-medium text-green-700 dark:text-green-400">{tx('presentCount', { count: presentCount })}</span>
                  {' • '}
                  <span className="font-medium text-red-700 dark:text-red-400">{tx('absentCount', { count: absentCount })}</span>
                  {unmarked > 0 && ` • ${tx('unmarkedCount', { count: unmarked })}`}
                </p>
              )}
            </div>
            <Button onClick={save} disabled={saving || unmarked > 0} size="lg" className="w-full sm:w-auto">
              {saving ? tx('saving') : tx('save')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
