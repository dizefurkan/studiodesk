import { cache } from 'react'
import { unstable_rethrow } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from './getCurrentUser'
import { getOrganization } from './getOrganization'

export type MemberAccess = {
  userId: string
  organizationId: string
  organizationName: string
  timezone: string | null
  role: 'owner' | 'manager' | 'instructor' | 'staff'
  /** Owners, managers and front-desk staff may message students */
  canMessage: boolean
}

/** The signed-in user's role in the current organization. Cached per request. */
export const getMemberAccess = cache(async (): Promise<MemberAccess | null> => {
  const user = await getCurrentUser()
  if (!user) return null
  const organization = await getOrganization()
  if (!organization) return null
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('organization_users')
      .select('role')
      .eq('organization_id', organization.id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!data) return null
    const role = data.role as MemberAccess['role']
    return {
      userId: user.id,
      organizationId: organization.id,
      organizationName: organization.name,
      timezone: organization.timezone,
      role,
      canMessage: role === 'owner' || role === 'manager' || role === 'staff',
    }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Error in getMemberAccess:', error)
    return null
  }
})
