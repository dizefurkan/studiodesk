import { cache } from 'react'
import { unstable_rethrow } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from './getCurrentUser'
import { getOrganization } from './getOrganization'

export type PayAccess = {
  organizationId: string
  currency: string
  timezone: string | null
  role: 'owner' | 'manager' | 'instructor' | 'staff'
  /** Owners and managers see and change everyone's pay */
  canManage: boolean
  isOwner: boolean
  /**
   * Instructor records of the signed-in user (matched by e-mail within the organization).
   * Users with the instructor role may only see these.
   */
  ownInstructorIds: string[]
}

/**
 * Who may see or change instructor pay in the current organization. Cached per request.
 * Every pay server action starts here: managers get everything, instructors only their own
 * statement, staff nothing.
 */
export const getPayAccess = cache(async (): Promise<PayAccess | null> => {
  const user = await getCurrentUser()
  if (!user) return null
  const organization = await getOrganization()
  if (!organization) return null

  try {
    const admin = createAdminClient()
    const { data: membership } = await admin
      .from('organization_users')
      .select('role')
      .eq('organization_id', organization.id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!membership) return null

    const role = membership.role as PayAccess['role']
    let ownInstructorIds: string[] = []
    if (user.email) {
      const { data: own } = await admin
        .from('instructors')
        .select('id')
        .eq('organization_id', organization.id)
        .ilike('email', user.email)
        .is('deleted_at', null)
      ownInstructorIds = (own ?? []).map((i) => i.id)
    }

    return {
      organizationId: organization.id,
      currency: organization.currency || 'TRY',
      timezone: organization.timezone,
      role,
      canManage: role === 'owner' || role === 'manager',
      isOwner: role === 'owner',
      ownInstructorIds,
    }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Error in getPayAccess:', error)
    return null
  }
})

/** Whether the user may see this instructor's pay. */
export function canSeeInstructor(access: PayAccess, instructorId: string) {
  return access.canManage || access.ownInstructorIds.includes(instructorId)
}
