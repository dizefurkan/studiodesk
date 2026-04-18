'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { logOperation } from '@/lib/actions/history.actions'
import { getChanges } from '@/lib/utils/history-utils'
import type { Database } from '@/lib/types/database.types'

type Branch = Database['public']['Tables']['branches']['Row']

export async function getBranches(
  searchQuery?: string,
): Promise<{ data?: Branch[]; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const admin = createAdminClient()
    
    let query = admin
      .from('branches')
      .select('*')
      .eq('organization_id', organization.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`)
    }

    const result = await query.overrideTypes<Branch[]>()
    const { data, error } = result as { data: Branch[] | null; error: any }

    if (error) {
      console.error('Error fetching branches:', error)
      return { error: 'Failed to fetch branches' }
    }

    return { data: data || [] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getBranch(id: string): Promise<{ data?: Branch; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const admin = createAdminClient()
    const result = await admin
      .from('branches')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .is('deleted_at', null)
      .single() as any as any

    const { data, error } = result as { data: Branch | null; error: any }

    if (error || !data) {
      console.error('Error fetching branch:', error)
      return { error: 'Branch not found' }
    }

    return { data }
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

export async function createBranch(
  input: CreateBranchInput,
): Promise<{ data?: Branch; success?: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()
    const result = await supabase
      .from('branches')
      .insert({
        organization_id: organization.id,
        name: input.name,
        address: input.address || null,
        phone: input.phone || null,
      } as any)
      .select()
      .single()
      .overrideTypes<Branch>() as any

    const { data, error } = result as { data: Branch | null; error: any }

    if (error || !data) {
      console.error('Error creating branch:', error)
      return { error: 'Failed to create branch' }
    }

    // Log the create operation
    void logOperation('CREATE', 'branch', data.id, {
      after: {
        name: data.name,
        address: data.address,
        phone: data.phone,
      }
    }, organization.id)

    return { data, success: true }
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

export async function updateBranch(
  id: string,
  input: UpdateBranchInput,
): Promise<{ data?: Branch; success?: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    // Fetch before state for logging
    const beforeResult = await supabase
      .from('branches')
      .select('id, name, address, phone')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .single()
      .overrideTypes<Branch>() as any

    const { data: beforeBranch } = beforeResult as { data: Branch | null; error: any }

    if (!beforeBranch) {
      return { error: 'Branch not found or does not belong to your organization' }
    }

    const updateData: any = {}
    if (input.name !== undefined) updateData.name = input.name
    if (input.address !== undefined) updateData.address = input.address
    if (input.phone !== undefined) updateData.phone = input.phone

    const result = await (supabase as any)
      .from('branches')
      .update({ ...updateData })
      .eq('id', id)
      .eq('organization_id', organization.id)
      .select()
      .single()

    const { data, error } = result as { data: Branch | null; error: any }

    if (error || !data) {
      console.error('Error updating branch:', error)
      return { error: 'Failed to update branch' }
    }

    // Log the update operation
    const beforeObj = {
      name: beforeBranch.name,
      address: beforeBranch.address,
      phone: beforeBranch.phone,
    }
    const afterObj = {
      name: data.name,
      address: data.address,
      phone: data.phone,
    }
    const changes = getChanges(beforeObj, afterObj)
    void logOperation('UPDATE', 'branch', id, {
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

export async function deleteBranch(id: string, reason?: string): Promise<{ success?: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    // Fetch before state for logging
    const beforeResult = await supabase
      .from('branches')
      .select('id, name, address, phone')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .is('deleted_at', null)
      .single() as any as any

    const { data: beforeBranch } = beforeResult as { data: Branch | null; error: any }

    if (!beforeBranch) {
      return { error: 'Branch not found or does not belong to your organization' }
    }

    const user_id = user.id
    const updateResult = await (supabase.from('branches') as any)
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user_id,
        deleted_reason: reason || null,
      })
      .eq('id', id)
      .eq('organization_id', organization.id) as any
    const { error } = updateResult

    if (error) {
      console.error('Error deleting branch:', error)
      return { error: 'Failed to delete branch' }
    }

    // Log the delete operation
    const beforeObj = {
      name: beforeBranch.name,
      address: beforeBranch.address,
      phone: beforeBranch.phone,
    }
    void logOperation('DELETE', 'branch', id, {
      before: beforeObj,
    }, organization.id)

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
