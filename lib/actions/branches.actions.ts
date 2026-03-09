'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import type { Database } from '@/lib/types/database.types'

type Branch = Database['public']['Tables']['branches']['Row']

export async function getBranches(searchQuery?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()
    
    // Test: Get ALL branches without organization filter
    const { data: allData, error: allError } = await supabase
      .from('branches')
      .select('*')
      .order('created_at', { ascending: false })
    
    console.log('[getBranches] ALL branches (no filter):', allData?.length, allData)
    console.log('[getBranches] ALL branches error:', allError)
    
    // Now get with organization filter
    let query = supabase
      .from('branches')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`)
    }

    const { data, error } = await query

    console.log('[getBranches] User:', user.id)
    console.log('[getBranches] Organization:', organization.id)
    console.log('[getBranches] Search Query:', searchQuery)
    console.log('[getBranches] Error:', error)
    console.log('[getBranches] Data received:', data)
    console.log('[getBranches] typeof data:', typeof data)
    console.log('[getBranches] Array.isArray(data):', Array.isArray(data))
    console.log('[getBranches] Object.keys(data):', Object.keys(data || {}))
    console.log('[getBranches] Data JSON:', JSON.stringify(data))
    console.log('[getBranches] Data length:', data?.length)
    console.log('[getBranches] data[0]:', data?.[0])

    if (error) {
      console.error('Error fetching branches:', error)
      return { error: 'Failed to fetch branches' }
    }

    console.log('[getBranches] Returning data:', data)
    return { data: data as Branch[] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getBranch(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .single()

    if (error) {
      console.error('Error fetching branch:', error)
      return { error: 'Branch not found' }
    }

    return { data: data as Branch }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

interface CreateBranchInput {
  name: string
  address?: string
  phone?: string
}

export async function createBranch(input: CreateBranchInput) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('branches')
      .insert({
        organization_id: organization.id,
        name: input.name,
        address: input.address || null,
        phone: input.phone || null,
      } as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating branch:', error)
      return { error: 'Failed to create branch' }
    }

    return { data: data as Branch, success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

interface UpdateBranchInput {
  name?: string
  address?: string | null
  phone?: string | null
}

export async function updateBranch(id: string, input: UpdateBranchInput) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    const { data: branch } = await supabase
      .from('branches')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .single()

    if (!branch) {
      return { error: 'Branch not found or does not belong to your organization' }
    }

    const updateData: any = {}
    if (input.name !== undefined) updateData.name = input.name
    if (input.address !== undefined) updateData.address = input.address
    if (input.phone !== undefined) updateData.phone = input.phone

    const { data, error } = await (supabase.from('branches') as any)
      .update({ ...updateData })
      .eq('id', id)
      .eq('organization_id', organization.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating branch:', error)
      return { error: 'Failed to update branch' }
    }

    return { data: data as Branch, success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function deleteBranch(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from('branches')
      .delete()
      .eq('id', id)
      .eq('organization_id', organization.id)

    if (error) {
      console.error('Error deleting branch:', error)
      return { error: 'Failed to delete branch' }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
