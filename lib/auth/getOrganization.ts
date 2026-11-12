import { unstable_rethrow } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOrganizationIdFromCookie, getCurrentUser } from './getCurrentUser'
import type { Database } from '@/lib/types/database.types'

export async function getOrganization() {
  const user = await getCurrentUser()
  
  if (!user) return null

  try {
    // Use admin client to bypass RLS for server-side operations
    const supabase = createAdminClient()
    
    // First try to get from cookie
    const organizationId = await getOrganizationIdFromCookie()
    if (organizationId) {
      const { data } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .limit(1)

      if (data && data.length > 0) {
        return data[0] as Database['public']['Tables']['organizations']['Row']
      }
    }

    // If no cookie, get the user's first organization from organization_users table
    const { data: orgUsers, error: orgUsersError } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)

    if (orgUsersError) {
      console.error('Error fetching organization_users:', {
        message: orgUsersError.message,
        code: (orgUsersError as any).code,
        details: (orgUsersError as any).details,
        hint: (orgUsersError as any).hint,
      })
      return null
    }

    if (!orgUsers || orgUsers.length === 0) {
      console.warn('No organization found for user:', user.id)
      return null
    }

    const orgId = (orgUsers[0] as any).organization_id
    
    // Get the organization details
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .limit(1)

    if (orgsError) {
      console.error('Error fetching organization:', orgsError)
      return null
    }

    if (orgs && orgs.length > 0) {
      console.log('Organization found for user:', user.id, 'orgId:', orgId)
      return orgs[0] as Database['public']['Tables']['organizations']['Row']
    }

    console.warn('Organization data empty for orgId:', orgId)
    return null
  } catch (error) {
    unstable_rethrow(error)
    console.error('Error in getOrganization:', error)
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
  } catch (err) {
    unstable_rethrow(err)
    return null
  }
}
