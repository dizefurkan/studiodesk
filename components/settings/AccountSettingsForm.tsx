'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { updateMyProfile } from '@/lib/actions/settings.actions'
import { ChangePasswordCard } from '@/components/settings/ChangePasswordCard'
import { useServerAction } from '@/hooks/useServerAction'

export function AccountSettingsForm({ email, fullName: initialName }: { email: string; fullName: string }) {
  const t = useTranslations('settings')
  const profile = useServerAction()
  const [fullName, setFullName] = useState(initialName)

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

      <ChangePasswordCard />
    </div>
  )
}
