import { redirect } from 'next/navigation'
import { getSettingsContext } from '@/lib/actions/settings.actions'
import { SettingsHeader } from '@/components/settings/SettingsHeader'
import { PermissionSettingsForm } from '@/components/settings/PermissionSettingsForm'

export default async function PermissionSettingsPage() {
  const ctx = await getSettingsContext()
  if (!ctx) redirect('/login')
  if (!ctx.isOwner) redirect('/dashboard/settings')
  const o = ctx.organization
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SettingsHeader section="permissions" />
      <PermissionSettingsForm
        initial={{
          allow_manager_invite: !!o.allow_manager_invite,
          allow_role_change: !!o.allow_role_change,
          allow_member_delete: !!o.allow_member_delete,
        }}
      />
    </div>
  )
}
