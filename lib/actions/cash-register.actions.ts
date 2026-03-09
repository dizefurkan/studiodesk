'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import type { Database } from '@/lib/types/database.types'

type CashTransaction = Database['public']['Tables']['cash_transactions']['Row']

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
) {
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

    const { data, error } = await query

    if (error) {
      console.error('Error fetching transactions:', error)
      return { error: 'Failed to fetch transactions' }
    }

    return { data: data as (CashTransaction & { branches: { name: string } | null })[] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function createTransaction(input: CreateTransactionInput) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    // Verify branch belongs to organization
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .select('id')
      .eq('id', input.branchId)
      .eq('organization_id', organization.id)
      .single()

    if (branchError || !branch) {
      return { error: 'Invalid branch' }
    }

    const { data, error } = await supabase
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

    if (error) {
      console.error('Error creating transaction:', error)
      return { error: 'Failed to create transaction' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function deleteTransaction(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.from('cash_transactions').delete().eq('id', id)

    if (error) {
      console.error('Error deleting transaction:', error)
      return { error: 'Failed to delete transaction' }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getDailyReport(branchId: string, date: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()

    const startOfDay = `${date}T00:00:00`
    const endOfDay = `${date}T23:59:59`

    const { data, error } = await supabase
      .from('cash_transactions')
      .select('*')
      .eq('branch_id', branchId)
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)

    if (error) {
      console.error('Error fetching daily report:', error)
      return { error: 'Failed to fetch report' }
    }

    const transactions = data || []
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)
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

export async function getMonthlyReport(branchId: string, year: number, month: number) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()

    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('cash_transactions')
      .select('*')
      .eq('branch_id', branchId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (error) {
      console.error('Error fetching monthly report:', error)
      return { error: 'Failed to fetch report' }
    }

    const transactions = data || []
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)
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
