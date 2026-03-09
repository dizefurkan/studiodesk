'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import type { Database } from '@/lib/types/database.types'

type Course = Database['public']['Tables']['courses']['Row']
type CourseSession = Database['public']['Tables']['course_sessions']['Row']

interface CreateCourseInput {
  branchId: string
  danceTypeId: string
  name: string
  dayOfWeek: number
  startTime: string
  endTime: string
  capacity: number
  instructorIds?: string[]
}

interface UpdateCourseInput {
  name?: string
  dayOfWeek?: number
  startTime?: string
  endTime?: string
  capacity?: number
  instructorIds?: string[]
}

export async function getCourses(branchId?: string, searchQuery?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('courses')
      .select('*, branches(name), dance_types(name)')
      .order('created_at', { ascending: false })

    if (branchId) {
      query = query.eq('branch_id', branchId)
    }

    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching courses:', error)
      return { error: 'Failed to fetch courses' }
    }

    return { data: data as (Course & { branches: { name: string } | null; dance_types: { name: string } | null })[] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getCourse(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('courses')
      .select('*, branches(name), dance_types(name), course_instructors(instructor_id)')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching course:', error)
      return { error: 'Course not found' }
    }

    return { data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function createCourse(input: CreateCourseInput) {
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

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        branch_id: input.branchId,
        dance_type_id: input.danceTypeId,
        name: input.name,
        day_of_week: input.dayOfWeek,
        start_time: input.startTime,
        end_time: input.endTime,
        capacity: input.capacity,
      })
      .select()
      .single()

    if (courseError || !course) {
      console.error('Error creating course:', courseError)
      return { error: 'Failed to create course' }
    }

    // Add instructors if provided
    if (input.instructorIds && input.instructorIds.length > 0) {
      const instructorAssignments = input.instructorIds.map((instructorId) => ({
        course_id: course.id,
        instructor_id: instructorId,
      }))

      await supabase.from('course_instructors').insert(instructorAssignments)
    }

    return { success: true, data: course }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function updateCourse(id: string, input: UpdateCourseInput) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()

    const updateData: Record<string, any> = {}
    if (input.name !== undefined) updateData.name = input.name
    if (input.dayOfWeek !== undefined) updateData.day_of_week = input.dayOfWeek
    if (input.startTime !== undefined) updateData.start_time = input.startTime
    if (input.endTime !== undefined) updateData.end_time = input.endTime
    if (input.capacity !== undefined) updateData.capacity = input.capacity

    const { data, error } = await supabase.from('courses').update(updateData).eq('id', id).select().single()

    if (error) {
      console.error('Error updating course:', error)
      return { error: 'Failed to update course' }
    }

    // Update instructors if provided
    if (input.instructorIds) {
      await supabase.from('course_instructors').delete().eq('course_id', id)

      const instructorAssignments = input.instructorIds.map((instructorId) => ({
        course_id: id,
        instructor_id: instructorId,
      }))

      if (instructorAssignments.length > 0) {
        await supabase.from('course_instructors').insert(instructorAssignments)
      }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function deleteCourse(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.from('courses').delete().eq('id', id)

    if (error) {
      console.error('Error deleting course:', error)
      return { error: 'Failed to delete course' }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function generateCourseSessions(courseId: string, startDate: Date, endDate: Date) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()

    // Get course with day of week
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('day_of_week')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return { error: 'Course not found' }
    }

    // Generate sessions for all matching days between start and end date
    const sessions = []
    const current = new Date(startDate)

    while (current <= endDate) {
      if (current.getDay() === course.day_of_week) {
        sessions.push({
          course_id: courseId,
          session_date: current.toISOString().split('T')[0],
        })
      }
      current.setDate(current.getDate() + 1)
    }

    if (sessions.length === 0) {
      return { success: true, data: [] }
    }

    const { data, error } = await supabase.from('course_sessions').insert(sessions).select()

    if (error) {
      console.error('Error generating sessions:', error)
      return { error: 'Failed to generate sessions' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getCourseSessions(courseId: string, fromDate?: string, toDate?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('course_sessions')
      .select('*, attendances(count)')
      .eq('course_id', courseId)
      .order('session_date', { ascending: true })

    if (fromDate) {
      query = query.gte('session_date', fromDate)
    }

    if (toDate) {
      query = query.lte('session_date', toDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching course sessions:', error)
      return { error: 'Failed to fetch sessions' }
    }

    return { data: data as CourseSession[] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
