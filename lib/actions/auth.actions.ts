'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { setOrganizationCookie } from '@/lib/auth/getCurrentUser'
import { redirect } from 'next/navigation'
import type { Database } from '@/lib/types/database.types'

interface SignUpParams {
  email: string
  password: string
  fullName: string
}

export async function signUp({ email, password, fullName }: SignUpParams) {
  const supabase = await createServerSupabaseClient()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Failed to create user' }
  }
  
  // Create user profile
  const { error: profileError } = await (supabase as any)
    .from('profiles')
    .insert({
      id: authData.user.id,
      full_name: fullName,
    })

  if (profileError) {
    console.error('Profile creation error:', profileError)
    return { error: 'Failed to create user profile' }
  }

  return {
    success: true,
    userId: authData.user.id,
  }
}

interface LoginParams {
  email: string
  password: string
}

export async function login({ email, password }: LoginParams) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (!data.user) {
    return { error: 'Failed to sign in' }
  }

  // Check if user has an organization
  const { data: orgData } = await (supabase as any)
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', data.user.id)
    .limit(1)
    .single()

  if (orgData) {
    // User already has organization, set cookie and redirect
    setOrganizationCookie((orgData as any).organization_id)
    return {
      success: true,
      nextStep: 'dashboard',
    }
  }

  return {
    success: true,
    nextStep: 'onboarding',
  }
}

export async function logout() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/')
}

interface CreateOrganizationParams {
  organizationName: string
  branchName: string
}

export async function createOrganizationWithBranch({
  organizationName,
  branchName,
}: CreateOrganizationParams) {
  const admin = createAdminClient()
  const supabase = await createServerSupabaseClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'User not found' }
  }

  try {
    // Create organization
    const { data: orgData, error: orgError } = await (admin as any)
      .from('organizations')
      .insert({
        name: organizationName,
      })
      .select()
      .single()

    if (orgError) {
      console.error('Organization creation error:', orgError)
      return { error: 'Failed to create organization' }
    }

    // Create organization_users record with owner role
    const { error: orgUserError } = await (admin as any)
      .from('organization_users')
      .insert({
        organization_id: orgData.id,
        user_id: user.id,
        role: 'owner',
      })

    if (orgUserError) {
      console.error('Organization user creation error:', orgUserError)
      return { error: 'Failed to assign owner role' }
    }

    // Create first branch
    const { data: branchData, error: branchError } = await (admin as any)
      .from('branches')
      .insert({
        organization_id: orgData.id,
        name: branchName,
      })
      .select()
      .single()

    if (branchError) {
      console.error('Branch creation error:', branchError)
      return { error: 'Failed to create branch' }
    }

    // Set organization cookie - must be awaited to ensure it's set before redirect
    await setOrganizationCookie(orgData.id)

    return {
      success: true,
      organizationId: orgData.id,
      branchId: branchData.id,
    }
  } catch (error) {
    console.error('Onboarding error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function resendVerificationEmail(email: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
