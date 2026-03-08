import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import type { User } from '@supabase/supabase-js'

export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user || null
  } catch {
    return null
  }
}

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
  } catch {
    return null
  }
}

export async function getCurrentUserProfile() {
  const user = await getCurrentUser()
  if (!user) return null

  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    return data
  } catch {
    return null
  }
}

export async function setOrganizationCookie(organizationId: string) {
  const cookieStore = await cookies()
  cookieStore.set('organization_id', organizationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function getOrganizationIdFromCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    return cookieStore.get('organization_id')?.value || null
  } catch {
    return null
  }
}

export async function getUserOrganizations() {
  const user = await getCurrentUser()
  if (!user) return []

  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('organization_users')
      .select(
        `
        organization_id,
        role,
        organizations (
          id,
          name
        )
      `
      )
      .eq('user_id', user.id)

    return data || []
  } catch {
    return []
  }
}

export async function getUserOrganization(organizationId: string) {
  const user = await getCurrentUser()
  if (!user) return null

  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('organization_users')
      .select(
        `
        *,
        organizations (*)
      `
      )
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    return data
  } catch {
    return null
  }
}

export async function isUserOrganizationMember(
  organizationId: string
): Promise<boolean> {
  const membership = await getUserOrganization(organizationId)
  return !!membership
}
