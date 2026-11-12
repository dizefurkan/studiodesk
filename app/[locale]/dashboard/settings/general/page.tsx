import { redirect } from 'next/navigation'
import { getSettingsContext } from '@/lib/actions/settings.actions'
import { SettingsHeader } from '@/components/settings/SettingsHeader'
import { ReadOnlyNotice } from '@/components/settings/ReadOnlyNotice'
import { GeneralSettingsForm } from '@/components/settings/GeneralSettingsForm'

export default async function GeneralSettingsPage() {
  const ctx = await getSettingsContext()
  if (!ctx) redirect('/login')
  const o = ctx.organization
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SettingsHeader section="general" />
      {!ctx.canEditOrganization && <ReadOnlyNotice />}
      <GeneralSettingsForm
        disabled={!ctx.canEditOrganization}
        initial={{ name: o.name, timezone: o.timezone || 'Europe/Istanbul', week_start_day: o.week_start_day ?? 1 }}
      />
    </div>
  )
}
