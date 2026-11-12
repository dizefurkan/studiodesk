'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { updatePermissionSettings } from '@/lib/actions/settings.actions'
import { useServerAction } from '@/hooks/useServerAction'

type Perms = { allow_manager_invite: boolean; allow_role_change: boolean; allow_member_delete: boolean }

const ITEMS: { key: keyof Perms; label: string; hint: string }[] = [
  { key: 'allow_manager_invite', label: 'managerInvite', hint: 'managerInviteHint' },
  { key: 'allow_role_change', label: 'roleChange', hint: 'roleChangeHint' },
  { key: 'allow_member_delete', label: 'memberDelete', hint: 'memberDeleteHint' },
]

export function PermissionSettingsForm({ initial }: { initial: Perms }) {
  const t = useTranslations('settings')
  const { pending, run } = useServerAction()
  const [perms, setPerms] = useState<Perms>(initial)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        run(() => updatePermissionSettings(perms), { success: t('saved') })
      }}
    >
      <Card>
        <CardContent>
          <FieldGroup>
            {ITEMS.map((item, i) => (
              <div key={item.key} className="contents">
                {i > 0 && <FieldSeparator />}
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldLabel htmlFor={item.key}>{t(`permissionsForm.${item.label}`)}</FieldLabel>
                    <FieldDescription>{t(`permissionsForm.${item.hint}`)}</FieldDescription>
                  </FieldContent>
                  <Switch
                    id={item.key}
                    checked={perms[item.key]}
                    onCheckedChange={(v) => setPerms((p) => ({ ...p, [item.key]: v }))}
                  />
                </Field>
              </div>
            ))}
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={pending}>
            {pending && <Spinner />}
            {t('save')}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
