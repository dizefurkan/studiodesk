'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { updateAttendanceSettings } from '@/lib/actions/settings.actions'
import { useServerAction } from '@/hooks/useServerAction'

interface Props {
  initial: { virtual_sessions_weeks: number; attendance_per_week_limit: number; allow_makeup_sessions: boolean }
  disabled: boolean
}

export function AttendanceSettingsForm({ initial, disabled }: Props) {
  const t = useTranslations('settings')
  const { pending, run } = useServerAction()
  const [weeks, setWeeks] = useState(String(initial.virtual_sessions_weeks))
  const [limit, setLimit] = useState(String(initial.attendance_per_week_limit))
  const [makeup, setMakeup] = useState(initial.allow_makeup_sessions)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        run(
          () =>
            updateAttendanceSettings({
              virtual_sessions_weeks: Number(weeks),
              attendance_per_week_limit: Number(limit),
              allow_makeup_sessions: makeup,
            }),
          { success: t('saved') }
        )
      }}
    >
      <Card>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="att-weeks">{t('attendanceForm.lookahead')}</FieldLabel>
              <Input
                id="att-weeks"
                type="number"
                min={1}
                max={52}
                value={weeks}
                onChange={(e) => setWeeks(e.target.value)}
                disabled={disabled}
                className="sm:max-w-40"
              />
              <FieldDescription>{t('attendanceForm.lookaheadHint')}</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="att-limit">{t('attendanceForm.weeklyLimit')}</FieldLabel>
              <Input
                id="att-limit"
                type="number"
                min={1}
                max={14}
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                disabled={disabled}
                className="sm:max-w-40"
              />
              <FieldDescription>{t('attendanceForm.weeklyLimitHint')}</FieldDescription>
            </Field>
            <FieldSeparator />
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="att-makeup">{t('attendanceForm.makeup')}</FieldLabel>
                <FieldDescription>{t('attendanceForm.makeupHint')}</FieldDescription>
              </FieldContent>
              <Switch id="att-makeup" checked={makeup} onCheckedChange={setMakeup} disabled={disabled} />
            </Field>
          </FieldGroup>
        </CardContent>
        {!disabled && (
          <CardFooter className="justify-end">
            <Button type="submit" disabled={pending}>
              {pending && <Spinner />}
              {t('save')}
            </Button>
          </CardFooter>
        )}
      </Card>
    </form>
  )
}
