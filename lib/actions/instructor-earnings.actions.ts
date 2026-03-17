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

export async function updateInstructorEarnings(earningsId: string, amount: number) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    // Verify the earning belongs to an instructor in the user's organization
    const { data: earning, error: fetchError } = await (supabase
      .from('instructor_earnings') as any)
      .select('*, instructors(organization_id)')
      .eq('id', earningsId)
      .single()

    console.log('[updateInstructorEarnings] Fetched earning:', { earning, fetchError, userId: user.id })

    if (fetchError || !earning || earning.instructors?.organization_id !== organization.id) {
      console.error('[updateInstructorEarnings] Access denied or not found', { fetchError, organization: organization.id })
      return { error: 'Earning not found or access denied' }
    }

    // Use admin client to bypass RLS (we've already verified organization access above)
    const adminSupabase = createAdminClient()
    
    // Update the amount
    console.log('[updateInstructorEarnings] Attempting update:', { earningsId, newAmount: amount, oldAmount: earning.amount })
    const { error: updateError, count } = await (adminSupabase
      .from('instructor_earnings') as any)
      .update({ amount })
      .eq('id', earningsId)

    console.log('[updateInstructorEarnings] Update response:', { updateError, count })

    if (updateError) {
      console.error('Error updating earnings:', updateError)
      return { error: `Failed to update earnings: ${updateError.message || updateError}` }
    }

    // Verify the update was successful by fetching the record again
    const { data: updatedEarning, error: verifyError } = await (adminSupabase
      .from('instructor_earnings') as any)
      .select('amount')
      .eq('id', earningsId)
      .single()

    console.log('[updateInstructorEarnings] Verification:', { updatedEarning, verifyError })

    if (updatedEarning?.amount !== amount) {
      console.error('[updateInstructorEarnings] Verification failed - amount not updated', { expected: amount, actual: updatedEarning?.amount })
      return { error: 'Update verification failed - data may not have been saved' }
    }

    return { success: true, message: 'Earnings updated successfully', data: updatedEarning }
  } catch (error) {
    console.error('Unexpected error in updateInstructorEarnings:', error)
    return { error: `An unexpected error occurred: ${(error as any).message}` }
  }
}

export async function deleteInstructorEarnings(earningsId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    // Verify the earning belongs to an instructor in the user's organization
    const { data: earning, error: fetchError } = await (supabase
      .from('instructor_earnings') as any)
      .select('*, instructors(organization_id)')
      .eq('id', earningsId)
      .single()

    console.log('[deleteInstructorEarnings] Fetched earning:', { earning, fetchError, userId: user.id })

    if (fetchError || !earning || earning.instructors?.organization_id !== organization.id) {
      console.error('[deleteInstructorEarnings] Access denied or not found', { fetchError, organization: organization.id })
      return { error: 'Earning not found or access denied' }
    }

    // Delete the earning
    console.log('[deleteInstructorEarnings] Attempting delete:', { earningsId })
    
    // Use admin client to bypass RLS (we've already verified organization access above)
    const adminSupabase = createAdminClient()
    
    const { error: deleteError, count } = await (adminSupabase
      .from('instructor_earnings') as any)
      .delete()
      .eq('id', earningsId)

    console.log('[deleteInstructorEarnings] Delete response:', { deleteError, count })

    if (deleteError) {
      console.error('Error deleting earnings:', deleteError)
      return { error: `Failed to delete earnings: ${deleteError.message || deleteError}` }
    }

    // Verify the deletion was successful
    const { data: verifyData, error: verifyError } = await (adminSupabase
      .from('instructor_earnings') as any)
      .select('id')
      .eq('id', earningsId)
      .single()

    console.log('[deleteInstructorEarnings] Verification:', { verifyData, verifyError })

    if (verifyData) {
      console.error('[deleteInstructorEarnings] Verification failed - record still exists')
      return { error: 'Delete verification failed - record may still exist' }
    }

    return { success: true, message: 'Earnings deleted successfully' }
  } catch (error) {
    console.error('Unexpected error in deleteInstructorEarnings:', error)
    return { error: `An unexpected error occurred: ${(error as any).message}` }
  }
}
