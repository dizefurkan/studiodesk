'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { setOrganizationCookie } from '@/lib/auth/getCurrentUser'
import { isPlatformAdmin } from '@/lib/auth/platformAdmin'
import { redirect } from 'next/navigation'

// Public sign-up and self-service onboarding are disabled.
// Accounts and stores are created from /backoffice only.

interface LoginParams {
  email: string
  password: string
}

export type LoginNextStep = 'dashboard' | 'backoffice' | 'no-access'

export async function login({ email, password }: LoginParams): Promise<{
  success?: boolean
  error?: string
  nextStep?: LoginNextStep
}> {
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

  if (await isPlatformAdmin(data.user.id)) {
    return { success: true, nextStep: 'backoffice' }
  }

  // First active store the user belongs to
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- hand-written DB types lack is_active / nested selects
  const { data: memberships } = await (createAdminClient() as any)
    .from('organization_users')
    .select('organization_id, organizations!inner(is_active)')
    .eq('user_id', data.user.id)
    .eq('organizations.is_active', true)
    .limit(1)

  const orgId = memberships?.[0]?.organization_id as string | undefined
  if (orgId) {
    await setOrganizationCookie(orgId)
    return { success: true, nextStep: 'dashboard' }
  }

  return { success: true, nextStep: 'no-access' }
}

export async function logout() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/')
}
