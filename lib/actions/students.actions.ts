'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import type { Database } from '@/lib/types/database.types'

type Student = Database['public']['Tables']['students']['Row']
type StudentInsert = Database['public']['Tables']['students']['Insert']
type StudentUpdate = Database['public']['Tables']['students']['Update']

export async function getStudents(searchQuery?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()
    
    // Test: Get ALL students without organization filter
    const { data: allData, error: allError } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })
    
    console.log('[getStudents] ALL students (no filter):', allData?.length, allData)
    console.log('[getStudents] ALL students error:', allError)
    
    // Now get with organization filter
    let query = supabase
      .from('students')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })

    if (searchQuery) {
      query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
    }

    const { data, error } = await query

    console.log('[getStudents] User:', user.id)
    console.log('[getStudents] Organization:', organization.id)
    console.log('[getStudents] Search Query:', searchQuery)
    console.log('[getStudents] Error:', error)
    console.log('[getStudents] Data received:', data)
    console.log('[getStudents] typeof data:', typeof data)
    console.log('[getStudents] Array.isArray(data):', Array.isArray(data))
    console.log('[getStudents] Object.keys(data):', Object.keys(data || {}))
    console.log('[getStudents] Data JSON:', JSON.stringify(data))
    console.log('[getStudents] Data length:', data?.length)
    console.log('[getStudents] data[0]:', data?.[0])

    if (error) {
      console.error('Error fetching students:', error)
      return { error: 'Failed to fetch students' }
    }

    console.log('[getStudents] Returning data:', data)
    return { data: data as Student[] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getStudent(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .single()

    if (error) {
      console.error('Error fetching student:', error)
      return { error: 'Student not found' }
    }

    return { data: data as Student }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

interface CreateStudentInput {
  firstName: string
  lastName: string
  email: string
  phone?: string
  notes?: string
}

export async function createStudent(input: CreateStudentInput) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('students')
      .insert({
        organization_id: organization.id,
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        phone: input.phone || null,
        notes: input.notes || null,
      } as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating student:', error)
      return { error: 'Failed to create student' }
    }

    return { data: data as Student, success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

interface UpdateStudentInput {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string | null
  notes?: string | null
}

export async function updateStudent(id: string, input: UpdateStudentInput) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    // Verify student belongs to organization
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .single()

    if (!student) {
      return { error: 'Student not found or does not belong to your organization' }
    }

    const updateData: StudentUpdate = {}
    if (input.firstName !== undefined) updateData.first_name = input.firstName
    if (input.lastName !== undefined) updateData.last_name = input.lastName
    if (input.email !== undefined) updateData.email = input.email
    if (input.phone !== undefined) updateData.phone = input.phone
    if (input.notes !== undefined) updateData.notes = input.notes

    const { data, error } = await (supabase.from('students') as any)
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organization.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating student:', error)
      return { error: 'Failed to update student' }
    }

    return { data: data as Student, success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function deleteStudent(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id)
      .eq('organization_id', organization.id)

    if (error) {
      console.error('Error deleting student:', error)
      return { error: 'Failed to delete student' }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
