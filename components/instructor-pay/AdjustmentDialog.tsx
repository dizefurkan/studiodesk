'use client'

import { useState } from 'react'
import { format, parse } from 'date-fns'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/common/DatePicker'
import { useServerAction } from '@/hooks/useServerAction'
import { createAdjustment } from '@/lib/actions/instructor-pay.actions'
import { ADJUSTMENT_KINDS } from '@/lib/earnings/constants'

/** Adds a bonus, deduction, private lesson, travel or other item to an instructor's pay. */
export function AdjustmentDialog({
  open,
  onOpenChange,
  instructor,
  defaultDate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  instructor: { id: string; name: string }
  /** yyyy-MM-dd */
  defaultDate: string
}) {
  const t = useTranslations('instructorPay')
  const tc = useTranslations('common')
  const { pending, run } = useServerAction()
  const [kind, setKind] = useState<string>('bonus')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [description, setDescription] = useState('')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="grid gap-6"
          onSubmit={(e) => {
            e.preventDefault()
            run(
              () => createAdjustment({ instructorId: instructor.id, kind, amount: Number(amount), date, description }),
              { success: t('adjustmentDialog.saved'), onSuccess: () => onOpenChange(false) }
            )
          }}
        >
          <DialogHeader>
            <DialogTitle>{t('adjustmentDialog.title')}</DialogTitle>
            <DialogDescription>{t('adjustmentDialog.description', { name: instructor.name })}</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="adjustment-kind">{t('adjustmentDialog.kind')}</FieldLabel>
                <Select value={kind} onValueChange={setKind}>
                  <SelectTrigger id="adjustment-kind" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADJUSTMENT_KINDS.map((k) => (
                      <SelectItem key={k} value={k}>
                        {t(`kinds.${k}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="adjustment-amount">{t('adjustmentDialog.amount')}</FieldLabel>
                <Input
                  id="adjustment-amount"
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </Field>
            </div>
            {kind === 'deduction' && <FieldDescription>{t('adjustmentDialog.deductionHint')}</FieldDescription>}
            <Field>
              <FieldLabel>{t('adjustmentDialog.date')}</FieldLabel>
              <DatePicker
                value={parse(date, 'yyyy-MM-dd', new Date())}
                onDateChange={(d) => setDate(format(d, 'yyyy-MM-dd'))}
                className="w-full"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="adjustment-description">{t('adjustmentDialog.descriptionLabel')}</FieldLabel>
              <Textarea
                id="adjustment-description"
                value={description}
                maxLength={500}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('adjustmentDialog.descriptionPlaceholder')}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tc('cancel')}
            </Button>
            <Button type="submit" disabled={pending || !(Number(amount) > 0)}>
              {pending && <Spinner />}
              {pending ? tc('saving') : tc('add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
