'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { logOperation } from '@/lib/actions/history.actions'
import { getChanges } from '@/lib/utils/history-utils'
import type { Database } from '@/lib/types/database.types'

type DanceType = Database['public']['Tables']['dance_types']['Row']

export async function getDanceTypes(
  searchQuery?: string,
): Promise<{ data?: DanceType[]; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const admin = createAdminClient()
    let query = admin
      .from('dance_types')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })

    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`)
    }

    const result = await query.overrideTypes<DanceType[]>()
    const { data, error } = result as { data: DanceType[] | null; error: any }

    if (error) {
      console.error('Error fetching dance types:', error)
      return { error: 'Failed to fetch dance types' }
    }

    return { data: data || [] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getDanceType(id: string): Promise<{ data?: DanceType; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const admin = createAdminClient()
    const result = await admin
      .from('dance_types')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .single()
      .overrideTypes<DanceType>() as any

    const { data, error } = result as { data: DanceType | null; error: any }

    if (error || !data) {
      console.error('Error fetching dance type:', error)
      return { error: 'Dance type not found' }
    }

    return { data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

interface CreateDanceTypeInput {
  name: string
  description?: string
}

export async function createDanceType(
  input: CreateDanceTypeInput,
): Promise<{ data?: DanceType; success?: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()
    const result = await supabase
      .from('dance_types')
      .insert({
        organization_id: organization.id,
        name: input.name,
        description: input.description,
      } as any)
      .select()
      .single()
      .overrideTypes<DanceType>() as any

    const { data, error } = result as { data: DanceType | null; error: any }

    if (error || !data) {
      console.error('Error creating dance type:', error)
      return { error: 'Failed to create dance type' }
    }

    // Log the create operation
    void logOperation('CREATE', 'dance_type', data.id, {
      after: {
        name: data.name,
        description: data.description,
      }
    }, organization.id)

    return { data, success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

interface UpdateDanceTypeInput {
  name?: string
  description?: string | null
}

export async function updateDanceType(
  id: string,
  input: UpdateDanceTypeInput,
): Promise<{ data?: DanceType; success?: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    // Fetch before state for logging
    const beforeResult = await supabase
      .from('dance_types')
      .select('id, name, description')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .single()
      .overrideTypes<DanceType>() as any

    const { data: beforeDanceType, error: beforeError } = beforeResult as { data: DanceType | null; error: any }

    if (!beforeDanceType) {
      return { error: 'Dance type not found or does not belong to your organization' }
    }

    const updateData: any = {}
    if (input.name !== undefined) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description

    console.log('[updateDanceType] Dance Type ID:', id)
    console.log('[updateDanceType] Update data:', updateData)

    const updateResult = await (supabase.from('dance_types') as any)
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organization.id)
      .select()
      .single() as any

    const { data, error } = updateResult as { data: DanceType | null; error: any }

    console.log('[updateDanceType] Error:', error)
    console.log('[updateDanceType] Data:', data)

    if (error || !data) {
      console.error('Error updating dance type:', error)
      return { error: 'Failed to update dance type' }
    }

    // Log the update operation
    const beforeObj = {
      name: beforeDanceType.name,
      description: beforeDanceType.description,
    }
    const afterObj = {
      name: data.name,
      description: data.description,
    }
    const changes = getChanges(beforeObj, afterObj)
    void logOperation('UPDATE', 'dance_type', id, {
      before: beforeObj,
      after: afterObj,
      changes,
    }, organization.id)

    return { data, success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function deleteDanceType(id: string): Promise<{ success?: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    // Fetch before state for logging
    const beforeResult = await supabase
      .from('dance_types')
      .select('id, name, description')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .single()
      .overrideTypes<DanceType>() as any

    const { data: beforeDanceType, error: beforeError } = beforeResult as { data: DanceType | null; error: any }

    if (!beforeDanceType) {
      return { error: 'Dance type not found or does not belong to your organization' }
    }

    const { error } = await supabase
      .from('dance_types')
      .delete()
      .eq('id', id)
      .eq('organization_id', organization.id)
      .overrideTypes<DanceType>()

    if (error) {
      console.error('Error deleting dance type:', error)
      return { error: 'Failed to delete dance type' }
    }

    // Log the delete operation
    const beforeObj = {
      name: beforeDanceType.name,
      description: beforeDanceType.description,
    }
    void logOperation('DELETE', 'dance_type', id, {
      before: beforeObj,
    }, organization.id)

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
