'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { logOperation } from '@/lib/actions/history.actions'
import { getChanges } from '@/lib/utils/history-utils'
import type { Database } from '@/lib/types/database.types'

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
  branchId?: string,
  type?: 'income' | 'expense',
  fromDate?: string,
  toDate?: string,
): Promise<{ data?: TransactionWithBranch[]; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('cash_transactions')
      .select('*, branches(name)')
      .order('created_at', { ascending: false })

    if (branchId) {
      query = query.eq('branch_id', branchId)
    }

    if (type) {
      query = query.eq('type', type)
    }

    if (fromDate) {
      query = query.gte('created_at', fromDate)
    }

    if (toDate) {
      query = query.lte('created_at', toDate)
    }

    const result = await query.overrideTypes<TransactionWithBranch[]>()
    const { data, error } = result as { data: TransactionWithBranch[] | null; error: any }

    if (error) {
      console.error('Error fetching transactions:', error)
      return { error: 'Failed to fetch transactions' }
    }

    return { data: data || [] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function createTransaction(
  input: CreateTransactionInput,
): Promise<{ data?: CashTransaction; success?: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .select('id')
      .eq('id', input.branchId)
      .eq('organization_id', organization.id)
      .single()
      .overrideTypes<Branch>() as any

    if (branchError || !branch) {
      return { error: 'Invalid branch' }
    }

    const result = await supabase
      .from('cash_transactions')
      .insert({
        branch_id: input.branchId,
        type: input.type,
        amount: input.amount,
        description: input.description,
        student_package_id: input.studentPackageId || null,
      } as any)
      .select()
      .single()
      .overrideTypes<CashTransaction>() as any

    const { data, error } = result as { data: CashTransaction | null; error: any }

    if (error || !data) {
      console.error('Error creating transaction:', error)
      return { error: 'Failed to create transaction' }
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
    return { error: 'An unexpected error occurred' }
  }
}

export async function deleteTransaction(
  id: string,
): Promise<{ success?: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    // Fetch before state for logging
    const result = await supabase
      .from('cash_transactions')
      .select('id, type, amount, description, branch_id, student_package_id')
      .eq('id', id)
      .single()
      .overrideTypes<CashTransaction>() as any

    const { data: beforeTransaction, error: fetchError } = result as { data: CashTransaction | null; error: any }

    if (!beforeTransaction) {
      return { error: 'Transaction not found' }
    }

    const { error } = await supabase
      .from('cash_transactions')
      .delete()
      .eq('id', id)
      .overrideTypes<CashTransaction>()

    if (error) {
      console.error('Error deleting transaction:', error)
      return { error: 'Failed to delete transaction' }
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
    return { error: 'An unexpected error occurred' }
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
  if (!user) return { error: 'Not authenticated' }

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
      .overrideTypes<CashTransaction[]>() as any

    const { data, error } = result as { data: CashTransaction[] | null; error: any }

    if (error) {
      console.error('Error fetching daily report:', error)
      return { error: 'Failed to fetch report' }
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
    return { error: 'An unexpected error occurred' }
  }
}

export async function getMonthlyReport(
  branchId: string,
  year: number,
  month: number,
): Promise<{ success?: boolean; data?: DailyReportData; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

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
      .overrideTypes<CashTransaction[]>() as any

    const { data, error } = result as { data: CashTransaction[] | null; error: any }

    if (error) {
      console.error('Error fetching monthly report:', error)
      return { error: 'Failed to fetch report' }
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
    return { error: 'An unexpected error occurred' }
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
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

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
        .overrideTypes<Branch>() as any

      const { data: branch, error: branchError } = result as { data: Branch | null; error: any }

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
    const { data: earnings, error } = result as { data: Earnings[] | null; error: any }

    if (error) {
      console.error('Error fetching earnings:', error)
      return { error: 'Failed to fetch earnings' }
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
    ]) as any

    const instructorMap = new Map(instructors?.map((i: Instructor) => [i.id, i]) || [])
    const sessionMap = new Map(sessions?.map((s: any) => [s.id, s]) || [])

    // Enrich earnings with related data
    const enrichedEarnings = earnings.map((e) => ({
      ...e,
      instructors: instructorMap.get(e.instructor_id) as Instructor | undefined,
      course_sessions: sessionMap.get(e.session_id) as (CourseSession & { courses: Course & { branches: Branch } }) | undefined,
    })) as EnrichedEarnings[]

    // Filter by branch if specified
    let filtered = enrichedEarnings
    if (branchId) {
      filtered = filtered.filter((earning: any) => earning.course_sessions?.courses?.branch_id === branchId)
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
