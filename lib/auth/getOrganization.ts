import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrganizationIdFromCookie } from './getCurrentUser'
import type { Database } from '@/lib/types/database.types'

export async function getOrganization() {
  const organizationId = await getOrganizationIdFromCookie()
  if (!organizationId) return null

  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()

    return data as Database['public']['Tables']['organizations']['Row'] | null
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
