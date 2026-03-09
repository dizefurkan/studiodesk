'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'

export async function getInstructorEarnings(instructorId?: string, fromDate?: string, toDate?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('instructor_earnings')
      .select('*, session_instructors(session_id), instructors(first_name, last_name)')
      .order('created_at', { ascending: false })

    if (instructorId) {
      query = query.eq('instructor_id', instructorId)
    }

    if (fromDate) {
      query = query.gte('created_at', fromDate)
    }

    if (toDate) {
      query = query.lte('created_at', toDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching earnings:', error)
      return { error: 'Failed to fetch earnings' }
    }

    return { data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getEarningsReport(instructorId: string, year: number, month: number) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()

    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('instructor_earnings')
      .select('*')
      .eq('instructor_id', instructorId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (error) {
      console.error('Error fetching report:', error)
      return { error: 'Failed to fetch report' }
    }

    const total = (data || []).reduce((sum, e) => sum + Number(e.amount), 0)
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
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
