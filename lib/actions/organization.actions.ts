'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { getUserRoleInOrganization } from '@/lib/auth/getCurrentUser'
import { generateTemporaryPassword } from '@/lib/utils/generatePassword'
import { ROLE_HIERARCHY } from '@/lib/constants/roles'

export async function updateOrganizationSettings(currency: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createAdminClient()

    const { data, error } = await (supabase
      .from('organizations') as any)
      .update({ currency })
      .eq('id', organization.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating organization:', error)
      return { error: 'Failed to update organization settings' }
    }

    return { data, success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Update organization team member permissions
 */
export async function updateOrganizationPermissions(permissions: {
  allow_manager_invite?: boolean
  allow_role_change?: boolean
  allow_member_delete?: boolean
}) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  // Only owner can change permissions
  const userRole = await getUserRoleInOrganization(organization.id)
  if ((userRole as any)?.role !== 'owner') {
    return { error: 'Only organization owner can change permissions' }
  }

  try {
    const supabase = await createAdminClient()

    const updateData: any = {}
    if (permissions.allow_manager_invite !== undefined) {
      updateData.allow_manager_invite = permissions.allow_manager_invite
    }
    if (permissions.allow_role_change !== undefined) {
      updateData.allow_role_change = permissions.allow_role_change
    }
    if (permissions.allow_member_delete !== undefined) {
      updateData.allow_member_delete = permissions.allow_member_delete
    }
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await (supabase
      .from('organizations') as any)
      .update(updateData)
      .eq('id', organization.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating permissions:', error)
      return { error: 'Failed to update permissions' }
    }

    return { data, success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Add existing user to organization with specified role
 */
export async function addExistingUserToOrganization(email: string, role: string) {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  // Check permissions
  const userRoleData = await getUserRoleInOrganization(organization.id)
  const userRole = (userRoleData as any)?.role
  const orgSettings = (organization as any)

  const isOwner = userRole === 'owner'
  const isManager = userRole === 'manager'
  const canManageTeam = isOwner || (isManager && orgSettings?.allow_manager_invite)

  if (!canManageTeam) {
    return { error: 'You do not have permission to add team members' }
  }

  // Cannot add owner role
  if (role === 'owner') {
    return { error: 'Cannot add new team members as owner' }
  }

  // Validate role
  if (!['manager', 'instructor', 'staff'].includes(role)) {
    return { error: 'Invalid role' }
  }

  try {
    const supabase = await createServerSupabaseClient()

    // Find user by email
    const { data: userList, error: userError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .ilike('id', email) // This won't work - need different approach
      .single()

    // Actually, we need to query by user email from auth.users but we don't have direct access
    // Instead, let's check if the user exists by trying to add them with a known user_id
    // For now, return error suggesting to select from existing users dropdown

    return { error: 'Please select an existing user from the dropdown' }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Add existing user to organization (user already in system)
 */
export async function addExistingUserToOrganizationById(userId: string, role: string) {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  // Check permissions
  const userRoleData = await getUserRoleInOrganization(organization.id)
  const userRole = (userRoleData as any)?.role
  const orgSettings = (organization as any)

  const isOwner = userRole === 'owner'
  const isManager = userRole === 'manager'
  const canManageTeam = isOwner || (isManager && orgSettings?.allow_manager_invite)

  if (!canManageTeam) {
    return { error: 'You do not have permission to add team members' }
  }

  // Cannot add owner role
  if (role === 'owner') {
    return { error: 'Cannot add new team members as owner' }
  }

  // Validate role
  if (!['manager', 'instructor', 'staff'].includes(role)) {
    return { error: 'Invalid role' }
  }

  try {
    const admin = createAdminClient()

    // Add user to organization
    const { data, error } = await (admin as any)
      .from('organization_users')
      .insert({
        organization_id: organization.id,
        user_id: userId,
        role: role,
      })
      .select()
      .single()

    if (error) {
      if (error.message.includes('duplicate')) {
        return { error: 'User is already a member of this organization' }
      }
      console.error('Error adding user:', error)
      return { error: 'Failed to add user to organization' }
    }

    // Refresh the settings page to show the newly added team member
    revalidatePath('/dashboard/settings')

    return { data, success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Update team member role
 */
export async function updateTeamMemberRole(memberId: string, newRole: string) {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  // Check permissions
  const userRoleData = await getUserRoleInOrganization(organization.id)
  const userRole = (userRoleData as any)?.role
  const orgSettings = (organization as any)

  const isOwner = userRole === 'owner'
  const isManager = userRole === 'manager'
  const canChangeRoles =
    isOwner || (isManager && orgSettings?.allow_role_change && orgSettings?.allow_manager_invite)

  if (!canChangeRoles) {
    return { error: 'You do not have permission to change team member roles' }
  }

  // Validate role
  if (!['manager', 'instructor', 'staff', 'owner'].includes(newRole)) {
    return { error: 'Invalid role' }
  }

  try {
    const admin = createAdminClient()

    // Get member info to check if it's owner
    const { data: member, error: fetchError } = await (admin as any)
      .from('organization_users')
      .select('role')
      .eq('id', memberId)
      .eq('organization_id', organization.id)
      .single()

    if (fetchError || !member) {
      return { error: 'Team member not found' }
    }

    // Cannot change owner role
    if (member.role === 'owner') {
      return { error: 'Cannot change owner role' }
    }

    // Update role
    const { data, error } = await (admin as any)
      .from('organization_users')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', memberId)
      .eq('organization_id', organization.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating role:', error)
      return { error: 'Failed to update team member role' }
    }

    return { data, success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Remove team member from organization
 */
export async function removeTeamMember(memberId: string) {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  // Check permissions
  const userRoleData = await getUserRoleInOrganization(organization.id)
  const userRole = (userRoleData as any)?.role
  const orgSettings = (organization as any)

  const isOwner = userRole === 'owner'
  const isManager = userRole === 'manager'
  const canDeleteMembers =
    isOwner || (isManager && orgSettings?.allow_member_delete && orgSettings?.allow_manager_invite)

  if (!canDeleteMembers) {
    return { error: 'You do not have permission to remove team members' }
  }

  try {
    const admin = createAdminClient()

    // Get member info to check if it's owner
    const { data: member, error: fetchError } = await (admin as any)
      .from('organization_users')
      .select('role')
      .eq('id', memberId)
      .eq('organization_id', organization.id)
      .single()

    if (fetchError || !member) {
      return { error: 'Team member not found' }
    }

    // Cannot remove owner
    if (member.role === 'owner') {
      return { error: 'Cannot remove organization owner' }
    }

    // Delete team member
    const { error } = await (admin as any)
      .from('organization_users')
      .delete()
      .eq('id', memberId)
      .eq('organization_id', organization.id)

    if (error) {
      console.error('Error removing member:', error)
      return { error: 'Failed to remove team member' }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Reset team member password and return new temporary password
 */
export async function resetTeamMemberPassword(memberId: string) {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  // Check permissions - only owner can reset passwords
  const userRoleData = await getUserRoleInOrganization(organization.id)
  const userRole = (userRoleData as any)?.role

  if (userRole !== 'owner') {
    return { error: 'Only organization owner can reset team member passwords' }
  }

  try {
    const admin = createAdminClient()

    // Get member info to get user_id
    const { data: member, error: fetchError } = await (admin as any)
      .from('organization_users')
      .select('user_id, role')
      .eq('id', memberId)
      .eq('organization_id', organization.id)
      .single()

    if (fetchError || !member) {
      return { error: 'Team member not found' }
    }

    // Cannot reset owner password
    if (member.role === 'owner') {
      return { error: 'Cannot reset owner password' }
    }

    // Generate new temporary password
    const tempPassword = generateTemporaryPassword()

    // Update user password in Auth
    const { error: updateError } = await (admin as any).auth.admin.updateUserById(
      member.user_id,
      { password: tempPassword }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return { error: 'Failed to update password' }
    }

    return {
      success: true,
      temporaryPassword: tempPassword,
      message: 'Password reset successfully',
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
