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
import { useOrganizationPrefs } from '@/lib/context/OrganizationPrefsContext'
import { formatCurrency } from '@/lib/utils/format'
import { createPayout } from '@/lib/actions/instructor-pay.actions'
import { PAYOUT_METHODS } from '@/lib/earnings/constants'

/** Records a payment to an instructor (also written to the cash register as an expense). */
export function PayoutDialog({
  open,
  onOpenChange,
  instructor,
  balance,
  branches,
  defaultDate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  instructor: { id: string; name: string }
  balance: number
  branches: { id: string; name: string }[]
  /** yyyy-MM-dd */
  defaultDate: string
}) {
  const t = useTranslations('instructorPay')
  const tc = useTranslations('common')
  const { currency } = useOrganizationPrefs()
  const { pending, run } = useServerAction()
  const [amount, setAmount] = useState(balance > 0 ? String(balance) : '')
  const [date, setDate] = useState(defaultDate)
  const [branchId, setBranchId] = useState(branches.length === 1 ? branches[0].id : '')
  const [method, setMethod] = useState<string>('cash')
  const [note, setNote] = useState('')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="grid gap-6"
          onSubmit={(e) => {
            e.preventDefault()
            run(
              () =>
                createPayout({
                  instructorId: instructor.id,
                  branchId,
                  amount: Number(amount),
                  date,
                  method,
                  note,
                }),
              { success: t('payoutDialog.saved'), onSuccess: () => onOpenChange(false) }
            )
          }}
        >
          <DialogHeader>
            <DialogTitle>{t('payoutDialog.title')}</DialogTitle>
            <DialogDescription>{t('payoutDialog.description', { name: instructor.name })}</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="payout-amount">{t('payoutDialog.amount')}</FieldLabel>
              <Input
                id="payout-amount"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <FieldDescription>
                {t('payoutDialog.balanceHint', { amount: formatCurrency(balance, currency) })}
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel>{t('payoutDialog.date')}</FieldLabel>
              <DatePicker
                value={parse(date, 'yyyy-MM-dd', new Date())}
                onDateChange={(d) => setDate(format(d, 'yyyy-MM-dd'))}
                disabled={(d) => format(d, 'yyyy-MM-dd') > defaultDate}
                className="w-full"
              />
            </Field>
            <div className={branches.length > 1 ? 'grid gap-4 sm:grid-cols-2' : 'grid gap-4'}>
              {branches.length > 1 && (
              <Field>
                <FieldLabel htmlFor="payout-branch">{t('payoutDialog.branch')}</FieldLabel>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger id="payout-branch" className="w-full">
                    <SelectValue placeholder={t('payoutDialog.selectBranch')} />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              )}
              <Field>
                <FieldLabel htmlFor="payout-method">{t('payoutDialog.method')}</FieldLabel>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger id="payout-method" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYOUT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {t(`methods.${m}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="payout-note">{t('payoutDialog.note')}</FieldLabel>
              <Textarea
                id="payout-note"
                value={note}
                maxLength={500}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('payoutDialog.notePlaceholder')}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tc('cancel')}
            </Button>
            <Button type="submit" disabled={pending || !branchId || !(Number(amount) > 0)}>
              {pending && <Spinner />}
              {pending ? tc('saving') : t('payoutDialog.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
