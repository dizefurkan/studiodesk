'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { logOperation } from '@/lib/actions/history.actions'
import type { Database } from '@/lib/types/database.types'
import type { PostgrestError } from '@supabase/supabase-js'
import { sanitizeSearch } from '@/lib/utils/search'
import { actionError } from '@/lib/i18n/actionError'

type CashTransaction = Database['public']['Tables']['cash_transactions']['Row']
type Branch = Database['public']['Tables']['branches']['Row']

type TransactionWithBranch = CashTransaction & {
  branches: { name: string } | null
}

interface CreateTransactionInput {
  branchId: string
  type: 'income' | 'expense'
  amount: number
  description: string
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

    const result = await supabase
      .from('cash_transactions')
      .insert({
        branch_id: input.branchId,
        type: input.type,
        amount: input.amount,
        description: input.description,
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

    // Log the create operation
    void logOperation('CREATE', 'cash_register', data.id, {
      after: {
        type: data.type,
        amount: data.amount,
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

    const { error } = await supabase
      .from('cash_transactions')
      .delete()
      .eq('id', id)
      .overrideTypes<CashTransaction>()

    if (error) {
      console.error('Error deleting transaction:', error)
      return { error: await actionError('deleteTransactionFailed') }
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

    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

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

type Instructor = Database['public']['Tables']['instructors']['Row']
type CourseSession = Database['public']['Tables']['course_sessions']['Row']
type Course = Database['public']['Tables']['courses']['Row']

type Earnings = {
  id: string
  instructor_id: string
  session_id: string
  amount: number
  created_at: string
}

type EnrichedEarnings = Earnings & {
  instructors?: Instructor
  course_sessions?: CourseSession & {
    courses?: Course & {
      branches?: Branch
    }
  }
}

export async function getInstructorEarningsByBranch(
  branchId?: string,
  fromDate?: string,
  toDate?: string,
): Promise<{ data?: EnrichedEarnings[]; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  try {
    const supabase = await createServerSupabaseClient()

    // Verify branch belongs to organization if specified
    if (branchId) {
      const result = await supabase
        .from('branches')
        .select('id')
        .eq('id', branchId)
        .eq('organization_id', organization.id)
        .maybeSingle()
        .overrideTypes<Branch>()

      const { data: branch, error: branchError } = result as { data: Branch | null; error: PostgrestError | null }

      if (branchError || !branch) {
        console.warn('[getInstructorEarningsByBranch] Branch not found or access denied:', branchId)
        return { data: [] }
      }
    }

    // Get earnings for instructors with safer query structure
    let query = supabase
      .from('instructor_earnings')
      .select('id, instructor_id, session_id, amount, created_at')
      .order('created_at', { ascending: false })
      .limit(1000)  // Add limit to prevent excessive data

    // Convert date strings to ISO format with time boundaries
    if (fromDate) {
      const startOfDay = `${fromDate}T00:00:00`
      query = query.gte('created_at', startOfDay)
    }

    if (toDate) {
      const endOfDay = `${toDate}T23:59:59`
      query = query.lte('created_at', endOfDay)
    }

    const result = await query.overrideTypes<Earnings[]>()
    const { data: earnings, error } = result as { data: Earnings[] | null; error: PostgrestError | null }

    if (error) {
      console.error('Error fetching earnings:', error)
      return { error: await actionError('fetchEarningsFailed') }
    }

    if (!earnings || earnings.length === 0) {
      return { data: [] }
    }

    // Fetch related data more safely
    const instructorIds = [...new Set(earnings.map((e) => e.instructor_id))]
    const sessionIds = [...new Set(earnings.map((e) => e.session_id))]

    const [
      { data: instructors },
      { data: sessions },
    ] = await Promise.all([
      supabase
        .from('instructors')
        .select('id, first_name, last_name')
        .in('id', instructorIds)
        .overrideTypes<Instructor[]>(),
      supabase
        .from('course_sessions')
        .select('id, course_id, courses(id, branch_id, name, branches(id, name))')
        .in('id', sessionIds)
        .overrideTypes<(CourseSession & {
          courses: Course & { branches: Branch }
        })[]>(),
    ])

    const instructorMap = new Map(instructors?.map((i: Instructor) => [i.id, i]) || [])
    const sessionMap = new Map(sessions?.map((s) => [s.id, s]) || [])

    // Enrich earnings with related data
    const enrichedEarnings = earnings.map((e) => ({
      ...e,
      instructors: instructorMap.get(e.instructor_id) as Instructor | undefined,
      course_sessions: sessionMap.get(e.session_id) as (CourseSession & { courses: Course & { branches: Branch } }) | undefined,
    })) as EnrichedEarnings[]

    // Filter by branch if specified
    let filtered = enrichedEarnings
    if (branchId) {
      filtered = filtered.filter((earning) => earning.course_sessions?.courses?.branch_id === branchId)
    }

    console.log('[getInstructorEarningsByBranch] Fetched:', { 
      total: earnings.length, 
      filtered: filtered.length, 
      branchId,
      dates: { fromDate, toDate }
    })

    return { data: filtered }
  } catch (error) {
    console.error('Unexpected error:', error)
    // Return empty array instead of error to prevent page crash
    return { data: [] }
  }
}
