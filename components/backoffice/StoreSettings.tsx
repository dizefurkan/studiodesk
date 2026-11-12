'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { SUPPORTED_CURRENCIES } from '@/config/currencies'
import { TIMEZONES } from '@/config/timezones'
import { setStoreActive, updateStore } from '@/lib/actions/backoffice.actions'
import { useServerAction } from '@/hooks/useServerAction'

interface Props {
  store: { id: string; name: string; currency: string | null; timezone: string | null; is_active: boolean }
}

export function StoreSettings({ store }: Props) {
  const t = useTranslations('backoffice')
  const confirm = useConfirm()
  const save = useServerAction()
  const toggle = useServerAction()
  const [name, setName] = useState(store.name)
  const [currency, setCurrency] = useState(store.currency || 'TRY')
  const [timezone, setTimezone] = useState(store.timezone || 'Europe/Istanbul')

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save.run(() => updateStore(store.id, { name, currency, timezone }), { success: t('common.saved') })
        }}
      >
        <FieldGroup className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="bo-store-name">{t('stores.name')}</FieldLabel>
            <Input id="bo-store-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
          </Field>
          <Field>
            <FieldLabel htmlFor="bo-store-currency">{t('stores.currency')}</FieldLabel>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="bo-store-currency" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="bo-store-tz">{t('stores.timezone')}</FieldLabel>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="bo-store-tz" className="w-full">
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
          </Field>
          <Field orientation="horizontal" className="sm:col-span-3">
            <Button type="submit" disabled={save.pending}>
              {save.pending && <Spinner />}
              {save.pending ? t('common.saving') : t('common.save')}
            </Button>
          </Field>
        </FieldGroup>
      </form>

      <Item variant="outline">
        <ItemContent>
          <ItemTitle>
            {t('stores.status')}
            <Badge variant={store.is_active ? 'secondary' : 'destructive'}>
              {store.is_active ? t('stores.active') : t('stores.suspended')}
            </Badge>
          </ItemTitle>
          <ItemDescription>{t('stores.suspendHint')}</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button
            variant={store.is_active ? 'destructive' : 'outline'}
            disabled={toggle.pending}
            onClick={async () => {
              if (store.is_active && !(await confirm({ title: t('stores.suspendConfirm'), destructive: true, confirmLabel: t('stores.suspend') })))
                return
              toggle.run(() => setStoreActive(store.id, !store.is_active))
            }}
          >
            {toggle.pending && <Spinner />}
            {store.is_active ? t('stores.suspend') : t('stores.activate')}
          </Button>
        </ItemActions>
      </Item>
    </div>
  )
}
