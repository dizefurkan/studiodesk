'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { changeMyPassword } from '@/lib/actions/settings.actions'
import { useServerAction } from '@/hooks/useServerAction'

export function ChangePasswordCard({
  title,
  description,
  onChanged,
}: {
  title?: string
  description?: string
  onChanged?: () => void
}) {
  const t = useTranslations('settings')
  const password = useServerAction()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const mismatch = confirm.length > 0 && next !== confirm

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (next !== confirm) {
          toast.error(t('accountForm.mismatch'))
          return
        }
        password.run(() => changeMyPassword({ currentPassword: current, newPassword: next }), {
          success: t('accountForm.passwordChanged'),
          onSuccess: () => {
            setCurrent('')
            setNext('')
            setConfirm('')
            onChanged?.()
          },
        })
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>{title ?? t('accountForm.passwordTitle')}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="pw-current">{t('accountForm.currentPassword')}</FieldLabel>
              <Input
                id="pw-current"
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="pw-new">{t('accountForm.newPassword')}</FieldLabel>
              <Input
                id="pw-new"
                type="password"
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                minLength={8}
                required
              />
              <FieldDescription>{t('accountForm.newPasswordHint')}</FieldDescription>
            </Field>
            <Field data-invalid={mismatch || undefined}>
              <FieldLabel htmlFor="pw-confirm">{t('accountForm.confirmPassword')}</FieldLabel>
              <Input
                id="pw-confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                aria-invalid={mismatch || undefined}
                required
              />
              {mismatch && <FieldError>{t('accountForm.mismatch')}</FieldError>}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={password.pending || mismatch}>
            {password.pending && <Spinner />}
            {t('accountForm.changePassword')}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
