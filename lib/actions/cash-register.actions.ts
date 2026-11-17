'use server'

import { AUTOMATIC_CATEGORIES, isCategoryFor, type CashCategory } from '@/lib/cash/categories'

import { toDateString } from '@/lib/i18n/dates'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { logOperation } from '@/lib/actions/history.actions'
import type { Database } from '@/lib/types/database.types'
import type { PostgrestError } from '@supabase/supabase-js'
import { sanitizeSearch } from '@/lib/utils/search'
import { actionError } from '@/lib/i18n/actionError'
import { unstable_rethrow } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPayAccess } from '@/lib/auth/payAccess'
import { isDateLocked, parseDate } from '@/lib/earnings/periods'
import { recalculateEarningsForStudentPackage } from '@/lib/earnings/sessionEarnings'

type CashTransaction = Database['public']['Tables']['cash_transactions']['Row']
type Branch = Database['public']['Tables']['branches']['Row']

type TransactionWithBranch = CashTransaction & {
  branches: { name: string } | null
}

interface CreateTransactionInput {
  branchId: string
  type: 'income' | 'expense'
  amount: number
  category?: CashCategory
  /** Required for the "other" category, an optional note otherwise */
  description?: string | null
  studentPackageId?: string
}

export async function getTransactions(
  searchQuery?: string,
  page: number = 1,
  pageSize: number = 10
): Promise<{ data?: TransactionWithBranch[]; totalCount?: number; page?: number; pageSize?: number; totalPages?: number; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated'), data: [], totalCount: 0 }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization'), data: [], totalCount: 0 }

  try {
    const supabase = await createServerSupabaseClient()

    // Count query
    let countQuery = supabase
      .from('cash_transactions')
      .select('id', { count: 'exact', head: true })

    if (searchQuery) {
      countQuery = countQuery.or(`description.ilike.%${sanitizeSearch(searchQuery)}%,type.ilike.%${sanitizeSearch(searchQuery)}%`)
    }

    const { count: totalCount } = await countQuery
    const count = totalCount || 0

    // Data query
    let query = supabase
      .from('cash_transactions')
      .select('*, branches(name)')
      .order('created_at', { ascending: false })

    if (searchQuery) {
      query = query.or(`description.ilike.%${sanitizeSearch(searchQuery)}%,type.ilike.%${sanitizeSearch(searchQuery)}%`)
    }

    // Apply pagination
    const offset = (page - 1) * pageSize
    query = query.range(offset, offset + pageSize - 1)

    const result = await query.overrideTypes<TransactionWithBranch[]>() as { data: TransactionWithBranch[] | null; error: PostgrestError | null }
    const { data, error } = result

    if (error) {
      console.error('Error fetching transactions:', error)
      return { error: await actionError('fetchTransactionsFailed'), data: [], totalCount: 0 }
    }

    const totalPages = Math.ceil(count / pageSize)
    return { data: data || [], totalCount: count, page, pageSize, totalPages }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: await actionError('unexpected'), data: [], totalCount: 0 }
  }
}

export async function createTransaction(
  input: CreateTransactionInput,
): Promise<{ data?: CashTransaction; success?: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  try {
    const supabase = await createServerSupabaseClient()

    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .select('id')
      .eq('id', input.branchId)
      .eq('organization_id', organization.id)
      .single()
      .overrideTypes<Branch>()

    if (branchError || !branch) {
      return { error: await actionError('invalidBranch') }
    }

    // Category must fit the type; "other" needs a description
    const category = input.category ?? 'other'
    const description = input.description?.trim() || null
    if (!isCategoryFor(input.type, category)) return { error: await actionError('invalidInput') }
    // Package sales and instructor payouts come from their own screens, which keep balances right
    if (!input.studentPackageId && AUTOMATIC_CATEGORIES.includes(category)) return { error: await actionError('invalidInput') }
    if (category === 'other' && (!description || description.length < 3)) {
      return { error: await actionError('descriptionRequired') }
    }

    const result = await supabase
      .from('cash_transactions')
      .insert({
        branch_id: input.branchId,
        type: input.type,
        amount: input.amount,
        category,
        description,
        student_package_id: input.studentPackageId || null,
      })
      .select()
      .single()
      .overrideTypes<CashTransaction>()

    const { data, error } = result as { data: CashTransaction | null; error: PostgrestError | null }

    if (error || !data) {
      console.error('Error creating transaction:', error)
      return { error: await actionError('createTransactionFailed') }
    }

    // A package payment changes what its lessons are worth, so their earnings follow
    if (data.student_package_id) {
      const recalc = await recalculateEarningsForStudentPackage(data.student_package_id)
      if (recalc.error) console.error('Error recalculating earnings:', recalc.error)
    }

    // Log the create operation
    void logOperation('CREATE', 'cash_register', data.id, {
      after: {
        type: data.type,
        amount: data.amount,
        category: data.category,
        description: data.description,
        branchId: data.branch_id,
        studentPackageId: data.student_package_id,
      }
    }, organization.id)

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: await actionError('unexpected') }
  }
}

