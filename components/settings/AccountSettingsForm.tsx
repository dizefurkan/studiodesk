'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { changeMyPassword, updateMyProfile } from '@/lib/actions/settings.actions'
import { useServerAction } from '@/hooks/useServerAction'

export function AccountSettingsForm({ email, fullName: initialName }: { email: string; fullName: string }) {
  const t = useTranslations('settings')
  const profile = useServerAction()
  const password = useServerAction()
  const [fullName, setFullName] = useState(initialName)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const mismatch = confirm.length > 0 && next !== confirm

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          profile.run(() => updateMyProfile({ fullName }), { success: t('saved') })
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>{t('accountForm.profileTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="account-email">{t('accountForm.email')}</FieldLabel>
                <Input id="account-email" value={email} disabled />
              </Field>
              <Field>
                <FieldLabel htmlFor="account-name">{t('accountForm.fullName')}</FieldLabel>
                <Input id="account-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={profile.pending}>
              {profile.pending && <Spinner />}
              {t('save')}
            </Button>
          </CardFooter>
        </Card>
      </form>

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
            },
          })
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>{t('accountForm.passwordTitle')}</CardTitle>
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
    </div>
  )
}
