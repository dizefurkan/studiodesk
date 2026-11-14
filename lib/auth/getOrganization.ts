import { cache } from 'react'
import { unstable_rethrow } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOrganizationIdFromCookie, getCurrentUser } from './getCurrentUser'
import type { Database } from '@/lib/types/database.types'

type Organization = Database['public']['Tables']['organizations']['Row']

/**
 * The organization the current user is working in.
 *
 * The `organization_id` cookie is only a *preference*: it is honoured solely when the user is
 * a member of that organization. Most server actions use the service-role client and scope
 * their queries with this organization's id, so it must never come from client input alone.
 * Cached per request.
 */
export const getOrganization = cache(async (): Promise<Organization | null> => {
  const user = await getCurrentUser()
  if (!user) return null

  try {
    const admin = createAdminClient()
    const { data: memberships, error } = await admin
      .from('organization_users')
      .select('organization_id, organizations!inner(*)')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching organization memberships:', error)
      return null
    }
    if (!memberships || memberships.length === 0) return null

    const preferredId = await getOrganizationIdFromCookie()
    const membership =
      memberships.find((m) => m.organization_id === preferredId) ??
      memberships.find((m) => m.organizations.is_active) ??
      memberships[0]

    return membership.organizations
  } catch (error) {
    unstable_rethrow(error)
    console.error('Error in getOrganization:', error)
    return null
  }
})

export async function getUserRoleInOrganization(organizationId: string) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  try {
    const { data } = await supabase
      .from('organization_users')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    return data
  } catch (err) {
    unstable_rethrow(err)
    return null
  }
}
