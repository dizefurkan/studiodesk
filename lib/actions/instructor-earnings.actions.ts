'use server'

import { toDateString } from '@/lib/i18n/dates'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { sanitizeSearch } from '@/lib/utils/search'
import { actionError } from '@/lib/i18n/actionError'

export type EarningsFilters = {
  search?: string
  instructorId?: string
  /** yyyy-MM-dd, inclusive */
  from?: string
  /** yyyy-MM-dd, inclusive */
  to?: string
}

export async function getInstructorEarnings(
  filters: EarningsFilters = {},
  page: number = 1,
  pageSize: number = 10
) {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated'), data: [], totalCount: 0, totalAmount: 0 }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization'), data: [], totalCount: 0, totalAmount: 0 }

  try {
    const adminSupabase = createAdminClient()
    const search = filters.search ? sanitizeSearch(filters.search) : ''

    // Service-role client bypasses RLS, so the organization filter must be part of the query
    // (inner join on instructors) — never applied in JS after pagination.
    const scoped = <Q extends { eq: (column: string, value: string) => Q; gte: (column: string, value: string) => Q; lte: (column: string, value: string) => Q; or: (filters: string, options?: { referencedTable?: string }) => Q }>(query: Q) => {
      let q = query.eq('instructors.organization_id', organization.id)
      if (filters.instructorId) q = q.eq('instructor_id', filters.instructorId)
      if (filters.from) q = q.gte('created_at', `${filters.from}T00:00:00`)
      if (filters.to) q = q.lte('created_at', `${filters.to}T23:59:59.999`)
      if (search) q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`, { referencedTable: 'instructors' })
      return q
    }

    const offset = (page - 1) * pageSize
    const [listResult, totalsResult] = await Promise.all([
      scoped(
        adminSupabase
          .from('instructor_earnings')
          .select('*, instructors!inner(id, first_name, last_name, organization_id)', { count: 'exact' })
      )
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1),
      // Sum over the whole filtered set, not just the current page
      scoped(
        adminSupabase
          .from('instructor_earnings')
          .select('amount, instructors!inner(organization_id)')
      ),
    ])

    if (listResult.error || totalsResult.error) {
      console.error('Error fetching earnings:', listResult.error ?? totalsResult.error)
      return { error: await actionError('fetchEarningsFailed'), data: [], totalCount: 0, totalAmount: 0 }
    }

    const count = listResult.count ?? 0
    const totalAmount = (totalsResult.data || []).reduce((sum, e) => sum + Number(e.amount), 0)
    return {
      data: listResult.data || [],
      totalCount: count,
      totalAmount,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    }
  } catch (error) {
    console.error('Unexpected error in getInstructorEarnings:', error)
    return { error: await actionError('unexpected'), data: [], totalCount: 0, totalAmount: 0 }
  }
}

export async function getEarningsReport(instructorId: string, year: number, month: number) {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  try {
    // Use admin client to bypass RLS for efficiency, but verify instructor belongs to organization
    const adminSupabase = createAdminClient()

    const startDate = toDateString(new Date(year, month - 1, 1))
    const endDate = toDateString(new Date(year, month, 0))

    // Verify instructor belongs to organization first
    const { data: instructor, error: instructorError } = await (adminSupabase
      .from('instructors'))
      .select('organization_id')
      .eq('id', instructorId)
      .single()

    if (instructorError || !instructor || instructor.organization_id !== organization.id) {
      return { error: await actionError('instructorAccessDenied') }
    }

    const { data, error } = await (adminSupabase
      .from('instructor_earnings'))
      .select('*')
      .eq('instructor_id', instructorId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (error) {
      console.error('Error fetching report:', {
        error,
        message: error?.message,
        details: error?.details,
      })
      return { error: await actionError('fetchReportFailed') }
    }

    const total = ((data || [])).reduce((sum: number, e) => sum + Number(e.amount), 0)
    const count = data?.length || 0

    return {
      success: true,
      data: {
        earnings: data,
        summary: {
          total,
          count,
          average: count > 0 ? total / count : 0,
        },
      },
    }
  } catch (error) {
    console.error('Unexpected error in getEarningsReport:', {
      error,
      message: error instanceof Error ? error.message : String(error),
    })
    return { error: await actionError('unexpected') }
  }
}

export async function updateInstructorEarnings(earningsId: string, amount: number) {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  try {
    const supabase = await createServerSupabaseClient()

    // Verify the earning belongs to an instructor in the user's organization
    const { data: earning, error: fetchError } = await (supabase
      .from('instructor_earnings'))
      .select('*, instructors(organization_id)')
      .eq('id', earningsId)
      .single()

    console.log('[updateInstructorEarnings] Fetched earning:', { earning, fetchError, userId: user.id })

    if (fetchError || !earning || earning.instructors?.organization_id !== organization.id) {
      console.error('[updateInstructorEarnings] Access denied or not found', { fetchError, organization: organization.id })
      return { error: await actionError('earningNotFound') }
    }

    // Use admin client to bypass RLS (we've already verified organization access above)
    const adminSupabase = createAdminClient()
    
    // Update the amount
    console.log('[updateInstructorEarnings] Attempting update:', { earningsId, newAmount: amount, oldAmount: earning.amount })
    const { error: updateError, count } = await (adminSupabase
      .from('instructor_earnings'))
      .update({ amount })
      .eq('id', earningsId)

    console.log('[updateInstructorEarnings] Update response:', { updateError, count })

    if (updateError) {
      console.error('Error updating earnings:', updateError)
      return { error: `Failed to update earnings: ${updateError.message || updateError}` }
    }

    // Verify the update was successful by fetching the record again
    const { data: updatedEarning, error: verifyError } = await (adminSupabase
      .from('instructor_earnings'))
      .select('amount')
      .eq('id', earningsId)
      .single()

    console.log('[updateInstructorEarnings] Verification:', { updatedEarning, verifyError })

    if (updatedEarning?.amount !== amount) {
      console.error('[updateInstructorEarnings] Verification failed - amount not updated', { expected: amount, actual: updatedEarning?.amount })
      return { error: await actionError('updateNotVerified') }
    }

    return { success: true, message: 'Earnings updated successfully', data: updatedEarning }
  } catch (error) {
    console.error('Unexpected error in updateInstructorEarnings:', error)
    return { error: await actionError('unexpectedWithDetail', { detail: error instanceof Error ? error.message : String(error) }) }
  }
}

export async function deleteInstructorEarnings(earningsId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  try {
    const supabase = await createServerSupabaseClient()

    // Verify the earning belongs to an instructor in the user's organization
    const { data: earning, error: fetchError } = await (supabase
      .from('instructor_earnings'))
      .select('*, instructors(organization_id)')
      .eq('id', earningsId)
      .single()

    console.log('[deleteInstructorEarnings] Fetched earning:', { earning, fetchError, userId: user.id })

    if (fetchError || !earning || earning.instructors?.organization_id !== organization.id) {
      console.error('[deleteInstructorEarnings] Access denied or not found', { fetchError, organization: organization.id })
      return { error: await actionError('earningNotFound') }
    }

    // Delete the earning
    console.log('[deleteInstructorEarnings] Attempting delete:', { earningsId })
    
    // Use admin client to bypass RLS (we've already verified organization access above)
    const adminSupabase = createAdminClient()
    
    const { error: deleteError, count } = await (adminSupabase
      .from('instructor_earnings'))
      .delete()
      .eq('id', earningsId)

    console.log('[deleteInstructorEarnings] Delete response:', { deleteError, count })

    if (deleteError) {
      console.error('Error deleting earnings:', deleteError)
      return { error: `Failed to delete earnings: ${deleteError.message || deleteError}` }
    }

    // Verify the deletion was successful
    const { data: verifyData, error: verifyError } = await (adminSupabase
      .from('instructor_earnings'))
      .select('id')
      .eq('id', earningsId)
      .single()

    console.log('[deleteInstructorEarnings] Verification:', { verifyData, verifyError })

    if (verifyData) {
      console.error('[deleteInstructorEarnings] Verification failed - record still exists')
      return { error: await actionError('deleteNotVerified') }
    }

    return { success: true, message: 'Earnings deleted successfully' }
  } catch (error) {
    console.error('Unexpected error in deleteInstructorEarnings:', error)
    return { error: await actionError('unexpectedWithDetail', { detail: error instanceof Error ? error.message : String(error) }) }
  }
}
