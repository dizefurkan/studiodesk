'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import type { Database } from '@/lib/types/database.types'

type Instructor = Database['public']['Tables']['instructors']['Row']

export async function getInstructors(searchQuery?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()
    
    // Test: Get ALL instructors without organization filter
    const { data: allData, error: allError } = await supabase
      .from('instructors')
      .select('*')
      .order('created_at', { ascending: false })
    
    console.log('[getInstructors] ALL instructors (no filter):', allData?.length, allData)
    console.log('[getInstructors] ALL instructors error:', allError)
    
    // Now get with organization filter
    let query = supabase
      .from('instructors')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })

    if (searchQuery) {
      query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
    }

    const { data, error } = await query

    console.log('[getInstructors] User:', user.id)
    console.log('[getInstructors] Organization:', organization.id)
    console.log('[getInstructors] Search Query:', searchQuery)
    console.log('[getInstructors] Error:', error)
    console.log('[getInstructors] Data received:', data)
    console.log('[getInstructors] typeof data:', typeof data)
    console.log('[getInstructors] Array.isArray(data):', Array.isArray(data))
    console.log('[getInstructors] Object.keys(data):', Object.keys(data || {}))
    console.log('[getInstructors] Data JSON:', JSON.stringify(data))
    console.log('[getInstructors] Data length:', data?.length)
    console.log('[getInstructors] data[0]:', data?.[0])

    if (error) {
      console.error('Error fetching instructors:', error)
      return { error: 'Failed to fetch instructors' }
    }

    console.log('[getInstructors] Returning data:', data)
    return { data: data as Instructor[] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getInstructor(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('instructors')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .single()

    if (error) {
      console.error('Error fetching instructor:', error)
      return { error: 'Instructor not found' }
    }

    return { data: data as Instructor }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

interface CreateInstructorInput {
  firstName: string
  lastName: string
  email: string
  phone?: string
}

export async function createInstructor(input: CreateInstructorInput) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
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
      console.error('Error creating instructor:', error)
      return { error: 'Failed to create instructor' }
    }

    return { data: data as Instructor, success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

interface UpdateInstructorInput {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string | null
}

export async function updateInstructor(id: string, input: UpdateInstructorInput) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    const { data: instructor } = await supabase
      .from('instructors')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .single()

    if (!instructor) {
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
      console.error('Error updating instructor:', error)
      return { error: 'Failed to update instructor' }
    }

    return { data: data as Instructor, success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function deleteInstructor(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from('instructors')
      .delete()
      .eq('id', id)
      .eq('organization_id', organization.id)

    if (error) {
      console.error('Error deleting instructor:', error)
      return { error: 'Failed to delete instructor' }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
