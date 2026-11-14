import { redirect } from '@/i18n/navigation'
import { getLocale } from 'next-intl/server'
import { getSettingsContext } from '@/lib/actions/settings.actions'
import { SettingsHeader } from '@/components/settings/SettingsHeader'
import { ReadOnlyNotice } from '@/components/settings/ReadOnlyNotice'
import { CurrencySettingsForm } from '@/components/settings/CurrencySettingsForm'
import { DEFAULT_CURRENCY } from '@/config/currencies'

export default async function CurrencySettingsPage() {
  const ctx = await getSettingsContext()
  if (!ctx) redirect({ href: '/login', locale: await getLocale() })
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SettingsHeader section="currency" />
      {!ctx.canEditOrganization && <ReadOnlyNotice />}
      <CurrencySettingsForm
        current={ctx.organization.currency || DEFAULT_CURRENCY}
        disabled={!ctx.canEditOrganization}
      />
    </div>
  )
}
