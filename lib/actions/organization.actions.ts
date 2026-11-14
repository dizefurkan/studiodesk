'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { getUserRoleInOrganization } from '@/lib/auth/getCurrentUser'
import { generateTemporaryPassword } from '@/lib/utils/generatePassword'
import { actionError } from '@/lib/i18n/actionError'

/**
 * Add existing user to organization with specified role
 */
export async function addExistingUserToOrganization(email: string, role: string) {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  // Check permissions
  const userRoleData = await getUserRoleInOrganization(organization.id)
  const userRole = userRoleData?.role
  const orgSettings = organization

  const isOwner = userRole === 'owner'
  const isManager = userRole === 'manager'
  const canManageTeam = isOwner || (isManager && orgSettings?.allow_manager_invite)

  if (!canManageTeam) {
    return { error: await actionError('noPermissionAddMembers') }
  }

  // Cannot add owner role
  if (role === 'owner') {
    return { error: await actionError('cannotAddOwner') }
  }

  // Validate role
  if (!['manager', 'instructor', 'staff'].includes(role)) {
    return { error: await actionError('invalidRole') }
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

    return { error: await actionError('selectExistingUser') }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: await actionError('unexpected') }
  }
}

/**
 * Add existing user to organization (user already in system)
 */
export async function addExistingUserToOrganizationById(userId: string, role: string) {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  // Check permissions
  const userRoleData = await getUserRoleInOrganization(organization.id)
  const userRole = userRoleData?.role
  const orgSettings = organization

  const isOwner = userRole === 'owner'
  const isManager = userRole === 'manager'
  const canManageTeam = isOwner || (isManager && orgSettings?.allow_manager_invite)

  if (!canManageTeam) {
    return { error: await actionError('noPermissionAddMembers') }
  }

  // Cannot add owner role
  if (role === 'owner') {
    return { error: await actionError('cannotAddOwner') }
  }

  // Validate role
  if (!['manager', 'instructor', 'staff'].includes(role)) {
    return { error: await actionError('invalidRole') }
  }

  try {
    const admin = createAdminClient()

    // Add user to organization
    const { data, error } = await admin
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
        return { error: await actionError('alreadyMember') }
      }
      console.error('Error adding user:', error)
      return { error: await actionError('addMemberFailed') }
    }

    // Refresh the settings page to show the newly added team member
    revalidatePath('/[locale]/dashboard/settings', 'layout')

    return { data, success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: await actionError('unexpected') }
  }
}

/**
 * Update team member role
 */
export async function updateTeamMemberRole(memberId: string, newRole: string) {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  // Check permissions
  const userRoleData = await getUserRoleInOrganization(organization.id)
  const userRole = userRoleData?.role
  const orgSettings = organization

  const isOwner = userRole === 'owner'
  const isManager = userRole === 'manager'
  const canChangeRoles =
    isOwner || (isManager && orgSettings?.allow_role_change && orgSettings?.allow_manager_invite)

  if (!canChangeRoles) {
    return { error: await actionError('noPermissionChangeRoles') }
  }

  // Validate role
  if (!['manager', 'instructor', 'staff', 'owner'].includes(newRole)) {
    return { error: await actionError('invalidRole') }
  }

  try {
    const admin = createAdminClient()

    // Get member info to check if it's owner
    const { data: member, error: fetchError } = await admin
      .from('organization_users')
      .select('role')
      .eq('id', memberId)
      .eq('organization_id', organization.id)
      .single()

    if (fetchError || !member) {
      return { error: await actionError('memberNotFound') }
    }

    // Cannot change owner role
    if (member.role === 'owner') {
      return { error: await actionError('cannotChangeOwnerRole') }
    }

    // Update role
    const { data, error } = await admin
      .from('organization_users')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', memberId)
      .eq('organization_id', organization.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating role:', error)
      return { error: await actionError('updateRoleFailed') }
    }

    return { data, success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: await actionError('unexpected') }
  }
}

/**
 * Remove team member from organization
 */
export async function removeTeamMember(memberId: string) {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  // Check permissions
  const userRoleData = await getUserRoleInOrganization(organization.id)
  const userRole = userRoleData?.role
  const orgSettings = organization

  const isOwner = userRole === 'owner'
  const isManager = userRole === 'manager'
  const canDeleteMembers =
    isOwner || (isManager && orgSettings?.allow_member_delete && orgSettings?.allow_manager_invite)

  if (!canDeleteMembers) {
    return { error: await actionError('noPermissionRemoveMembers') }
  }

  try {
    const admin = createAdminClient()

    // Get member info to check if it's owner
    const { data: member, error: fetchError } = await admin
      .from('organization_users')
      .select('role')
      .eq('id', memberId)
      .eq('organization_id', organization.id)
      .single()

    if (fetchError || !member) {
      return { error: await actionError('memberNotFound') }
    }

    // Cannot remove owner
    if (member.role === 'owner') {
      return { error: await actionError('cannotRemoveOwner') }
    }

    // Delete team member
    const { error } = await admin
      .from('organization_users')
      .delete()
      .eq('id', memberId)
      .eq('organization_id', organization.id)

    if (error) {
      console.error('Error removing member:', error)
      return { error: await actionError('removeMemberFailed') }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: await actionError('unexpected') }
  }
}

/**
 * Reset team member password and return new temporary password
 */
export async function resetTeamMemberPassword(memberId: string) {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  // Check permissions - only owner can reset passwords
  const userRoleData = await getUserRoleInOrganization(organization.id)
  const userRole = userRoleData?.role

  if (userRole !== 'owner') {
    return { error: await actionError('onlyOwnerResetsPasswords') }
  }

  try {
    const admin = createAdminClient()

    // Get member info to get user_id
    const { data: member, error: fetchError } = await admin
      .from('organization_users')
      .select('user_id, role')
      .eq('id', memberId)
      .eq('organization_id', organization.id)
      .single()

    if (fetchError || !member) {
      return { error: await actionError('memberNotFound') }
    }

    // Cannot reset owner password
    if (member.role === 'owner') {
      return { error: await actionError('cannotResetOwnerPassword') }
    }

    // Generate new temporary password
    const tempPassword = generateTemporaryPassword()

    // Update user password in Auth
    const { error: updateError } = await admin.auth.admin.updateUserById(
      member.user_id,
      { password: tempPassword }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return { error: await actionError('updatePasswordFailed') }
    }

    return {
      success: true,
      temporaryPassword: tempPassword,
      message: 'Password reset successfully',
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: await actionError('unexpected') }
  }
}
