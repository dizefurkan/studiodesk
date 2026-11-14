'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { logOperation } from '@/lib/actions/history.actions'
import { getChanges } from '@/lib/utils/history-utils'
import type { Database } from '@/lib/types/database.types'
import type { TablesUpdate } from '@/lib/types/database.types'
import { actionError } from '@/lib/i18n/actionError'

type Package = Database['public']['Tables']['packages']['Row']

export async function getPackages(
  searchQuery?: string,
  page: number = 1,
  pageSize: number = 10
) {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated'), data: [], totalCount: 0 }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization'), data: [], totalCount: 0 }

  try {
    const admin = createAdminClient()

    // Count query
    let countQuery = admin
      .from('packages')
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
      .from('packages')
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

    const { data, error } = await query

    if (error) {
      console.error('Error fetching packages:', error)
      return { error: await actionError('fetchPackagesFailed'), data: [], totalCount: 0 }
    }

    const totalPages = Math.ceil(count / pageSize)
    return { data: data as Package[], totalCount: count, page, pageSize, totalPages }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: await actionError('unexpected'), data: [], totalCount: 0 }
  }
}

export async function getPackage(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('packages')
      .select('*, dance_types(name)')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .is('deleted_at', null)
      .single()

    if (error) {
      console.error('Error fetching package:', error)
      return { error: await actionError('packageNotFound') }
    }

    return { data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: await actionError('unexpected') }
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
  if (!user) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await (supabase
      .from('packages'))
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
      return { error: await actionError('createPackageFailed') }
    }

    // Log the create operation
    void logOperation('CREATE', 'package', data.id, {
      after: {
        name: data.name,
        danceTypeId: data.dance_type_id,
        totalCredits: data.total_credits,
        price: data.price,
      }
    }, organization.id)

    return { data: data as Package, success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: await actionError('unexpected') }
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
  if (!user) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

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
      return { error: await actionError('packageNotInOrg') }
    }

    const updateData: TablesUpdate<'packages'> = {}
    if (input.name !== undefined) updateData.name = input.name
    if (input.danceTypeId !== undefined) updateData.dance_type_id = input.danceTypeId
    if (input.totalCredits !== undefined) updateData.total_credits = input.totalCredits
    if (input.price !== undefined) updateData.price = input.price

    console.log('[updatePackage] Package ID:', id)
    console.log('[updatePackage] Update data:', updateData)

    const { data, error } = await supabase.from('packages')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organization.id)
      .select()
      .single()

    console.log('[updatePackage] Error:', error)
    console.log('[updatePackage] Data:', data)

    if (error) {
      console.error('Error updating package:', error)
      return { error: await actionError('updatePackageFailed') }
    }

    // Log the update operation
    const beforeObj = {
      name: beforePackage.name,
      danceTypeId: beforePackage.dance_type_id,
      totalCredits: beforePackage.total_credits,
      price: beforePackage.price,
    }
    const afterObj = {
      name: data.name,
      danceTypeId: data.dance_type_id,
      totalCredits: data.total_credits,
      price: data.price,
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
    return { error: await actionError('unexpected') }
  }
}

export async function deletePackage(id: string, reason?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

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
      return { error: await actionError('packageNotInOrg') }
    }

    const user_id = user.id
    const updateResult = await supabase.from('packages')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user_id,
        deleted_reason: reason || null,
      })
      .eq('id', id)
      .eq('organization_id', organization.id)
    const { error } = updateResult

    if (error) {
      console.error('Error deleting package:', error)
      return { error: await actionError('deletePackageFailed') }
    }

    // Log the delete operation
    const beforeObj = {
      name: beforePackage.name,
      danceTypeId: beforePackage.dance_type_id,
      totalCredits: beforePackage.total_credits,
      price: beforePackage.price,
    }
    void logOperation('DELETE', 'package', id, {
      before: beforeObj,
    }, organization.id)

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: await actionError('unexpected') }
  }
}
