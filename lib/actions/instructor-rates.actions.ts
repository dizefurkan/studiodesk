'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { logOperation } from '@/lib/actions/history.actions'
import { getChanges } from '@/lib/utils/history-utils'

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
        instructors!inner(
          id,
          first_name,
          last_name,
          organization_id
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
      // Service-role client: scope to the caller's organization explicitly
      .eq('instructors.organization_id', organization.id)

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
      .from('instructors'))
      .select('organization_id')
      .eq('id', instructorId)
      .single()

    if (instructorError || !instructor || instructor.organization_id !== organization.id) {
      return { error: 'Instructor not found or access denied' }
    }

    // Verify branch belongs to organization
    const { data: branch, error: branchError } = await (adminSupabase
      .from('branches'))
      .select('organization_id')
      .eq('id', branchId)
      .single()

    if (branchError || !branch || branch.organization_id !== organization.id) {
      return { error: 'Branch not found or access denied' }
    }

    // Verify dance type exists
    const { data: danceType, error: danceTypeError } = await (adminSupabase
      .from('dance_types'))
      .select('id')
      .eq('id', danceTypeId)
      .single()

    if (danceTypeError || !danceType) {
      return { error: 'Dance type not found' }
    }

    // Check if rate already exists
    const { data: existingRate } = await (adminSupabase
      .from('instructor_rates'))
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
      .from('instructor_rates'))
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

    // Log the create operation
    void logOperation('CREATE', 'instructor_rate', data.id, {
      after: {
        instructorId: data.instructor_id,
        branchId: data.branch_id,
        danceTypeId: data.dance_type_id,
        ratioPerClass: data.ratio_per_class,
      }
    }, organization.id)

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

    // Fetch before state for logging
    const { data: beforeRate, error: beforeRateError } = await (adminSupabase
      .from('instructor_rates'))
      .select('id, instructor_id, branch_id, dance_type_id, ratio_per_class')
      .eq('id', rateId)
      .single()

    if (beforeRateError || !beforeRate) {
      return { error: 'Rate not found' }
    }

    const { data: instructor, error: instructorError } = await (adminSupabase
      .from('instructors'))
      .select('organization_id')
      .eq('id', beforeRate.instructor_id)
      .single()

    if (instructorError || !instructor || instructor.organization_id !== organization.id) {
      return { error: 'Access denied' }
    }

    // Update rate
    const { data, error } = await (adminSupabase
      .from('instructor_rates'))
      .update({ ratio_per_class: ratioPerClass })
      .eq('id', rateId)
      .select()
      .single()

    if (error) {
      console.error('Error updating instructor rate:', error)
      return { error: 'Failed to update rate' }
    }

    // Log the update operation
    const beforeObj = {
      instructorId: beforeRate.instructor_id,
      branchId: beforeRate.branch_id,
      danceTypeId: beforeRate.dance_type_id,
      ratioPerClass: beforeRate.ratio_per_class,
    }
    const afterObj = {
      instructorId: data.instructor_id,
      branchId: data.branch_id,
      danceTypeId: data.dance_type_id,
      ratioPerClass: data.ratio_per_class,
    }
    const changes = getChanges(beforeObj, afterObj)
    void logOperation('UPDATE', 'instructor_rate', rateId, {
      before: beforeObj,
      after: afterObj,
      changes,
    }, organization.id)

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

    // Fetch before state for logging
    const { data: beforeRate, error: beforeRateError } = await (adminSupabase
      .from('instructor_rates'))
      .select('id, instructor_id, branch_id, dance_type_id, ratio_per_class')
      .eq('id', rateId)
      .single()

    if (beforeRateError || !beforeRate) {
      return { error: 'Rate not found' }
    }

    const { data: instructor, error: instructorError } = await (adminSupabase
      .from('instructors'))
      .select('organization_id')
      .eq('id', beforeRate.instructor_id)
      .single()

    if (instructorError || !instructor || instructor.organization_id !== organization.id) {
      return { error: 'Access denied' }
    }

    // Delete rate
    const { error } = await (adminSupabase
      .from('instructor_rates'))
      .delete()
      .eq('id', rateId)

    if (error) {
      console.error('Error deleting instructor rate:', error)
      return { error: 'Failed to delete rate' }
    }

    // Log the delete operation
    const beforeObj = {
      instructorId: beforeRate.instructor_id,
      branchId: beforeRate.branch_id,
      danceTypeId: beforeRate.dance_type_id,
      ratioPerClass: beforeRate.ratio_per_class,
    }
    void logOperation('DELETE', 'instructor_rate', rateId, {
      before: beforeObj,
    }, organization.id)

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
        .from('instructors'))
        .select(`
          id, 
          first_name, 
          last_name,
          instructor_rates(
            id,
            ratio_per_class,
            branch_id,
            dance_type_id
          )
        `)
        .eq('organization_id', organization.id),
      (adminSupabase
        .from('branches'))
        .select('id, name')
        .eq('organization_id', organization.id),
      (adminSupabase
        .from('dance_types'))
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
      .from('instructor_rates'))
      .select(`
        id,
        ratio_per_class,
        instructor_id,
        branch_id,
        dance_type_id,
        instructors!inner(first_name, last_name, organization_id),
        branches(name),
        dance_types(name)
      `)
      .eq('id', rateId)
      .eq('instructors.organization_id', organization.id)
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
