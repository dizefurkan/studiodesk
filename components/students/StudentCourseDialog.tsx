'use client'

import { useEffect, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from '@/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Spinner } from '@/components/ui/spinner'
import { useLocaleNames } from '@/hooks/useLocaleNames'
import { formatTime } from '@/lib/utils/formatTime'
import {
  addStudentToCourse,
  getCourseOptionsForStudent,
  moveStudentToCourse,
} from '@/lib/actions/course-students.actions'
import type { ActionData } from '@/lib/types/actions'

type CourseOption = ActionData<typeof getCourseOptionsForStudent>[number]

/**
 * Pick a class for the student: either to add them to it, or to move them there from
 * `fromCourse`. Classes sharing a label (e.g. level) with the student come first.
 */
export function StudentCourseDialog({
  studentId,
  fromCourse,
  open,
  onOpenChange,
  onDone,
}: {
  studentId: string
  /** Set to move the student out of this class; omit to just add a class */
  fromCourse?: { id: string; name: string }
  open: boolean
  onOpenChange: (open: boolean) => void
  onDone: () => void
}) {
  const t = useTranslations('studentCourses.change')
  const { DAYS } = useLocaleNames()
  const [options, setOptions] = useState<CourseOption[] | null>(null)
  const [selected, setSelected] = useState('')
  const [loading, startLoading] = useTransition()
  const [saving, startSaving] = useTransition()

  useEffect(() => {
    if (!open) return
    startLoading(async () => {
      const res = await getCourseOptionsForStudent(studentId)
      if (res.error) toast.error(res.error)
      setOptions(res.data ?? [])
    })
  }, [open, studentId])

  const choices = (options ?? [])
    .filter((c) => !c.enrolled)
    .sort((a, b) => b.matchingLabels.length - a.matchingLabels.length)

  const save = () =>
    startSaving(async () => {
      const res = fromCourse
        ? await moveStudentToCourse(studentId, fromCourse.id, selected)
        : await addStudentToCourse(selected, studentId)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success(fromCourse ? t('moved') : t('added'))
      onOpenChange(false)
      onDone()
    })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{fromCourse ? t('moveTitle') : t('addTitle')}</DialogTitle>
          <DialogDescription>
            {fromCourse ? t('moveDescription', { course: fromCourse.name }) : t('addDescription')}
          </DialogDescription>
        </DialogHeader>

        {loading || !options ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : choices.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t('noCourses')}</p>
        ) : (
          <RadioGroup value={selected} onValueChange={setSelected} className="max-h-[50vh] gap-2 overflow-y-auto">
            {choices.map((c) => (
              <FieldLabel key={c.id} htmlFor={`course-${c.id}`}>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle className="flex flex-wrap items-center gap-1.5">
                      {c.name}
                      {c.matchingLabels.map((l) => (
                        <Badge key={l} variant="secondary" className="font-normal">
                          {l}
                        </Badge>
                      ))}
                    </FieldTitle>
                    <FieldDescription>
                      {[
                        `${DAYS[c.dayOfWeek]} ${formatTime(c.startTime)}–${formatTime(c.endTime)}`,
                        c.branchName,
                        c.danceTypeName,
                        t('students', { count: c.studentCount }),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </FieldDescription>
                    {!c.hasCredits && <FieldDescription className="text-warning">{t('noCredits')}</FieldDescription>}
                  </FieldContent>
                  <RadioGroupItem value={c.id} id={`course-${c.id}`} />
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={save} disabled={!selected || saving}>
            {saving && <Spinner />} {fromCourse ? t('move') : t('add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
