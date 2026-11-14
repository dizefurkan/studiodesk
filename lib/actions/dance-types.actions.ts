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
import { actionError } from '@/lib/i18n/actionError'

type DanceType = Database['public']['Tables']['dance_types']['Row']

export async function getDanceTypes(
  searchQuery?: string,
  page: number = 1,
  pageSize: number = 10
): Promise<{ data?: DanceType[]; totalCount?: number; page?: number; pageSize?: number; totalPages?: number; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated'), data: [], totalCount: 0 }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization'), data: [], totalCount: 0 }

  try {
    const admin = createAdminClient()

    // Count query
    let countQuery = admin
      .from('dance_types')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organization.id)
      .is('deleted_at', null)

    if (searchQuery) {
      countQuery = countQuery.ilike('name', `%${searchQuery}%`)
    }

    const { count: totalCount } = await countQuery
    const count = totalCount || 0

    // Data query
    let query = admin
      .from('dance_types')
      .select('*')
      .eq('organization_id', organization.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`)
    }

    // Apply pagination
    const offset = (page - 1) * pageSize
    query = query.range(offset, offset + pageSize - 1)

    const result = await query.overrideTypes<DanceType[]>()
    const { data, error } = result as { data: DanceType[] | null; error: PostgrestError | null }

    if (error) {
      console.error('Error fetching dance types:', error)
      return { error: await actionError('fetchDanceTypesFailed'), data: [], totalCount: 0 }
    }

    const totalPages = Math.ceil(count / pageSize)
    return { data: data || [], totalCount: count, page, pageSize, totalPages }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: await actionError('unexpected'), data: [], totalCount: 0 }
  }
}

export async function getDanceType(id: string): Promise<{ data?: DanceType; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  try {
    const admin = createAdminClient()
    const result = await admin
      .from('dance_types')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .is('deleted_at', null)
      .single()

    const { data, error } = result as { data: DanceType | null; error: PostgrestError | null }

    if (error || !data) {
      console.error('Error fetching dance type:', error)
      return { error: await actionError('danceTypeNotFound') }
    }

    return { data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: await actionError('unexpected') }
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
  if (!user) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  try {
    const supabase = await createServerSupabaseClient()
    const result = await supabase
      .from('dance_types')
      .insert({
        organization_id: organization.id,
        name: input.name,
        description: input.description,
      })
      .select()
      .single()
      .overrideTypes<DanceType>()

    const { data, error } = result as { data: DanceType | null; error: PostgrestError | null }

    if (error || !data) {
      console.error('Error creating dance type:', error)
      return { error: await actionError('createDanceTypeFailed') }
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
    return { error: await actionError('unexpected') }
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
  if (!user) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  try {
    const supabase = await createServerSupabaseClient()

    // Fetch before state for logging
    const beforeResult = await supabase
      .from('dance_types')
      .select('id, name, description')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .single()
      .overrideTypes<DanceType>()

    const { data: beforeDanceType, error: beforeError } = beforeResult as { data: DanceType | null; error: PostgrestError | null }

    if (!beforeDanceType) {
      return { error: await actionError('danceTypeNotInOrg') }
    }

    const updateData: TablesUpdate<'dance_types'> = {}
    if (input.name !== undefined) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description

    console.log('[updateDanceType] Dance Type ID:', id)
    console.log('[updateDanceType] Update data:', updateData)

    const updateResult = await supabase.from('dance_types')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organization.id)
      .select()
      .single()

    const { data, error } = updateResult as { data: DanceType | null; error: PostgrestError | null }

    console.log('[updateDanceType] Error:', error)
    console.log('[updateDanceType] Data:', data)

    if (error || !data) {
      console.error('Error updating dance type:', error)
      return { error: await actionError('updateDanceTypeFailed') }
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
    return { error: await actionError('unexpected') }
  }
}

export async function deleteDanceType(id: string, reason?: string): Promise<{ success?: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  try {
    const supabase = await createServerSupabaseClient()

    // Fetch before state for logging
    const beforeResult = await supabase
      .from('dance_types')
      .select('id, name, description')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .is('deleted_at', null)
      .single()

    const { data: beforeDanceType, error: beforeError } = beforeResult as { data: DanceType | null; error: PostgrestError | null }

    if (!beforeDanceType) {
      return { error: await actionError('danceTypeNotInOrg') }
    }

    const user_id = user.id
    const updateResult = await supabase.from('dance_types')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user_id,
        deleted_reason: reason || null,
      })
      .eq('id', id)
      .eq('organization_id', organization.id)
    const { error } = updateResult

    if (error) {
      console.error('Error deleting dance type:', error)
      return { error: await actionError('deleteDanceTypeFailed') }
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
    return { error: await actionError('unexpected') }
  }
}
