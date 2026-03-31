'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { logOperation } from '@/lib/actions/history.actions'
import { getChanges } from '@/lib/utils/history-utils'

export interface StudioInput {
  name: string
  description?: string
  capacity?: number
  image_url?: string
}

export async function getStudios(branchId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('studios')
      .select('*')
      .eq('branch_id', branchId)
      .order('name')

    if (error) {
      console.error('Error fetching studios:', error)
      return { error: 'Failed to fetch studios' }
    }

    return { data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function createStudio(branchId: string, studioData: StudioInput) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    if (!studioData.name) {
      return { error: 'Studio name is required' }
    }

    const { data, error } = await (supabase
      .from('studios') as any)
      .insert({
        branch_id: branchId,
        name: studioData.name,
        description: studioData.description || null,
        capacity: studioData.capacity || null,
        image_url: studioData.image_url || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating studio:', error)
      return { error: 'Failed to create studio' }
    }

    // Log the create operation
    void logOperation('CREATE', 'studio', (data as any).id, {
      after: {
        name: (data as any).name,
        description: (data as any).description,
        capacity: (data as any).capacity,
        imageUrl: (data as any).image_url,
        branchId: (data as any).branch_id,
      }
    }, organization.id)

    return { data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function updateStudio(studioId: string, studioData: Partial<StudioInput>) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    // Fetch before state for logging
    const { data: beforeStudio } = await (supabase
      .from('studios') as any)
      .select('id, name, description, capacity, image_url')
      .eq('id', studioId)
      .single()

    if (!beforeStudio) {
      return { error: 'Studio not found' }
    }

    const updateData: any = {}
    if (studioData.name) updateData.name = studioData.name
    if (studioData.description !== undefined) updateData.description = studioData.description
    if (studioData.capacity !== undefined) updateData.capacity = studioData.capacity
    if (studioData.image_url !== undefined) updateData.image_url = studioData.image_url

    const { data, error } = await (supabase
      .from('studios') as any)
      .update(updateData)
      .eq('id', studioId)
      .select()
      .single()

    if (error) {
      console.error('Error updating studio:', error)
      return { error: 'Failed to update studio' }
    }

    // Log the update operation
    const beforeObj = {
      name: (beforeStudio as any).name,
      description: (beforeStudio as any).description,
      capacity: (beforeStudio as any).capacity,
      imageUrl: (beforeStudio as any).image_url,
    }
    const afterObj = {
      name: (data as any).name,
      description: (data as any).description,
      capacity: (data as any).capacity,
      imageUrl: (data as any).image_url,
    }
    const changes = getChanges(beforeObj, afterObj)
    void logOperation('UPDATE', 'studio', studioId, {
      before: beforeObj,
      after: afterObj,
      changes,
    }, organization.id)

    return { data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function deleteStudio(studioId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    // Fetch before state for logging
    const { data: beforeStudio } = await (supabase
      .from('studios') as any)
      .select('id, name, description, capacity, image_url')
      .eq('id', studioId)
      .single()

    if (!beforeStudio) {
      return { error: 'Studio not found' }
    }

    const { error } = await supabase
      .from('studios')
      .delete()
      .eq('id', studioId)

    if (error) {
      console.error('Error deleting studio:', error)
      return { error: 'Failed to delete studio' }
    }

    // Log the delete operation
    const beforeObj = {
      name: (beforeStudio as any).name,
      description: (beforeStudio as any).description,
      capacity: (beforeStudio as any).capacity,
      imageUrl: (beforeStudio as any).image_url,
    }
    void logOperation('DELETE', 'studio', studioId, {
      before: beforeObj,
    }, organization.id)

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
