'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'

export async function updateOrganizationSettings(currency: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from('organizations')
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
