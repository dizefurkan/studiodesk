import { redirect } from 'next/navigation'
import { getSettingsContext } from '@/lib/actions/settings.actions'
import { SettingsHeader } from '@/components/settings/SettingsHeader'
import { ReadOnlyNotice } from '@/components/settings/ReadOnlyNotice'
import { AttendanceSettingsForm } from '@/components/settings/AttendanceSettingsForm'

export default async function AttendanceSettingsPage() {
  const ctx = await getSettingsContext()
  if (!ctx) redirect('/login')
  const o = ctx.organization
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SettingsHeader section="attendance" />
      {!ctx.canEditOrganization && <ReadOnlyNotice />}
      <AttendanceSettingsForm
        disabled={!ctx.canEditOrganization}
        initial={{
          virtual_sessions_weeks: o.virtual_sessions_weeks ?? 12,
          attendance_per_week_limit: o.attendance_per_week_limit ?? 1,
          allow_makeup_sessions: o.allow_makeup_sessions ?? true,
        }}
      />
    </div>
  )
}
