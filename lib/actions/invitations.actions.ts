'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { generateTemporaryPassword } from '@/lib/utils/generatePassword'
import { MUST_CHANGE_PASSWORD } from '@/lib/auth/passwordPolicy'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/lib/types/database.types'
import type { PostgrestError } from '@supabase/supabase-js'

type Profile = Database['public']['Tables']['profiles']['Row']
type OrganizationUser = Database['public']['Tables']['organization_users']['Row']

/**
 * Invite a new team member - creates user immediately with auto-generated password
 */
export async function sendTeamInvitation(
  email: string,
  role: string,
): Promise<{ 
  success?: boolean
  message?: string
  isExisting?: boolean
  email?: string
  role?: string
  temporaryPassword?: string
  isNewUser?: boolean
  error?: string 
}> {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: 'Invalid email address' }
  }

  // Validate role
  if (!['staff', 'instructor', 'manager'].includes(role)) {
    return { error: 'Invalid role' }
  }

  // Permission: owner, or a manager when the org allows managers to invite.
  // Only the owner can add managers.
  {
    const admin = createAdminClient()
    const { data: me } = await admin
      .from('organization_users')
      .select('role')
      .eq('organization_id', organization.id)
      .eq('user_id', currentUser.id)
      .maybeSingle()
    const myRole = me?.role as string | undefined
    const canInvite = myRole === 'owner' || (myRole === 'manager' && organization.allow_manager_invite)
    if (!canInvite) return { error: 'You do not have permission to add team members' }
    if (role === 'manager' && myRole !== 'owner') return { error: 'Only the owner can add managers' }
  }

  try {
    const admin = createAdminClient()

    // Check if user already exists with this email
    const existingUserResult = await admin
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()
      .overrideTypes<Profile>()

    const { data: existingUser, error: existingUserError } = existingUserResult as { data: Profile | null; error: PostgrestError | null }

    if (existingUser) {
      // Check if already in organization
      const orgMemberResult = await admin
        .from('organization_users')
        .select('id')
        .eq('user_id', existingUser.id)
        .eq('organization_id', organization.id)
        .single()
        .overrideTypes<OrganizationUser>()

      const { data: orgMember } = orgMemberResult as { data: OrganizationUser | null; error: PostgrestError | null }

      if (orgMember) {
        return { error: 'User is already a member of this organization' }
      }

      // Add existing user to organization
      const { error: addError } = await admin
        .from('organization_users')
        .insert({
          organization_id: organization.id,
          user_id: existingUser.id,
          role: role,
        })
        .overrideTypes<OrganizationUser>()

      if (addError) {
        console.error('Error adding existing user:', addError)
        return { error: 'Failed to add user to organization' }
      }

      revalidatePath('/[locale]/dashboard/settings', 'layout')
      return { success: true, message: 'User added to organization', isExisting: true }
    }

    // User doesn't exist - create new user with auto-generated password
    const tempPassword = generateTemporaryPassword()

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      app_metadata: { [MUST_CHANGE_PASSWORD]: true },
    })

    if (authError) {
      // The email belongs to an auth account without a profile. Never reset someone
      // else's password from here (that was an account-takeover path); a platform
      // admin can attach the account from /backoffice instead.
      if (authError.code === 'email_exists') {
        return { error: 'This email already has an account. Ask a StudioDesk admin to add it to your team.' }
      }
      
      console.error('Error creating auth user:')
      console.error('Error message:', authError.message)
      console.error('Full error:', JSON.stringify(authError, null, 2))
      return { error: `Failed to create user account: ${authError.message}` }
    }

    // Create user profile
    const { error: profileError } = await admin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email.toLowerCase(),
        full_name: email.split('@')[0],
      })
      .overrideTypes<Profile>()

    if (profileError) {
      console.error('❌ Error creating profile (new user):', profileError)
      // Continue anyway - try to add to organization
    } else {
      console.log('✅ Profile created for new user:', authData.user.id)
    }

    // Add user to organization
    const { error: orgError } = await admin
      .from('organization_users')
      .insert({
        organization_id: organization.id,
        user_id: authData.user.id,
        role: role,
      })
      .overrideTypes<OrganizationUser>()

    if (orgError) {
      console.error('❌ Error adding to organization:', orgError)
      return { error: 'Failed to add user to organization' }
    }

    console.log('✅ User successfully added to organization_users')
    console.log('   User ID:', authData.user.id)
    console.log('   Organization ID:', organization.id)
    console.log('   Role:', role)

    revalidatePath('/[locale]/dashboard/settings', 'layout')


    return {
      success: true,
      message: `User created and added to organization`,
      email: email.toLowerCase(),
      role: role,
      temporaryPassword: tempPassword,
      isNewUser: true,
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
