'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import type { Database } from '@/lib/types/database.types'

type DanceType = Database['public']['Tables']['dance_types']['Row']

export async function getDanceTypes(searchQuery?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('dance_types')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })

    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching dance types:', error)
      return { error: 'Failed to fetch dance types' }
    }

    return { data: data as DanceType[] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getDanceType(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('dance_types')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .single()

    if (error) {
      console.error('Error fetching dance type:', error)
      return { error: 'Dance type not found' }
    }

    return { data: data as DanceType }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

interface CreateDanceTypeInput {
  name: string
  description?: string
}

export async function createDanceType(input: CreateDanceTypeInput) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await (supabase
      .from('dance_types') as any)
      .insert({
        organization_id: organization.id,
        name: input.name,
        description: input.description || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating dance type:', error)
      return { error: 'Failed to create dance type' }
    }

    return { data: data as DanceType, success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

interface UpdateDanceTypeInput {
  name?: string
  description?: string | null
}

export async function updateDanceType(id: string, input: UpdateDanceTypeInput) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    const { data: danceType } = await supabase
      .from('dance_types')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .single()

    if (!danceType) {
      return { error: 'Dance type not found or does not belong to your organization' }
    }

    const updateData: any = {}
    if (input.name !== undefined) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description

    console.log('[updateDanceType] Dance Type ID:', id)
    console.log('[updateDanceType] Update data:', updateData)

    const { data, error } = await (supabase.from('dance_types') as any)
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organization.id)
      .select()
      .single()

    console.log('[updateDanceType] Error:', error)
    console.log('[updateDanceType] Data:', data)

    if (error) {
      console.error('Error updating dance type:', error)
      return { error: 'Failed to update dance type' }
    }

    return { data: data as DanceType, success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function deleteDanceType(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from('dance_types')
      .delete()
      .eq('id', id)
      .eq('organization_id', organization.id)

    if (error) {
      console.error('Error deleting dance type:', error)
      return { error: 'Failed to delete dance type' }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
