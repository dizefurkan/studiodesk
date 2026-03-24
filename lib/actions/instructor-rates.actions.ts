'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'

export async function getInstructorRates(instructorId?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const adminSupabase = createAdminClient()

    let query = adminSupabase
      .from('instructor_rates')
      .select(`
        id,
        ratio_per_class,
        instructors(
          id,
          first_name,
          last_name
        ),
        branches(
          id,
          name
        ),
        dance_types(
          id,
          name
        )
      `)

    // If specific instructor requested, filter by instructor
    if (instructorId) {
      query = query.eq('instructor_id', instructorId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching instructor rates:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return { error: `Failed to fetch rates: ${error.message}` }
    }

    console.log(`Successfully fetched ${data?.length || 0} instructor rates`)
    return { data }
  } catch (error) {
    console.error('Unexpected error in getInstructorRates:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function createInstructorRate(
  instructorId: string,
  branchId: string,
  danceTypeId: string,
  ratioPerClass: number,
) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const adminSupabase = createAdminClient()

    // Verify instructor belongs to organization
    const { data: instructor, error: instructorError } = await (adminSupabase
      .from('instructors') as any)
      .select('organization_id')
      .eq('id', instructorId)
      .single()

    if (instructorError || !instructor || instructor.organization_id !== organization.id) {
      return { error: 'Instructor not found or access denied' }
    }

    // Verify branch belongs to organization
    const { data: branch, error: branchError } = await (adminSupabase
      .from('branches') as any)
      .select('organization_id')
      .eq('id', branchId)
      .single()

    if (branchError || !branch || branch.organization_id !== organization.id) {
      return { error: 'Branch not found or access denied' }
    }

    // Verify dance type exists
    const { data: danceType, error: danceTypeError } = await (adminSupabase
      .from('dance_types') as any)
      .select('id')
      .eq('id', danceTypeId)
      .single()

    if (danceTypeError || !danceType) {
      return { error: 'Dance type not found' }
    }

    // Check if rate already exists
    const { data: existingRate } = await (adminSupabase
      .from('instructor_rates') as any)
      .select('id')
      .eq('instructor_id', instructorId)
      .eq('branch_id', branchId)
      .eq('dance_type_id', danceTypeId)
      .single()

    if (existingRate) {
      return { error: 'Rate already exists for this combination' }
    }

    // Create new rate
    const { data, error } = await (adminSupabase
      .from('instructor_rates') as any)
      .insert({
        instructor_id: instructorId,
        branch_id: branchId,
        dance_type_id: danceTypeId,
        ratio_per_class: ratioPerClass,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating instructor rate:', error)
      return { error: 'Failed to create rate' }
    }

    return { data }
  } catch (error) {
    console.error('Unexpected error in createInstructorRate:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function updateInstructorRate(
  rateId: string,
  ratioPerClass: number,
) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const adminSupabase = createAdminClient()

    // Verify rate belongs to this organization by checking instructor
    const { data: rate, error: rateError } = await (adminSupabase
      .from('instructor_rates') as any)
      .select('instructor_id')
      .eq('id', rateId)
      .single()

    if (rateError || !rate) {
      return { error: 'Rate not found' }
    }

    const { data: instructor, error: instructorError } = await (adminSupabase
      .from('instructors') as any)
      .select('organization_id')
      .eq('id', rate.instructor_id)
      .single()

    if (instructorError || !instructor || instructor.organization_id !== organization.id) {
      return { error: 'Access denied' }
    }

    // Update rate
    const { data, error } = await (adminSupabase
      .from('instructor_rates') as any)
      .update({ ratio_per_class: ratioPerClass })
      .eq('id', rateId)
      .select()
      .single()

    if (error) {
      console.error('Error updating instructor rate:', error)
      return { error: 'Failed to update rate' }
    }

    return { data }
  } catch (error) {
    console.error('Unexpected error in updateInstructorRate:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function deleteInstructorRate(rateId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const adminSupabase = createAdminClient()

    // Verify rate belongs to this organization by checking instructor
    const { data: rate, error: rateError } = await (adminSupabase
      .from('instructor_rates') as any)
      .select('instructor_id')
      .eq('id', rateId)
      .single()

    if (rateError || !rate) {
      return { error: 'Rate not found' }
    }

    const { data: instructor, error: instructorError } = await (adminSupabase
      .from('instructors') as any)
      .select('organization_id')
      .eq('id', rate.instructor_id)
      .single()

    if (instructorError || !instructor || instructor.organization_id !== organization.id) {
      return { error: 'Access denied' }
    }

    // Delete rate
    const { error } = await (adminSupabase
      .from('instructor_rates') as any)
      .delete()
      .eq('id', rateId)

    if (error) {
      console.error('Error deleting instructor rate:', error)
      return { error: 'Failed to delete rate' }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error in deleteInstructorRate:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getInstructorsAndBranchesAndDanceTypes() {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const adminSupabase = createAdminClient()

    const [instructorsResult, branchesResult, danceTypesResult] = await Promise.all([
      (adminSupabase
        .from('instructors') as any)
        .select('id, first_name, last_name')
        .eq('organization_id', organization.id),
      (adminSupabase
        .from('branches') as any)
        .select('id, name')
        .eq('organization_id', organization.id),
      (adminSupabase
        .from('dance_types') as any)
        .select('id, name')
        .eq('organization_id', organization.id),
    ])

    if (instructorsResult.error || branchesResult.error || danceTypesResult.error) {
      console.error('Error fetching data:', { instructorsResult, branchesResult, danceTypesResult })
      return { error: 'Failed to fetch data' }
    }

    return {
      data: {
        instructors: instructorsResult.data || [],
        branches: branchesResult.data || [],
        danceTypes: danceTypesResult.data || [],
      },
    }
  } catch (error) {
    console.error('Unexpected error in getInstructorsAndBranchesAndDanceTypes:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getInstructorRate(rateId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const adminSupabase = createAdminClient()

    const { data, error } = await (adminSupabase
      .from('instructor_rates') as any)
      .select(`
        id,
        ratio_per_class,
        instructor_id,
        branch_id,
        dance_type_id,
        instructors(first_name, last_name),
        branches(name),
        dance_types(name)
      `)
      .eq('id', rateId)
      .single()

    if (error) {
      console.error('Error fetching instructor rate:', error)
      return { error: 'Rate not found' }
    }

    // Transform to nested structure to match getInstructorRates format
    return {
      data: {
        id: data.id,
        ratio_per_class: data.ratio_per_class,
        instructors: {
          id: data.instructor_id,
          first_name: data.instructors?.first_name,
          last_name: data.instructors?.last_name,
        },
        branches: {
          id: data.branch_id,
          name: data.branches?.name,
        },
        dance_types: {
          id: data.dance_type_id,
          name: data.dance_types?.name,
        },
      },
    }
  } catch (error) {
    console.error('Unexpected error in getInstructorRate:', error)
    return { error: 'An unexpected error occurred' }
  }
}
