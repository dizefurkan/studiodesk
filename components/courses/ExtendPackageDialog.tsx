'use client'

import { useState, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Spinner } from '@/components/ui/spinner'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { DatePicker } from '@/components/common/DatePicker'
import { extendStudentPackage } from '@/lib/actions/students.actions'
import { addDaysToDateString, parseDateOnly } from '@/lib/i18n/dates'

export type ExtendablePackage = { id: string; name: string; remaining: number; expireDate: string | null }

const QUICK = [7, 14, 30] as const

/**
 * Extend a student's package for this class: push the end date out and/or add lessons
 * (e.g. after an illness or a cancelled week). Logged in the package history.
 */
export function ExtendPackageDialog({
  studentName,
  studentId,
  packages,
  open,
  onOpenChange,
  onDone,
}: {
  studentName: string
  studentId: string
  packages: ExtendablePackage[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onDone: () => void
}) {
  const t = useTranslations('courseStudents.extend')
  const locale = useLocale()
  const today = format(new Date(), 'yyyy-MM-dd')
  // Default to the package that ends first (or the only one)
  const sorted = [...packages].sort((a, b) => (a.expireDate ?? '9999').localeCompare(b.expireDate ?? '9999'))
  const [packageId, setPackageId] = useState(sorted[0]?.id ?? '')
  const [expireDate, setExpireDate] = useState<string | null>(null)
  const [quick, setQuick] = useState('')
  const [addCredits, setAddCredits] = useState('0')
  const [saving, startSaving] = useTransition()

  const selected = packages.find((p) => p.id === packageId)
  // Extensions count from the current end date, or from today if it already passed / has none
  const base = selected?.expireDate && selected.expireDate > today ? selected.expireDate : today
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })
  const credits = Math.max(0, Math.trunc(Number(addCredits) || 0))
  const canSave = !!selected && (!!expireDate || credits > 0)

  const save = () =>
    startSaving(async () => {
      const res = await extendStudentPackage({ studentPackageId: packageId, expireDate, addCredits: credits })
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success(t('saved', { name: studentName }))
      onOpenChange(false)
      onDone()
    })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description', { name: studentName })}</DialogDescription>
        </DialogHeader>

        {packages.length === 0 ? (
          <div className="space-y-3 py-2 text-sm text-muted-foreground">
            <p>{t('noPackage')}</p>
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/students/${studentId}?purchase=1`}>{t('sell')}</Link>
            </Button>
          </div>
        ) : (
          <FieldGroup>
            {packages.length > 1 && (
              <RadioGroup value={packageId} onValueChange={setPackageId} className="gap-2">
                {sorted.map((p) => (
                  <FieldLabel key={p.id} htmlFor={`pkg-${p.id}`}>
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>{p.name}</FieldTitle>
                        <FieldDescription>
                          {t('packageInfo', {
                            count: p.remaining,
                            date: p.expireDate ? dateFmt.format(parseDateOnly(p.expireDate)) : t('noEnd'),
                          })}
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value={p.id} id={`pkg-${p.id}`} />
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>
            )}
            {packages.length === 1 && selected && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{selected.name}</span>{' '}
                {t('packageInfo', {
                  count: selected.remaining,
                  date: selected.expireDate ? dateFmt.format(parseDateOnly(selected.expireDate)) : t('noEnd'),
                })}
              </p>
            )}

            <Field>
              <FieldLabel htmlFor="extend-date">{t('newEnd')}</FieldLabel>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={quick}
                onValueChange={(v) => {
                  setQuick(v)
                  setExpireDate(v ? addDaysToDateString(base, Number(v)) : null)
                }}
                className="flex-wrap"
              >
                {QUICK.map((d) => (
                  <ToggleGroupItem key={d} value={String(d)} className="px-3">
                    {t(`quick.${d}`)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <DatePicker
                id="extend-date"
                className="w-full"
                value={expireDate ? parseDateOnly(expireDate) : undefined}
                onDateChange={(d) => {
                  setQuick('')
                  setExpireDate(format(d, 'yyyy-MM-dd'))
                }}
                placeholder={t('pickDate')}
                disabled={(d) => format(d, 'yyyy-MM-dd') <= today}
              />
              <FieldDescription>{t('newEndHint')}</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="extend-credits">{t('addCredits')}</FieldLabel>
              <Input
                id="extend-credits"
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                value={addCredits}
                onChange={(e) => setAddCredits(e.target.value)}
                className="w-28"
              />
              <FieldDescription>{t('addCreditsHint')}</FieldDescription>
            </Field>
          </FieldGroup>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          {packages.length > 0 && (
            <Button onClick={save} disabled={!canSave || saving}>
              {saving && <Spinner />} {t('save')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
