/* eslint-disable @typescript-eslint/no-explicit-any -- hand-written DB types lack these selects */
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSettingsContext } from '@/lib/actions/settings.actions'
import { SettingsHeader } from '@/components/settings/SettingsHeader'
import { TeamSettings, type TeamMember } from '@/components/settings/TeamSettings'

export default async function TeamSettingsPage() {
  const ctx = await getSettingsContext()
  if (!ctx) redirect('/login')
  const o = ctx.organization
  const admin = createAdminClient() as any

  const { data: rows } = await admin
    .from('organization_users')
    .select('id, user_id, role, created_at')
    .eq('organization_id', o.id)
    .order('created_at', { ascending: true })
  const ids = (rows || []).map((r: any) => r.user_id)
  const { data: profiles } = ids.length
    ? await admin.from('profiles').select('id, email, full_name').in('id', ids)
    : { data: [] }
  const byId = new Map((profiles || []).map((p: any) => [p.id, p]))
  const order = { owner: 0, manager: 1, instructor: 2, staff: 3 } as Record<string, number>
  const members: TeamMember[] = (rows || [])
    .map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      role: r.role,
      email: (byId.get(r.user_id) as any)?.email ?? null,
      full_name: (byId.get(r.user_id) as any)?.full_name ?? null,
    }))
    .sort((a: TeamMember, b: TeamMember) => order[a.role] - order[b.role])

  // Mirrors the checks in organization.actions / invitations.actions
  const isManager = ctx.role === 'manager'
  const managerAdmin = isManager && !!o.allow_manager_invite

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SettingsHeader section="team" />
      <TeamSettings
        members={members}
        currentUserId={ctx.user.id}
        isOwner={ctx.isOwner}
        canInvite={ctx.isOwner || managerAdmin}
        canChangeRoles={ctx.isOwner || (managerAdmin && !!o.allow_role_change)}
        canRemove={ctx.isOwner || (managerAdmin && !!o.allow_member_delete)}
      />
    </div>
  )
}
