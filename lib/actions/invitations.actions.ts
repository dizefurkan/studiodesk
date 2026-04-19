'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { generateTemporaryPassword } from '@/lib/utils/generatePassword'
import { revalidatePath } from 'next/cache'
import { logOperation } from '@/lib/actions/history.actions'
import type { Database } from '@/lib/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type OrganizationUser = Database['public']['Tables']['organization_users']['Row']
type Organization = Database['public']['Tables']['organizations']['Row']

// Invitation type - table not in database schema yet, using generic structure
interface Invitation {
  id: string
  email: string
  role: string
  organization_id: string
  status: 'pending' | 'accepted' | 'expired'
  token: string
  expires_at: string
  created_at?: string
  accepted_at?: string | null
}

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

  try {
    const admin = createAdminClient()

    // Check if user already exists with this email
    const existingUserResult = await admin
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()
      .overrideTypes<Profile>() as any

    const { data: existingUser, error: existingUserError } = existingUserResult as { data: Profile | null; error: any }

    if (existingUser) {
      // Check if already in organization
      const orgMemberResult = await admin
        .from('organization_users')
        .select('id')
        .eq('user_id', existingUser.id)
        .eq('organization_id', organization.id)
        .single()
        .overrideTypes<OrganizationUser>() as any

      const { data: orgMember } = orgMemberResult as { data: OrganizationUser | null; error: any }

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
        } as any)
        .overrideTypes<OrganizationUser>()

      if (addError) {
        console.error('Error adding existing user:', addError)
        return { error: 'Failed to add user to organization' }
      }

      revalidatePath('/dashboard/settings')
      return { success: true, message: 'User added to organization', isExisting: true }
    }

    // User doesn't exist - create new user with auto-generated password
    const tempPassword = generateTemporaryPassword()

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await (admin as any).auth.admin.createUser({
      email: email.toLowerCase(),
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
    })

    if (authError) {
      // If email already exists in Auth, try to find and add them to org
      if (authError.code === 'email_exists') {
        console.log('Email exists in Auth, trying to fetch user...')
        
        // Generate temporary password for existing user
        const tempPassword = generateTemporaryPassword()
        
        // Get user from Auth by email
        const { data: authUsers, error: fetchError } = await (admin as any).auth.admin.listUsers()
        
        if (!fetchError && authUsers) {
          const existingAuthUser = authUsers.users.find((u: any) => u.email === email.toLowerCase())
          
          if (existingAuthUser) {
            console.log('Found existing Auth user:', existingAuthUser.id)
            
            // Update password for existing user
            const { error: updateError } = await (admin as any).auth.admin.updateUserById(
              existingAuthUser.id,
              { password: tempPassword }
            )
            
            if (updateError) {
              console.error('Error updating password:', updateError)
              // Continue anyway, user might already have a password set
            }
            
            // Check if profile exists
            const profileExistsResult = await admin
              .from('profiles')
              .select('id')
              .eq('id', existingAuthUser.id)
              .single()
              .overrideTypes<Profile>() as any

            const { data: profileExists } = profileExistsResult as { data: Profile | null; error: any }
            
            // Create profile if it doesn't exist
            if (!profileExists) {
              const { error: profileError } = await admin
                .from('profiles')
                .insert({
                  id: existingAuthUser.id,
                  email: email.toLowerCase(),
                  full_name: email.split('@')[0],
                } as any)
                .overrideTypes<Profile>()
              
              if (profileError) {
                console.error('❌ Error creating profile (existing user):', profileError)
              } else {
                console.log('✅ Profile created for existing user:', existingAuthUser.id)
              }
            }
            
            // Check if already in organization
            const orgMember2Result = await admin
              .from('organization_users')
              .select('id')
              .eq('user_id', existingAuthUser.id)
              .eq('organization_id', organization.id)
              .single()
              .overrideTypes<OrganizationUser>() as any

            const { data: orgMember2 } = orgMember2Result as { data: OrganizationUser | null; error: any }
            
            if (orgMember2) {
              return { error: 'User is already a member of this organization' }
            }
            
            // Add to organization
            const { error: orgError } = await admin
              .from('organization_users')
              .insert({
                organization_id: organization.id,
                user_id: existingAuthUser.id,
                role: role,
              } as any)
              .overrideTypes<OrganizationUser>()
            
            if (orgError) {
              console.error('Error adding to organization:', orgError)
              return { error: 'Failed to add user to organization' }
            }
            
            revalidatePath('/dashboard/settings')
            return {
              success: true,
              message: 'User created and added to organization',
              email: email.toLowerCase(),
              role: role,
              temporaryPassword: tempPassword,
              isNewUser: true,
            }
          }
        }
        
        return { error: 'Email already registered. Contact support to add this user.' }
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
      } as any)
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
      } as any)
      .overrideTypes<OrganizationUser>()

    if (orgError) {
      console.error('❌ Error adding to organization:', orgError)
      return { error: 'Failed to add user to organization' }
    }

    console.log('✅ User successfully added to organization_users')
    console.log('   User ID:', authData.user.id)
    console.log('   Organization ID:', organization.id)
    console.log('   Role:', role)

    revalidatePath('/dashboard/settings')


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

