'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { logOperation } from '@/lib/actions/history.actions'
import { getChanges } from '@/lib/utils/history-utils'
import type { Database } from '@/lib/types/database.types'
import type { TablesUpdate } from '@/lib/types/database.types'
import { sanitizeSearch } from '@/lib/utils/search'

type Instructor = Database['public']['Tables']['instructors']['Row']

export async function getInstructorsForDanceType(danceTypeId?: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      console.warn('[getInstructorsForDanceType] User not authenticated')
      return { error: 'Not authenticated' }
    }

    const organization = await getOrganization()
    if (!organization) {
      console.warn('[getInstructorsForDanceType] No organization found for user:', user.id)
      return { error: 'No organization found' }
    }

    // Use admin client to bypass RLS
    const admin = createAdminClient()
    
    if (!danceTypeId) {
      return { data: [] }
    }

    console.log('[getInstructorsForDanceType] Fetching for dance_type_id:', danceTypeId, 'org_id:', organization.id)

    // First, fetch instructor_rates for this dance type
    const { data: rates, error: ratesError } = await admin
      .from('instructor_rates')
      .select('instructor_id, ratio_per_class, branch_id, dance_type_id')
      .eq('dance_type_id', danceTypeId)

    if (ratesError) {
      console.error('[getInstructorsForDanceType] Error fetching rates:', ratesError)
      return { error: 'Failed to fetch instructor rates' }
    }

    console.log('[getInstructorsForDanceType] Found rates:', rates?.length || 0)

    if (!rates || rates.length === 0) {
      console.log('[getInstructorsForDanceType] No rates found for this dance type')
      return { data: [] }
    }

    // Get unique instructor IDs from rates
    const instructorIds = [...new Set(rates.map((r) => r.instructor_id))]
    console.log('[getInstructorsForDanceType] Unique instructors:', instructorIds.length)

    // Fetch the instructors with their rates
    const { data: instructors, error: instructorsError } = await admin
      .from('instructors')
      .select(`
        *,
        instructor_rates(
          id,
          ratio_per_class,
          branch_id,
          dance_type_id
        )
      `)
      .eq('organization_id', organization.id)
      .in('id', instructorIds)
      .order('created_at', { ascending: false })

    if (instructorsError) {
      console.error('[getInstructorsForDanceType] Error fetching instructors:', instructorsError)
      return { error: 'Failed to fetch instructors' }
    }

    console.log('[getInstructorsForDanceType] Returning', instructors?.length || 0, 'instructors')
    return { data: instructors }
  } catch (error) {
    console.error('[getInstructorsForDanceType] Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { error: 'An unexpected error occurred', details: errorMessage }
  }
}

