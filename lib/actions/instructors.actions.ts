'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { logOperation } from '@/lib/actions/history.actions'
import { getChanges } from '@/lib/utils/history-utils'
import type { Database } from '@/lib/types/database.types'

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
    const { data: rates, error: ratesError } = await (admin as any)
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
    const instructorIds = [...new Set(rates.map((r: any) => r.instructor_id))]
    console.log('[getInstructorsForDanceType] Unique instructors:', instructorIds.length)

    // Fetch the instructors with their rates
    const { data: instructors, error: instructorsError } = await (admin as any)
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
    return { data: instructors as any[] }
  } catch (error) {
    console.error('[getInstructorsForDanceType] Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { error: 'An unexpected error occurred', details: errorMessage }
  }
}

export async function getInstructors(
  searchQuery?: string,
  filters?: {
    danceTypeId?: string
    branchId?: string
  }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      console.warn('[getInstructors] User not authenticated - user is null')
      return { error: 'Not authenticated' }
    }

    const organization = await getOrganization()
    if (!organization) {
      console.warn('[getInstructors] No organization found for user:', user.id)
      return { error: 'No organization found' }
    }

    const admin = createAdminClient()
    
    let query = (admin as any)
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
      .order('created_at', { ascending: false })

    if (searchQuery) {
      query = query.or(
        `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
      )
    }

    const { data, error } = await query

    if (error) {
      console.error('[getInstructors] Supabase error:', error)
      return { error: 'Failed to fetch instructors', details: error }
    }

    // Enrich data with computed stats
    let enrichedData = (data as any[]).map((instructor) => ({
      ...instructor,
      branchCount: instructor.branch_instructors?.length || 0,
      courseCount: instructor.course_instructors?.length || 0,
      danceTypeCount: instructor.instructor_rates?.length || 0,
      branches: instructor.branch_instructors?.filter((bi: any) => bi.branches).map((bi: any) => bi.branches) || [],
      courses: instructor.course_instructors?.filter((ci: any) => ci.courses).map((ci: any) => ci.courses) || [],
      danceTypes: instructor.instructor_rates?.filter((ir: any) => ir.dance_types).map((ir: any) => ir.dance_types) || [],
    }))

    // Apply client-side filters
    if (filters?.danceTypeId) {
      enrichedData = enrichedData.filter((instructor: any) =>
        instructor.danceTypes.some((dt: any) => dt.id === filters.danceTypeId)
      )
    }

    if (filters?.branchId) {
      enrichedData = enrichedData.filter((instructor: any) =>
        instructor.branches.some((b: any) => b.id === filters.branchId)
      )
    }

    return { data: enrichedData }
  } catch (error) {
    console.error('[getInstructors] Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { error: 'An unexpected error occurred', details: errorMessage }
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
    const { data, error } = await (admin as any)
      .from('instructors')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organization.id)
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
      } as any)
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
      (data as any).id,
      {
        after: {
          firstName: (data as any).first_name,
          lastName: (data as any).last_name,
          email: (data as any).email,
          phone: (data as any).phone,
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

    const updateData: any = {}
    if (input.firstName !== undefined) updateData.first_name = input.firstName
    if (input.lastName !== undefined) updateData.last_name = input.lastName
    if (input.email !== undefined) updateData.email = input.email
    if (input.phone !== undefined) updateData.phone = input.phone

    const { data, error } = await (supabase.from('instructors') as any)
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
      firstName: (beforeInstructor as any).first_name,
      lastName: (beforeInstructor as any).last_name,
      email: (beforeInstructor as any).email,
      phone: (beforeInstructor as any).phone,
    }
    const afterObj = {
      firstName: (data as any).first_name,
      lastName: (data as any).last_name,
      email: (data as any).email,
      phone: (data as any).phone,
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

export async function deleteInstructor(id: string) {
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

    const { error } = await supabase
      .from('instructors')
      .delete()
      .eq('id', id)
      .eq('organization_id', organization.id)

    if (error) {
      console.error('[deleteInstructor] Supabase error:', error)
      return { error: 'Failed to delete instructor' }
    }

    // Log the delete operation
    const beforeObj = {
      firstName: (beforeInstructor as any).first_name,
      lastName: (beforeInstructor as any).last_name,
      email: (beforeInstructor as any).email,
      phone: (beforeInstructor as any).phone,
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
      .from('dance_types') as any)
      .select('id, name')
      .eq('organization_id', organization.id)
      .order('name')

    const danceTypes = (danceTypesData || []) as Array<{ id: string; name: string }>

    // Get branches list
    const { data: branchesData } = await (adminSupabase
      .from('branches') as any)
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
