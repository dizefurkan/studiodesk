'use server'

import { unstable_rethrow } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPayAccess } from '@/lib/auth/payAccess'
import { sanitizeSearch } from '@/lib/utils/search'
import { actionError } from '@/lib/i18n/actionError'
import { logOperation } from '@/lib/actions/history.actions'
import { isDateLocked, parseDate } from '@/lib/earnings/periods'
import { recalculateSessionEarnings } from '@/lib/earnings/sessionEarnings'

export type EarningsFilters = {
  search?: string
  instructorId?: string
  /** yyyy-MM-dd, inclusive (lesson date) */
  from?: string
  /** yyyy-MM-dd, inclusive (lesson date) */
  to?: string
}

const empty = { data: [], totalCount: 0, totalAmount: 0 }

/**
 * Earnings rows, newest lesson first. Owners and managers see everyone; instructors only
 * their own rows; staff nothing. Dates filter on the lesson date (earned_on).
 */
export async function getInstructorEarnings(filters: EarningsFilters = {}, page: number = 1, pageSize: number = 10) {
  const access = await getPayAccess()
  if (!access) return { error: await actionError('notAuthenticated'), ...empty }
  if (!access.canManage && access.ownInstructorIds.length === 0) return { error: await actionError('noPayPermission'), ...empty }

  try {
    const admin = createAdminClient()
    const search = filters.search ? sanitizeSearch(filters.search) : ''
    const from = parseDate(filters.from)
    const to = parseDate(filters.to)

    // Service-role client bypasses RLS, so the organization filter is part of the query
    const scoped = <
      Q extends {
        eq: (column: string, value: string) => Q
        in: (column: string, values: string[]) => Q
        gte: (column: string, value: string) => Q
        lte: (column: string, value: string) => Q
        or: (filters: string, options?: { referencedTable?: string }) => Q
      },
    >(
      query: Q
    ) => {
      let q = query.eq('instructors.organization_id', access.organizationId)
      if (!access.canManage) q = q.in('instructor_id', access.ownInstructorIds)
      if (filters.instructorId) q = q.eq('instructor_id', filters.instructorId)
      if (from) q = q.gte('earned_on', from)
      if (to) q = q.lte('earned_on', to)
      if (search) q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`, { referencedTable: 'instructors' })
      return q
    }

    const offset = (page - 1) * pageSize
    const [listResult, totalsResult] = await Promise.all([
      scoped(
        admin
          .from('instructor_earnings')
          .select(
            'id, amount, calculated_amount, is_manual, earned_on, session_id, instructor_id, instructors!inner(id, first_name, last_name, organization_id), course_sessions(courses(name))',
            { count: 'exact' }
          )
      )
        .order('earned_on', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1),
      // Sum over the whole filtered set, not just the current page
      scoped(admin.from('instructor_earnings').select('amount, instructors!inner(organization_id)')).limit(100000),
    ])

    if (listResult.error || totalsResult.error) {
      console.error('Error fetching earnings:', listResult.error ?? totalsResult.error)
      return { error: await actionError('fetchEarningsFailed'), ...empty }
    }

    const count = listResult.count ?? 0
    const totalAmount = (totalsResult.data || []).reduce((sum, e) => sum + Number(e.amount), 0)
    return {
      data: listResult.data || [],
      totalCount: count,
      totalAmount,
      canManage: access.canManage,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Unexpected error in getInstructorEarnings:', error)
    return { error: await actionError('unexpected'), ...empty }
  }
}

/** An earning of the user's organization, or null. */
async function findEarning(earningId: string, organizationId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('instructor_earnings')
    .select('id, amount, is_manual, earned_on, session_id, instructor_id, instructors!inner(organization_id)')
    .eq('id', earningId)
    .eq('instructors.organization_id', organizationId)
    .maybeSingle()
  return data
}

/**
 * Sets an earning's amount by hand. The row is marked manual, so later recalculations keep
 * this amount (they still refresh the calculated amount shown next to it).
 */
export async function updateInstructorEarnings(earningId: string, amount: number) {
  const access = await getPayAccess()
  if (!access) return { error: await actionError('notAuthenticated') }
  if (!access.canManage) return { error: await actionError('noPayPermission') }
  if (!Number.isFinite(amount) || amount < 0) return { error: await actionError('invalidAmount') }

  try {
    const earning = await findEarning(earningId, access.organizationId)
    if (!earning) return { error: await actionError('earningNotFound') }

    const admin = createAdminClient()
    if (await isDateLocked(admin, access.organizationId, earning.earned_on)) {
      return { error: await actionError('periodLocked') }
    }

    const rounded = Math.round(amount * 100) / 100
    const { error } = await admin
      .from('instructor_earnings')
      .update({ amount: rounded, is_manual: true })
      .eq('id', earningId)
    if (error) {
      console.error('Error updating earning:', error)
      return { error: await actionError('updateEarningFailed') }
    }

    void logOperation(
      'UPDATE',
      'instructor_earning',
      earningId,
      {
        before: { amount: earning.amount },
        after: { amount: rounded },
        changes: { amount: { before: earning.amount, after: rounded } },
      },
      access.organizationId
    )
    return { success: true }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Unexpected error in updateInstructorEarnings:', error)
    return { error: await actionError('unexpected') }
  }
}

/** Drops a hand-set amount and goes back to the calculated one. */
export async function resetInstructorEarnings(earningId: string) {
  const access = await getPayAccess()
  if (!access) return { error: await actionError('notAuthenticated') }
  if (!access.canManage) return { error: await actionError('noPayPermission') }

  try {
    const earning = await findEarning(earningId, access.organizationId)
    if (!earning) return { error: await actionError('earningNotFound') }

    const admin = createAdminClient()
    if (await isDateLocked(admin, access.organizationId, earning.earned_on)) {
      return { error: await actionError('periodLocked') }
    }

    const { error } = await admin.from('instructor_earnings').update({ is_manual: false }).eq('id', earningId)
    if (error) return { error: await actionError('updateEarningFailed') }

    const recalc = await recalculateSessionEarnings(earning.session_id)
    if (recalc.error) {
      console.error('Error recalculating earnings:', recalc.error)
      return { error: await actionError('updateEarningFailed') }
    }

    const { data: after } = await admin.from('instructor_earnings').select('amount').eq('id', earningId).maybeSingle()
    void logOperation(
      'UPDATE',
      'instructor_earning',
      earningId,
      {
        before: { amount: earning.amount },
        after: { amount: after?.amount ?? earning.amount },
        changes: { amount: { before: earning.amount, after: after?.amount ?? earning.amount } },
      },
      access.organizationId
    )
    return { success: true }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Unexpected error in resetInstructorEarnings:', error)
    return { error: await actionError('unexpected') }
  }
}
