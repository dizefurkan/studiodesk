'use client'

import { useState } from 'react'
import { format, parse } from 'date-fns'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { DatePicker } from '@/components/common/DatePicker'
import { useServerAction } from '@/hooks/useServerAction'
import { toDateString } from '@/lib/i18n/dates'
import { createInstructorRate, saveRateVersion } from '@/lib/actions/instructor-rates.actions'
import { PAY_MODELS } from '@/lib/earnings/payModels'
import type { InstructorRate } from './types'

type Option = { id: string; name: string }

interface InstructorRateFormProps {
  instructors: Array<{ id: string; first_name: string; last_name: string }>
  branches: Option[]
  danceTypes: Option[]
  rates: InstructorRate[]
  /** Set: add a new pay period to this rate. Unset: create a rate. */
  rate?: InstructorRate
  selectedInstructorId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function InstructorRateForm({
  instructors,
  branches,
  danceTypes,
  rates,
  rate,
  selectedInstructorId,
  onSuccess,
  onCancel,
}: InstructorRateFormProps) {
  const tx = useTranslations('instructorRateForm')
  const tp = useTranslations('instructorPay')
  const tf = useTranslations('forms')
  const { pending, run } = useServerAction()

  const [instructorId, setInstructorId] = useState(rate?.instructors.id ?? selectedInstructorId ?? '')
  const [branchId, setBranchId] = useState(rate?.branches?.id ?? '')
  const [danceTypeId, setDanceTypeId] = useState(rate?.dance_types?.id ?? '')
  const [payModel, setPayModel] = useState<string>(rate?.pay_model ?? 'percentage')
  const [ratio, setRatio] = useState(rate && rate.pay_model === 'percentage' ? String(rate.ratio_per_class) : '')
  const [amount, setAmount] = useState(rate?.amount ? String(rate.amount) : '')
  const [minAmount, setMinAmount] = useState(rate?.min_amount ? String(rate.min_amount) : '')
  // A new rate applies to every lesson unless a start date is chosen; a new period always has one
  const [dated, setDated] = useState(!!rate)
  const [effectiveFrom, setEffectiveFrom] = useState(toDateString())

  // Dance types that already have a rate for this instructor at this branch
  const taken = new Set(
    rates.filter((r) => r.instructors.id === instructorId && r.branches?.id === branchId).map((r) => r.dance_types?.id)
  )
  const availableDanceTypes = rate ? danceTypes : danceTypes.filter((d) => !taken.has(d.id))

  const valid =
    (rate || (instructorId && branchId && danceTypeId)) &&
    (payModel === 'percentage' ? Number(ratio) > 0 && Number(ratio) <= 100 : Number(amount) > 0)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const terms = {
      payModel,
      ratio: payModel === 'percentage' ? Number(ratio) : null,
      amount: payModel === 'percentage' ? null : Number(amount),
      minAmount: minAmount ? Number(minAmount) : null,
      effectiveFrom: dated ? effectiveFrom : null,
    }
    run(
      () => (rate ? saveRateVersion(rate.id, terms) : createInstructorRate({ instructorId, branchId, danceTypeId, terms })),
      { success: tx('saved'), onSuccess }
    )
  }

  return (
    <form onSubmit={submit} className="grid gap-6">
      <FieldGroup>
        {rate ? (
          <p className="text-sm text-muted-foreground">
            {rate.instructors.first_name} {rate.instructors.last_name} · {rate.branches?.name} · {rate.dance_types?.name}
          </p>
        ) : (
          <>
            <Field>
              <FieldLabel htmlFor="rate-instructor">{tx('instructor')}</FieldLabel>
              <Select value={instructorId} onValueChange={setInstructorId} disabled={!!selectedInstructorId}>
                <SelectTrigger id="rate-instructor" className="w-full">
                  <SelectValue placeholder={tx('selectInstructor')} />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.first_name} {i.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="rate-branch">{tx('branch')}</FieldLabel>
                <Select
                  value={branchId}
                  onValueChange={(v) => {
                    setBranchId(v)
                    setDanceTypeId('')
                  }}
                >
                  <SelectTrigger id="rate-branch" className="w-full">
                    <SelectValue placeholder={tx('selectBranch')} />
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
              <Field>
                <FieldLabel htmlFor="rate-dance-type">{tx('danceType')}</FieldLabel>
                <Select value={danceTypeId} onValueChange={setDanceTypeId} disabled={!branchId}>
                  <SelectTrigger id="rate-dance-type" className="w-full">
                    <SelectValue placeholder={tx('selectDanceType')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDanceTypes.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </>
        )}

        <Field>
          <FieldLabel htmlFor="rate-model">{tx('payModel')}</FieldLabel>
          <Select value={payModel} onValueChange={setPayModel}>
            <SelectTrigger id="rate-model" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAY_MODELS.map((m) => (
                <SelectItem key={m} value={m}>
                  {tp(`models.${m}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>{tp(`modelHints.${payModel}`)}</FieldDescription>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          {payModel === 'percentage' ? (
            <Field>
              <FieldLabel htmlFor="rate-ratio">{tx('ratio')}</FieldLabel>
              <Input
                id="rate-ratio"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                max="100"
                value={ratio}
                onChange={(e) => setRatio(e.target.value)}
                required
              />
            </Field>
          ) : (
            <Field>
              <FieldLabel htmlFor="rate-amount">{tx(`amountLabels.${payModel}`)}</FieldLabel>
              <Input
                id="rate-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </Field>
          )}
          <Field>
            <FieldLabel htmlFor="rate-min">{tx('minAmount')}</FieldLabel>
            <Input
              id="rate-min"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder={tx('optional')}
            />
          </Field>
        </div>
        <FieldDescription>{tx('minAmountHint')}</FieldDescription>

        {!rate && (
          <Field orientation="horizontal">
            <Switch id="rate-dated" checked={dated} onCheckedChange={setDated} />
            <FieldContent>
              <FieldLabel htmlFor="rate-dated">{tx('startOnDate')}</FieldLabel>
              <FieldDescription>{tx('alwaysHint')}</FieldDescription>
            </FieldContent>
          </Field>
        )}
        {dated && (
          <Field>
            <FieldLabel>{tx('effectiveFrom')}</FieldLabel>
            <DatePicker
              value={parse(effectiveFrom, 'yyyy-MM-dd', new Date())}
              onDateChange={(d) => setEffectiveFrom(format(d, 'yyyy-MM-dd'))}
              className="w-full"
            />
            <FieldDescription>{tx('effectiveFromHint')}</FieldDescription>
          </Field>
        )}
      </FieldGroup>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          {tf('cancel')}
        </Button>
        <Button type="submit" disabled={pending || !valid}>
          {pending && <Spinner />}
          {pending ? tf('saving') : rate ? tx('saveVersion') : tx('add')}
        </Button>
      </div>
    </form>
  )
}