export async function deleteTransaction(
  id: string,
): Promise<{ success?: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  try {
    const supabase = await createServerSupabaseClient()

    // Fetch before state for logging
    const result = await supabase
      .from('cash_transactions')
      .select('id, type, amount, description, branch_id, student_package_id')
      .eq('id', id)
      .single()
      .overrideTypes<CashTransaction>()

    const { data: beforeTransaction, error: fetchError } = result as { data: CashTransaction | null; error: PostgrestError | null }

    if (!beforeTransaction) {
      return { error: await actionError('transactionNotFound') }
    }

    // An instructor payment in a closed month stays (deleting this entry would delete it)
    const admin = createAdminClient()
    const { data: payout } = await admin
      .from('instructor_payouts')
      .select('paid_on, organization_id')
      .eq('cash_transaction_id', id)
      .maybeSingle()
    if (payout && (await isDateLocked(admin, payout.organization_id, payout.paid_on))) {
      return { error: await actionError('linkedPayoutLocked') }
    }

    const { error } = await supabase
      .from('cash_transactions')
      .delete()
      .eq('id', id)
      .overrideTypes<CashTransaction>()

    if (error) {
      console.error('Error deleting transaction:', error)
      return { error: await actionError('deleteTransactionFailed') }
    }

    if (beforeTransaction.student_package_id) {
      const recalc = await recalculateEarningsForStudentPackage(beforeTransaction.student_package_id)
      if (recalc.error) console.error('Error recalculating earnings:', recalc.error)
    }

    // Log the delete operation
    const beforeObj = {
      type: beforeTransaction.type,
      amount: beforeTransaction.amount,
      description: beforeTransaction.description,
      branchId: beforeTransaction.branch_id,
      studentPackageId: beforeTransaction.student_package_id,
    }
    void logOperation('DELETE', 'cash_register', id, {
      before: beforeObj,
    }, organization.id)

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: await actionError('unexpected') }
  }
}

type DailyReportSummary = {
  income: number
  expenses: number
  balance: number
  count: number
}

type DailyReportData = {
  transactions: CashTransaction[]
  summary: DailyReportSummary
}

export async function getDailyReport(
  branchId: string,
  date: string,
): Promise<{ success?: boolean; data?: DailyReportData; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }

  try {
    const supabase = await createServerSupabaseClient()

    const startOfDay = `${date}T00:00:00`
    const endOfDay = `${date}T23:59:59`

    const result = await supabase
      .from('cash_transactions')
      .select('*')
      .eq('branch_id', branchId)
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)
      .overrideTypes<CashTransaction[]>()

    const { data, error } = result as { data: CashTransaction[] | null; error: PostgrestError | null }

    if (error) {
      console.error('Error fetching daily report:', error)
      return { error: await actionError('fetchReportFailed') }
    }

    const transactions = data || []
    const income = transactions
      .filter((t: CashTransaction) => t.type === 'income')
      .reduce((sum: number, t: CashTransaction) => sum + Number(t.amount), 0)
    const expenses = transactions
      .filter((t: CashTransaction) => t.type === 'expense')
      .reduce((sum: number, t: CashTransaction) => sum + Number(t.amount), 0)
    const balance = income - expenses

    return {
      success: true,
      data: {
        transactions,
        summary: {
          income,
          expenses,
          balance,
          count: transactions.length,
        },
      },
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: await actionError('unexpected') }
  }
}

