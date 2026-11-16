'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { TIMEZONES } from '@/config/timezones'
import { updateGeneralSettings } from '@/lib/actions/settings.actions'
import { useServerAction } from '@/hooks/useServerAction'
import { BusinessTypeSelect } from '@/components/business/BusinessTypeSelect'
import type { BusinessType } from '@/lib/business/types'

interface Props {
  initial: { name: string; timezone: string; week_start_day: number; business_type: BusinessType }
  disabled: boolean
}

export function GeneralSettingsForm({ initial, disabled }: Props) {
  const t = useTranslations('settings')
  const { pending, run } = useServerAction()
  const [name, setName] = useState(initial.name)
  const [timezone, setTimezone] = useState(initial.timezone)
  const [weekStart, setWeekStart] = useState(String(initial.week_start_day))
  const [businessType, setBusinessType] = useState<BusinessType>(initial.business_type)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        run(() => updateGeneralSettings({ name, timezone, week_start_day: Number(weekStart), business_type: businessType }), {
          success: t('saved'),
        })
      }}
    >
      <Card>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="org-name">{t('generalForm.name')}</FieldLabel>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                disabled={disabled}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="org-business-type">{t('generalForm.businessType')}</FieldLabel>
              <BusinessTypeSelect
                id="org-business-type"
                value={businessType}
                onValueChange={setBusinessType}
                disabled={disabled}
              />
              <FieldDescription>{t('generalForm.businessTypeHint')}</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="org-timezone">{t('generalForm.timezone')}</FieldLabel>
              <Select value={timezone} onValueChange={setTimezone} disabled={disabled}>
                <SelectTrigger id="org-timezone" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>{t('generalForm.timezoneHint')}</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="org-week-start">{t('generalForm.weekStart')}</FieldLabel>
              <Select value={weekStart} onValueChange={setWeekStart} disabled={disabled}>
                <SelectTrigger id="org-week-start" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {t(`days.${d}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>{t('generalForm.weekStartHint')}</FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
        {!disabled && (
          <CardFooter className="justify-end">
            <Button type="submit" disabled={pending}>
              {pending && <Spinner />}
              {pending ? t('saving') : t('save')}
            </Button>
          </CardFooter>
        )}
      </Card>
    </form>
  )
}