/**
 * Get invitation by token
 */
export async function getInvitationByToken(
  token: string,
): Promise<{ data?: Invitation & { organizations: Organization }; error?: string }> {
  try {
    const admin = createAdminClient()

    const result = await admin
      .from('invitations')
      .select(
        `
        id,
        email,
        role,
        organization_id,
        status,
        expires_at,
        organizations(id, name)
      `,
      )
      .eq('token', token)
      .eq('status', 'pending')
      .single()
      .overrideTypes<Invitation & { organizations: Organization }>() as any

    const { data, error } = result as { data: (Invitation & { organizations: Organization }) | null; error: any }

    if (error || !data) {
      return { error: 'Invitation not found or already accepted' }
    }

    // Check if invitation has expired
    const expiresAt = new Date(data.expires_at)
    if (expiresAt < new Date()) {
      // Mark as expired
      await (admin as any)
        .from('invitations')
        .update({ status: 'expired' })
        .eq('token', token)

      return { error: 'Invitation has expired' }
    }

    return { data }
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return { error: 'Failed to fetch invitation' }
  }
}

/**
 * Accept invitation and create user account
 */
export async function acceptInvitation(
  token: string,
  fullName: string,
  password: string,
): Promise<{ 
  success?: boolean
  userId?: string
  organizationId?: string
  message?: string
  error?: string 
}> {
  try {
    const admin = createAdminClient()

    // Get invitation
    const invitationResult = await admin
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single()
      .overrideTypes<Invitation>() as any

    const { data: invitation, error: invitationError } = invitationResult as { data: Invitation | null; error: any }

    if (invitationError || !invitation) {
      return { error: 'Invalid or expired invitation' }
    }

    // Check expiration
    const expiresAt = new Date(invitation.expires_at)
    if (expiresAt < new Date()) {
      await (admin as any)
        .from('invitations')
        .update({ status: 'expired' })
        .eq('token', token)
      return { error: 'Invitation has expired' }
    }

    // Create user in Auth
    const { data: authData, error: authError } = await (admin as any).auth.admin.createUser({
      email: invitation.email,
      password: password,
      email_confirm: true, // Auto-confirm email
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      if (authError.message.includes('already registered')) {
        return { error: 'Email already registered' }
      }
      return { error: 'Failed to create account' }
    }

    // Create user profile
    const { error: profileError } = await admin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: invitation.email,
        full_name: fullName,
      } as any)
      .overrideTypes<Profile>()

    if (profileError) {
      console.error('Error creating profile:', profileError)
      // Auth user was created, but profile failed - try to clean up or continue
    }

    // Add user to organization
    const { error: orgError } = await admin
      .from('organization_users')
      .insert({
        organization_id: invitation.organization_id,
        user_id: authData.user.id,
        role: invitation.role,
      } as any)
      .overrideTypes<OrganizationUser>()

    if (orgError) {
      console.error('Error adding to organization:', orgError)
      return { error: 'Failed to add user to organization' }
    }

    // Mark invitation as accepted
    const updateResult = await (admin.from('invitations') as any)
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('token', token)
      .select()
      .single() as any

    const { error: updateError } = updateResult

    if (updateError) {
      console.error('Error updating invitation:', updateError)
    }

    return {
      success: true,
      userId: authData.user.id,
      organizationId: invitation.organization_id,
      message: 'Account created successfully',
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * List pending invitations for an organization
 */
export async function getPendingInvitations(): Promise<{ data?: Invitation[]; error?: string }> {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const admin = createAdminClient()

    const result = await admin
      .from('invitations')
      .select('id, email, role, status, created_at, expires_at')
      .eq('organization_id', organization.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .overrideTypes<Invitation[]>()

    const { data, error } = result as { data: Invitation[] | null; error: any }

    if (error) {
      console.error('Error fetching invitations:', error)
      return { error: 'Failed to fetch invitations' }
    }

    return { data: data || [] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Cancel/revoke invitation
 */
export async function revokeInvitation(invitationId: string): Promise<{ success?: boolean; message?: string; error?: string }> {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const admin = createAdminClient()

    const { error } = await admin
      .from('invitations')
      .delete()
      .eq('id', invitationId)
      .eq('organization_id', organization.id)
      .overrideTypes<Invitation>()

    if (error) {
      console.error('Error revoking invitation:', error)
      return { error: 'Failed to revoke invitation' }
    }

    revalidatePath('/dashboard/settings')

    return { success: true, message: 'Invitation revoked' }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
