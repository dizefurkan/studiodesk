'use client'

import { Link, useRouter } from '@/i18n/navigation'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { SUPPORTED_CURRENCIES } from '@/config/currencies'
import { createStore } from '@/lib/actions/backoffice.actions'
import { useServerAction } from '@/hooks/useServerAction'
import { BusinessTypeSelect } from '@/components/business/BusinessTypeSelect'
import type { BusinessType } from '@/lib/business/types'

export function CreateStoreForm({ accounts }: { accounts: { id: string; label: string }[] }) {
  const t = useTranslations('backoffice')
  const router = useRouter()
  const { pending, run } = useServerAction()
  const [name, setName] = useState('')
  const [branchName, setBranchName] = useState('')
  const [ownerUserId, setOwnerUserId] = useState('')
  const [currency, setCurrency] = useState('TRY')
  const [businessType, setBusinessType] = useState<BusinessType>('dance')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        run(async () => {
          const res = await createStore({ name, branchName, ownerUserId, currency, businessType })
          if (res.data) router.push(`/backoffice/stores/${res.data.id}`)
          return res
        })
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="store-name">{t('stores.name')}</FieldLabel>
          <Input id="store-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
        </Field>
        <Field>
          <FieldLabel htmlFor="store-branch">{t('stores.firstBranch')}</FieldLabel>
          <Input id="store-branch" value={branchName} onChange={(e) => setBranchName(e.target.value)} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="store-owner">{t('stores.owner')}</FieldLabel>
          <Select value={ownerUserId} onValueChange={setOwnerUserId} disabled={accounts.length === 0}>
            <SelectTrigger id="store-owner" className="w-full">
              <SelectValue placeholder={t('stores.selectOwner')} />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {accounts.length === 0 && (
            <FieldDescription>
              {t('stores.noAccounts')} <Link href="/backoffice/accounts">{t('nav.accounts')}</Link>
            </FieldDescription>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="store-business-type">{t('stores.businessType')}</FieldLabel>
          <BusinessTypeSelect id="store-business-type" value={businessType} onValueChange={setBusinessType} />
        </Field>
        <Field>
          <FieldLabel htmlFor="store-currency">{t('stores.currency')}</FieldLabel>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger id="store-currency" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field orientation="horizontal">
          <Button type="submit" disabled={pending || !ownerUserId}>
            {pending && <Spinner />}
            {pending ? t('common.saving') : t('stores.create')}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/backoffice/stores">{t('common.cancel')}</Link>
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
