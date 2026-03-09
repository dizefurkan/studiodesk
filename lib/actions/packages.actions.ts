'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import type { Database } from '@/lib/types/database.types'

type Package = Database['public']['Tables']['packages']['Row']

export async function getPackages(searchQuery?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('packages')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })

    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching packages:', error)
      return { error: 'Failed to fetch packages' }
    }

    return { data: data as Package[] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getPackage(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .single()

    if (error) {
      console.error('Error fetching package:', error)
      return { error: 'Package not found' }
    }

    return { data: data as Package }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

interface CreatePackageInput {
  name: string
  danceTypeId: string
  totalCredits: number
  price: number
}

export async function createPackage(input: CreatePackageInput) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await (supabase
      .from('packages') as any)
      .insert({
        organization_id: organization.id,
        name: input.name,
        dance_type_id: input.danceTypeId,
        total_credits: input.totalCredits,
        price: input.price,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating package:', error)
      return { error: 'Failed to create package' }
    }

    return { data: data as Package, success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

interface UpdatePackageInput {
  name?: string
  danceTypeId?: string
  totalCredits?: number
  price?: number
}

export async function updatePackage(id: string, input: UpdatePackageInput) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    const { data: pkg } = await supabase
      .from('packages')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .single()

    if (!pkg) {
      return { error: 'Package not found or does not belong to your organization' }
    }

    const updateData: any = {}
    if (input.name !== undefined) updateData.name = input.name
    if (input.danceTypeId !== undefined) updateData.dance_type_id = input.danceTypeId
    if (input.totalCredits !== undefined) updateData.total_credits = input.totalCredits
    if (input.price !== undefined) updateData.price = input.price

    console.log('[updatePackage] Package ID:', id)
    console.log('[updatePackage] Update data:', updateData)

    const { data, error } = await (supabase.from('packages') as any)
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organization.id)
      .select()
      .single()

    console.log('[updatePackage] Error:', error)
    console.log('[updatePackage] Data:', data)

    if (error) {
      console.error('Error updating package:', error)
      return { error: 'Failed to update package' }
    }

    return { data: data as Package, success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function deletePackage(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', id)
      .eq('organization_id', organization.id)

    if (error) {
      console.error('Error deleting package:', error)
      return { error: 'Failed to delete package' }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
