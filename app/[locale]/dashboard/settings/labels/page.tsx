import { redirect } from '@/i18n/navigation'
import { getLocale } from 'next-intl/server'
import { getSettingsContext } from '@/lib/actions/settings.actions'
import { getLabels } from '@/lib/actions/labels.actions'
import { SettingsHeader } from '@/components/settings/SettingsHeader'
import { LabelsManager } from '@/components/labels/LabelsManager'

export default async function LabelsSettingsPage() {
  const ctx = await getSettingsContext()
  if (!ctx) redirect({ href: '/login', locale: await getLocale() })
  const { data: labels } = await getLabels()
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SettingsHeader section="labels" />
      <LabelsManager labels={labels} />
    </div>
  )
}
