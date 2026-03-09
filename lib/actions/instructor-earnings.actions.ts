'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'

export async function getInstructorEarnings(instructorId?: string, fromDate?: string, toDate?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    // Use admin client to bypass RLS for complex JOINs, but verify organization access
    const adminSupabase = createAdminClient()
    let query = (adminSupabase
      .from('instructor_earnings') as any)
      .select('*, instructors(id, first_name, last_name, organization_id)')
      .order('created_at', { ascending: false })

    // Filter by instructor's organization to maintain security
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
      console.error('Error fetching earnings:', {
        error,
        message: (error as any)?.message,
        details: (error as any)?.details,
      })
      return { error: 'Failed to fetch earnings' }
    }

    // Filter results to only include instructors from the user's organization
    const filtered = (data || []).filter(
      (earning: any) => earning.instructors?.organization_id === organization.id,
    )

    return { data: filtered }
  } catch (error) {
    console.error('Unexpected error in getInstructorEarnings:', {
      error,
      message: (error as any)?.message,
      stack: (error as any)?.stack?.split('\n').slice(0, 3),
    })
    return { error: 'An unexpected error occurred' }
  }
}

export async function getEarningsReport(instructorId: string, year: number, month: number) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    // Use admin client to bypass RLS for efficiency, but verify instructor belongs to organization
    const adminSupabase = createAdminClient()

    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    // Verify instructor belongs to organization first
    const { data: instructor, error: instructorError } = await (adminSupabase
      .from('instructors') as any)
      .select('organization_id')
      .eq('id', instructorId)
      .single()

    if (instructorError || !instructor || instructor.organization_id !== organization.id) {
      return { error: 'Instructor not found or access denied' }
    }

    const { data, error } = await (adminSupabase
      .from('instructor_earnings') as any)
      .select('*')
      .eq('instructor_id', instructorId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (error) {
      console.error('Error fetching report:', {
        error,
        message: (error as any)?.message,
        details: (error as any)?.details,
      })
      return { error: 'Failed to fetch report' }
    }

    const total = ((data || []) as any[]).reduce((sum: number, e: any) => sum + Number(e.amount), 0)
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
      message: (error as any)?.message,
      stack: (error as any)?.stack?.split('\n').slice(0, 3),
    })
    return { error: 'An unexpected error occurred' }
  }
}
