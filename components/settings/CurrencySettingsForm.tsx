'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from '@/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Spinner } from '@/components/ui/spinner'
import { SUPPORTED_CURRENCIES } from '@/config/currencies'
import { updateCurrencySetting } from '@/lib/actions/settings.actions'
import { useServerAction } from '@/hooks/useServerAction'

export function CurrencySettingsForm({ current, disabled }: { current: string; disabled: boolean }) {
  const t = useTranslations('settings')
  const { pending, run } = useServerAction()
  const [currency, setCurrency] = useState(current)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        run(() => updateCurrencySetting(currency), { success: t('saved') })
      }}
    >
      <Card>
        <CardContent>
          <RadioGroup
            value={currency}
            onValueChange={setCurrency}
            disabled={disabled}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <FieldLabel key={c.code} htmlFor={`currency-${c.code}`}>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>
                      <span aria-hidden>{c.flag}</span> {c.code}
                    </FieldTitle>
                    <FieldDescription>{c.name}</FieldDescription>
                  </FieldContent>
                  <RadioGroupItem value={c.code} id={`currency-${c.code}`} />
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
        </CardContent>
        {!disabled && (
          <CardFooter className="justify-end">
            <Button type="submit" disabled={pending || currency === current}>
              {pending && <Spinner />}
              {t('save')}
            </Button>
          </CardFooter>
        )}
      </Card>
    </form>
  )
}