export async function getMonthlyReport(
  branchId: string,
  year: number,
  month: number,
): Promise<{ success?: boolean; data?: DailyReportData; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }

  try {
    const supabase = await createServerSupabaseClient()

    const startDate = toDateString(new Date(year, month - 1, 1))
    const endDate = toDateString(new Date(year, month, 0))

    const result = await supabase
      .from('cash_transactions')
      .select('*')
      .eq('branch_id', branchId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .overrideTypes<CashTransaction[]>()

    const { data, error } = result as { data: CashTransaction[] | null; error: PostgrestError | null }

    if (error) {
      console.error('Error fetching monthly report:', error)
      return { error: await actionError('fetchReportFailed') }
    }

    const transactions = data || []
    const income = transactions
      .filter((t: CashTransaction) => t.type === 'income')
      .reduce((sum: number, t: CashTransaction) => sum + Number(t.amount), 0)
    const expenses = transactions
      .filter((t: CashTransaction) => t.type === 'expense')
      .reduce((sum: number, t: CashTransaction) => sum + Number(t.amount), 0)
    const balance = income - expenses

    return {
      success: true,
      data: {
        transactions,
        summary: {
          income,
          expenses,
          balance,
          count: transactions.length,
        },
      },
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: await actionError('unexpected') }
  }
}

/**
 * Instructor earnings of lessons held between two dates (lesson date), optionally at one
 * branch. Earnings are what instructors are owed, not cash; payments show up as expenses.
 * Owners and managers only.
 */
export async function getInstructorEarningsByBranch(branchId?: string, fromDate?: string, toDate?: string) {
  const access = await getPayAccess()
  if (!access?.canManage) return { data: [] }

  try {
    const admin = createAdminClient()
    let query = admin
      .from('instructor_earnings')
      .select(
        'id, instructor_id, session_id, amount, earned_on, created_at, instructors!inner(first_name, last_name, organization_id), course_sessions!inner(courses!inner(branch_id, name, branches(id, name)))'
      )
      // Service-role client: the organization filter is part of the query
      .eq('instructors.organization_id', access.organizationId)
      .order('earned_on', { ascending: false })
    const from = parseDate(fromDate)
    const to = parseDate(toDate)
    if (from) query = query.gte('earned_on', from)
    if (to) query = query.lte('earned_on', to)
    if (branchId) query = query.eq('course_sessions.courses.branch_id', branchId)

    const { data, error } = await query
    if (error) {
      console.error('Error fetching earnings:', error)
      return { data: [] }
    }
    return { data: data ?? [] }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Unexpected error in getInstructorEarningsByBranch:', error)
    return { data: [] }
  }
}

/** UTC instant of local midnight at the start of `day` (YYYY-MM-DD) in `timeZone`. */
function startOfDayUtc(day: string, timeZone: string): string {
  const guess = new Date(`${day}T00:00:00Z`)
  // How far the time zone is ahead of UTC at that moment
  const local = new Date(guess.toLocaleString('en-US', { timeZone }))
  const utc = new Date(guess.toLocaleString('en-US', { timeZone: 'UTC' }))
  return new Date(guess.getTime() - (local.getTime() - utc.getTime())).toISOString()
}

/**
 * Cash entries for the cash register page, filtered on the server: branch, type, category and
 * a day range (inclusive, in the studio's time zone). Not paginated; capped for safety.
 */
export async function getCashTransactions(filters: {
  branchId?: string
  type?: 'income' | 'expense'
  category?: string
  from?: string
  to?: string
}) {
  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization'), data: [] }
  const timeZone = organization.timezone || 'Europe/Istanbul'

  try {
    const admin = createAdminClient()
    let query = admin
      .from('cash_transactions')
      .select('id, type, category, amount, description, created_at, branch_id, student_package_id, branches!inner(name, organization_id)')
      .eq('branches.organization_id', organization.id)
      .order('created_at', { ascending: false })
      .limit(2000)
    if (filters.branchId) query = query.eq('branch_id', filters.branchId)
    if (filters.type) query = query.eq('type', filters.type)
    if (filters.category) query = query.eq('category', filters.category)
    const from = parseDate(filters.from)
    const to = parseDate(filters.to)
    if (from) query = query.gte('created_at', startOfDayUtc(from, timeZone))
    if (to) {
      const next = new Date(`${to}T00:00:00Z`)
      next.setUTCDate(next.getUTCDate() + 1)
      query = query.lt('created_at', startOfDayUtc(next.toISOString().slice(0, 10), timeZone))
    }
    const { data, error } = await query
    if (error) throw error
    return {
      data: (data ?? []).map((t) => ({
        id: t.id,
        type: t.type as 'income' | 'expense',
        category: t.category,
        amount: Number(t.amount),
        description: t.description,
        created_at: t.created_at,
        branches: t.branches ? { name: t.branches.name } : null,
      })),
    }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Error in getCashTransactions:', error)
    return { error: await actionError('fetchTransactionsFailed'), data: [] }
  }
}