export async function getInstructors(
  searchQuery?: string,
  page: number = 1,
  pageSize: number = 10
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      console.warn('[getInstructors] User not authenticated - user is null')
      return { error: 'Not authenticated', data: [], totalCount: 0 }
    }

    const organization = await getOrganization()
    if (!organization) {
      console.warn('[getInstructors] No organization found for user:', user.id)
      return { error: 'No organization found', data: [], totalCount: 0 }
    }

    const admin = createAdminClient()
    
    // Count query
    let countQuery = admin
      .from('instructors')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organization.id)
      .is('deleted_at', null)

    if (searchQuery) {
      countQuery = countQuery.or(
        `first_name.ilike.%${sanitizeSearch(searchQuery)}%,last_name.ilike.%${sanitizeSearch(searchQuery)}%,email.ilike.%${sanitizeSearch(searchQuery)}%`
      )
    }

    const { count: totalCount } = await countQuery
    const count = totalCount || 0

    // Data query
    let query = admin
      .from('instructors')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        created_at,
        updated_at,
        branch_instructors(branch_id, branches(id, name)),
        course_instructors(course_id, courses(id, name)),
        instructor_rates(dance_type_id, branch_id, dance_types(id, name))
      `)
      .eq('organization_id', organization.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (searchQuery) {
      query = query.or(
        `first_name.ilike.%${sanitizeSearch(searchQuery)}%,last_name.ilike.%${sanitizeSearch(searchQuery)}%,email.ilike.%${sanitizeSearch(searchQuery)}%`
      )
    }

    // Apply pagination
    const offset = (page - 1) * pageSize
    query = query.range(offset, offset + pageSize - 1)

    const { data, error } = await query

    if (error) {
      console.error('[getInstructors] Supabase error:', error)
      return { error: 'Failed to fetch instructors', details: error, data: [], totalCount: 0 }
    }

    // Enrich data with computed stats
    const enrichedData = data.map((instructor) => ({
      ...instructor,
      branchCount: instructor.branch_instructors?.length || 0,
      courseCount: instructor.course_instructors?.length || 0,
      danceTypeCount: instructor.instructor_rates?.length || 0,
      branches: instructor.branch_instructors?.filter((bi) => bi.branches).map((bi) => bi.branches) || [],
      courses: instructor.course_instructors?.filter((ci) => ci.courses).map((ci) => ci.courses) || [],
      danceTypes: instructor.instructor_rates?.filter((ir) => ir.dance_types).map((ir) => ir.dance_types) || [],
    }))

    const totalPages = Math.ceil(count / pageSize)
    return { data: enrichedData, totalCount: count, page, pageSize, totalPages }
  } catch (error) {
    console.error('[getInstructors] Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { error: 'An unexpected error occurred', details: errorMessage, data: [], totalCount: 0 }
  }
}

export async function getInstructor(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      console.warn('[getInstructor] User not authenticated')
      return { error: 'Not authenticated' }
    }

    const organization = await getOrganization()
    if (!organization) {
      console.warn('[getInstructor] No organization found for user:', user.id)
      return { error: 'No organization found' }
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('instructors')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .is('deleted_at', null)
      .single()

    if (error) {
      console.error('[getInstructor] Supabase error:', error)
      return { error: 'Instructor not found' }
    }

    return { data: data as Instructor }
  } catch (error) {
    console.error('[getInstructor] Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { error: 'An unexpected error occurred', details: errorMessage }
  }
}

interface CreateInstructorInput {
  firstName: string
  lastName: string
  email: string
  phone?: string
}

export async function createInstructor(input: CreateInstructorInput) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      console.warn('[createInstructor] User not authenticated')
      return { error: 'Not authenticated' }
    }

    const organization = await getOrganization()
    if (!organization) {
      console.warn('[createInstructor] No organization found for user:', user.id)
      return { error: 'No organization found' }
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('instructors')
      .insert({
        organization_id: organization.id,
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        phone: input.phone || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[createInstructor] Supabase error:', error)
      return { error: 'Failed to create instructor' }
    }

    // Log operation (non-blocking)
    void logOperation(
      'CREATE',
      'instructor',
      data.id,
      {
        after: {
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          phone: data.phone,
        },
      },
      organization.id
    )

    return { data: data as Instructor, success: true }
  } catch (error) {
    console.error('[createInstructor] Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { error: 'An unexpected error occurred', details: errorMessage }
  }
}

interface UpdateInstructorInput {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string | null
}

export async function updateInstructor(id: string, input: UpdateInstructorInput) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      console.warn('[updateInstructor] User not authenticated')
      return { error: 'Not authenticated' }
    }

    const organization = await getOrganization()
    if (!organization) {
      console.warn('[updateInstructor] No organization found for user:', user.id)
      return { error: 'No organization found' }
    }

    const supabase = await createServerSupabaseClient()

    // Fetch before state for logging
    const { data: beforeInstructor } = await supabase
      .from('instructors')
      .select('id, first_name, last_name, email, phone')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .single()

    if (!beforeInstructor) {
      return { error: 'Instructor not found or does not belong to your organization' }
    }

    const updateData: TablesUpdate<'instructors'> = {}
    if (input.firstName !== undefined) updateData.first_name = input.firstName
    if (input.lastName !== undefined) updateData.last_name = input.lastName
    if (input.email !== undefined) updateData.email = input.email
    if (input.phone !== undefined) updateData.phone = input.phone

    const { data, error } = await supabase.from('instructors')
      .update({ ...updateData })
      .eq('id', id)
      .eq('organization_id', organization.id)
      .select()
      .single()

    if (error) {
      console.error('[updateInstructor] Supabase error:', error)
      return { error: 'Failed to update instructor' }
    }

    // Log the update operation
    const beforeObj = {
      firstName: beforeInstructor.first_name,
      lastName: beforeInstructor.last_name,
      email: beforeInstructor.email,
      phone: beforeInstructor.phone,
    }
    const afterObj = {
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
    }
    const changes = getChanges(beforeObj, afterObj)
    void logOperation('UPDATE', 'instructor', id, {
      before: beforeObj,
      after: afterObj,
      changes,
    }, organization.id)

    return { data: data as Instructor, success: true }
  } catch (error) {
    console.error('[updateInstructor] Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { error: 'An unexpected error occurred', details: errorMessage }
  }
}

export async function deleteInstructor(id: string, reason?: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      console.warn('[deleteInstructor] User not authenticated')
      return { error: 'Not authenticated' }
    }

    const organization = await getOrganization()
    if (!organization) {
      console.warn('[deleteInstructor] No organization found for user:', user.id)
      return { error: 'No organization found' }
    }

    const supabase = await createServerSupabaseClient()

    // Fetch before state for logging
    const { data: beforeInstructor } = await supabase
      .from('instructors')
      .select('id, first_name, last_name, email, phone')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .single()

    if (!beforeInstructor) {
      return { error: 'Instructor not found or does not belong to your organization' }
    }

    const user_id = user.id
    const updateResult = await supabase.from('instructors')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user_id,
        deleted_reason: reason || null,
      })
      .eq('id', id)
      .eq('organization_id', organization.id)
    const { error } = updateResult

    if (error) {
      console.error('[deleteInstructor] Supabase error:', error)
      return { error: 'Failed to delete instructor' }
    }

    // Log the delete operation
    const beforeObj = {
      firstName: beforeInstructor.first_name,
      lastName: beforeInstructor.last_name,
      email: beforeInstructor.email,
      phone: beforeInstructor.phone,
    }
    void logOperation('DELETE', 'instructor', id, {
      before: beforeObj,
    }, organization.id)

    return { success: true }
  } catch (error) {
    console.error('[deleteInstructor] Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { error: 'An unexpected error occurred', details: errorMessage }
  }
}

export async function getInstructorFilterOptions() {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const adminSupabase = createAdminClient()

    // Get dance types list
    const { data: danceTypesData } = await (adminSupabase
      .from('dance_types'))
      .select('id, name')
      .eq('organization_id', organization.id)
      .order('name')

    const danceTypes = (danceTypesData || []) as Array<{ id: string; name: string }>

    // Get branches list
    const { data: branchesData } = await (adminSupabase
      .from('branches'))
      .select('id, name')
      .eq('organization_id', organization.id)
      .order('name')

    const branches = (branchesData || []) as Array<{ id: string; name: string }>

    return { danceTypes, branches }
  } catch (error) {
    console.error('[getInstructorFilterOptions] Unexpected error:', error)
    return { error: 'Failed to fetch filter options', danceTypes: [], branches: [] }
  }
}
