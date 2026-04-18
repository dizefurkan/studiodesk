'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { logOperation } from '@/lib/actions/history.actions'
import { getChanges } from '@/lib/utils/history-utils'
import type { Database } from '@/lib/types/database.types'

type Package = Database['public']['Tables']['packages']['Row']

export async function getPackages(searchQuery?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const admin = createAdminClient()
    let query = (admin as any)
      .from('packages')
      .select('*')
      .eq('organization_id', organization.id)
      .is('deleted_at', null)
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
    const admin = createAdminClient()
    const { data, error } = await (admin as any)
      .from('packages')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .is('deleted_at', null)
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

    // Log the create operation
    void logOperation('CREATE', 'package', (data as any).id, {
      after: {
        name: (data as any).name,
        danceTypeId: (data as any).dance_type_id,
        totalCredits: (data as any).total_credits,
        price: (data as any).price,
      }
    }, organization.id)

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

    // Fetch before state for logging
    const { data: beforePackage } = await supabase
      .from('packages')
      .select('id, name, dance_type_id, total_credits, price')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .single()

    if (!beforePackage) {
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

    // Log the update operation
    const beforeObj = {
      name: (beforePackage as any).name,
      danceTypeId: (beforePackage as any).dance_type_id,
      totalCredits: (beforePackage as any).total_credits,
      price: (beforePackage as any).price,
    }
    const afterObj = {
      name: (data as any).name,
      danceTypeId: (data as any).dance_type_id,
      totalCredits: (data as any).total_credits,
      price: (data as any).price,
    }
    const changes = getChanges(beforeObj, afterObj)
    void logOperation('UPDATE', 'package', id, {
      before: beforeObj,
      after: afterObj,
      changes,
    }, organization.id)

    return { data: data as Package, success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function deletePackage(id: string, reason?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    // Fetch before state for logging
    const { data: beforePackage } = await supabase
      .from('packages')
      .select('id, name, dance_type_id, total_credits, price')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .single()

    if (!beforePackage) {
      return { error: 'Package not found or does not belong to your organization' }
    }

    const user_id = user.id
    const updateResult = await (supabase.from('packages') as any)
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user_id,
        deleted_reason: reason || null,
      })
      .eq('id', id)
      .eq('organization_id', organization.id) as any
    const { error } = updateResult

    if (error) {
      console.error('Error deleting package:', error)
      return { error: 'Failed to delete package' }
    }

    // Log the delete operation
    const beforeObj = {
      name: (beforePackage as any).name,
      danceTypeId: (beforePackage as any).dance_type_id,
      totalCredits: (beforePackage as any).total_credits,
      price: (beforePackage as any).price,
    }
    void logOperation('DELETE', 'package', id, {
      before: beforeObj,
    }, organization.id)

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
