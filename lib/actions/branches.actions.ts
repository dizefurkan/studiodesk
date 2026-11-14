'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { logOperation } from '@/lib/actions/history.actions'
import { getChanges } from '@/lib/utils/history-utils'
import type { Database } from '@/lib/types/database.types'
import type { PostgrestError } from '@supabase/supabase-js'
import type { TablesUpdate } from '@/lib/types/database.types'
import { sanitizeSearch } from '@/lib/utils/search'
import { actionError } from '@/lib/i18n/actionError'

type Branch = Database['public']['Tables']['branches']['Row']

export async function getBranches(
  searchQuery?: string,
  page: number = 1,
  pageSize: number = 10
): Promise<{ data?: Branch[]; totalCount?: number; page?: number; pageSize?: number; totalPages?: number; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated'), data: [], totalCount: 0 }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization'), data: [], totalCount: 0 }

  try {
    const admin = createAdminClient()

    // Count query
    let countQuery = admin
      .from('branches')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organization.id)
      .is('deleted_at', null)

    if (searchQuery) {
      countQuery = countQuery.or(`name.ilike.%${sanitizeSearch(searchQuery)}%,address.ilike.%${sanitizeSearch(searchQuery)}%`)
    }

    const { count: totalCount } = await countQuery
    const count = totalCount || 0

    // Data query
    let query = admin
      .from('branches')
      .select('*')
      .eq('organization_id', organization.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (searchQuery) {
      query = query.or(`name.ilike.%${sanitizeSearch(searchQuery)}%,address.ilike.%${sanitizeSearch(searchQuery)}%`)
    }

    // Apply pagination
    const offset = (page - 1) * pageSize
    query = query.range(offset, offset + pageSize - 1)

    const result = await query.overrideTypes<Branch[]>()
    const { data, error } = result as { data: Branch[] | null; error: PostgrestError | null }

    if (error) {
      console.error('Error fetching branches:', error)
      return { error: await actionError('fetchBranchesFailed'), data: [], totalCount: 0 }
    }

    const totalPages = Math.ceil(count / pageSize)
    return { data: data || [], totalCount: count, page, pageSize, totalPages }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: await actionError('unexpected'), data: [], totalCount: 0 }
  }
}

export async function getBranch(id: string): Promise<{ data?: Branch; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  try {
    const admin = createAdminClient()
    const result = await admin
      .from('branches')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .is('deleted_at', null)
      .single()

    const { data, error } = result as { data: Branch | null; error: PostgrestError | null }

    if (error || !data) {
      console.error('Error fetching branch:', error)
      return { error: await actionError('branchNotFound') }
    }

    return { data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: await actionError('unexpected') }
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
  if (!user) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  try {
    const supabase = await createServerSupabaseClient()
    const result = await supabase
      .from('branches')
      .insert({
        organization_id: organization.id,
        name: input.name,
        address: input.address || null,
        phone: input.phone || null,
      })
      .select()
      .single()
      .overrideTypes<Branch>()

    const { data, error } = result as { data: Branch | null; error: PostgrestError | null }

    if (error || !data) {
      console.error('Error creating branch:', error)
      return { error: await actionError('createBranchFailed') }
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
    return { error: await actionError('unexpected') }
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
  if (!user) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  try {
    const supabase = await createServerSupabaseClient()

    // Fetch before state for logging
    const beforeResult = await supabase
      .from('branches')
      .select('id, name, address, phone')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .single()
      .overrideTypes<Branch>()

    const { data: beforeBranch } = beforeResult as { data: Branch | null; error: PostgrestError | null }

    if (!beforeBranch) {
      return { error: await actionError('branchNotInOrg') }
    }

    const updateData: TablesUpdate<'branches'> = {}
    if (input.name !== undefined) updateData.name = input.name
    if (input.address !== undefined) updateData.address = input.address
    if (input.phone !== undefined) updateData.phone = input.phone

    const result = await supabase
      .from('branches')
      .update({ ...updateData })
      .eq('id', id)
      .eq('organization_id', organization.id)
      .select()
      .single()

    const { data, error } = result as { data: Branch | null; error: PostgrestError | null }

    if (error || !data) {
      console.error('Error updating branch:', error)
      return { error: await actionError('updateBranchFailed') }
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
    return { error: await actionError('unexpected') }
  }
}

export async function deleteBranch(id: string, reason?: string): Promise<{ success?: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  try {
    const supabase = await createServerSupabaseClient()

    // Fetch before state for logging
    const beforeResult = await supabase
      .from('branches')
      .select('id, name, address, phone')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .is('deleted_at', null)
      .single()

    const { data: beforeBranch } = beforeResult as { data: Branch | null; error: PostgrestError | null }

    if (!beforeBranch) {
      return { error: await actionError('branchNotInOrg') }
    }

    const user_id = user.id
    const updateResult = await supabase.from('branches')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user_id,
        deleted_reason: reason || null,
      })
      .eq('id', id)
      .eq('organization_id', organization.id)
    const { error } = updateResult

    if (error) {
      console.error('Error deleting branch:', error)
      return { error: await actionError('deleteBranchFailed') }
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
    return { error: await actionError('unexpected') }
  }
}
