'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
  instructorIds?: string[]
  studentIds?: string[]
}

interface UpdateCourseInput {
  name?: string
  dayOfWeek?: number
  startTime?: string
  endTime?: string
  instructorIds?: string[]
  studentIds?: string[]
}

export async function getCourses(branchId?: string, searchQuery?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const admin = createAdminClient()
    let query = (admin as any)
      .from('courses')
      .select('*, branches(name), dance_types(name), course_instructors(instructor_id, instructors(id, first_name, last_name))')
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

    // Fetch student counts and attendance counts for each course
    const coursesWithStats = await Promise.all(
      (data as any[]).map(async (course) => {
        // Get student count
        const { count: studentCount } = await (admin as any)
          .from('course_students')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', course.id)

        // Get attendance count
        const { data: sessions } = await (admin as any)
          .from('course_sessions')
          .select('id')
          .eq('course_id', course.id)

        let attendanceCount = 0
        if (sessions && sessions.length > 0) {
          const sessionIds = sessions.map((s: any) => s.id)
          const { count } = await (admin as any)
            .from('attendances')
            .select('*', { count: 'exact', head: true })
            .in('session_id', sessionIds)
          attendanceCount = count || 0
        }

        return {
          ...course,
          studentCount: studentCount || 0,
          instructorCount: course.course_instructors?.length || 0,
          attendanceCount,
        }
      })
    )

    return { data: coursesWithStats }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getCourse(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const admin = createAdminClient()
    const { data, error } = await (admin as any)
      .from('courses')
      .select('*, branches(name), dance_types(name), course_instructors(instructor_id, instructors(id, first_name, last_name))')
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

export async function checkDuplicateCourseTime(
  branchId: string,
  danceTypeId: string,
  dayOfWeek: number,
  excludeCourseId?: string
) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const admin = createAdminClient()
    let query = (admin as any)
      .from('courses')
      .select('id, name, start_time, end_time, dance_type_id')
      .eq('branch_id', branchId)
      .eq('dance_type_id', danceTypeId)
      .eq('day_of_week', dayOfWeek)

    if (excludeCourseId) {
      query = query.neq('id', excludeCourseId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error checking duplicate courses:', error)
      return { error: 'Failed to check courses on this day' }
    }

    return { data: data || [], isDuplicate: (data?.length || 0) > 0 }
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

    // Check for duplicate course on the same day
    const duplicate = await checkDuplicateCourseTime(
      input.branchId,
      input.danceTypeId,
      input.dayOfWeek
    )

    if (duplicate.isDuplicate) {
      return { 
        error: 'A course for this dance type already exists on this day for this branch' 
      }
    }

    const { data: course, error: courseError } = await (supabase
      .from('courses') as any)
      .insert({
        branch_id: input.branchId,
        dance_type_id: input.danceTypeId,
        name: input.name,
        day_of_week: input.dayOfWeek,
        start_time: input.startTime,
        end_time: input.endTime,
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

      await (supabase.from('course_instructors') as any).insert(instructorAssignments)
    }

    // Note: students should NOT be added during course creation
    // They should be added through the AddStudentDialog after creation

    return { success: true, data: course }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function updateCourse(id: string, input: UpdateCourseInput) {
  console.log('[updateCourse] STARTED - Course ID:', id)
  
  const user = await getCurrentUser()
  console.log('[updateCourse] User:', user?.id || 'NO USER')
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  console.log('[updateCourse] Organization:', organization?.id || 'NO ORG')
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()
    console.log('[updateCourse] Supabase client created')

    // Verify course belongs to organization by checking its branch
    const { data: course, error: courseError } = await (supabase.from('courses') as any)
      .select('id, branch_id')
      .eq('id', id)
      .single()

    console.log('[updateCourse] Course fetch - Error:', courseError, 'Data:', course?.id)
    if (!course) {
      return { error: 'Course not found' }
    }

    // Verify the branch belongs to the organization
    const { data: branch, error: branchError } = await (supabase
      .from('branches') as any)
      .select('id')
      .eq('id', course.branch_id)
      .eq('organization_id', organization.id)
      .single()

    console.log('[updateCourse] Branch verification - Error:', branchError, 'Data:', branch?.id)
    if (branchError) {
      console.error('[updateCourse] Branch verification error:', branchError)
      return { error: 'Course does not belong to your organization' }
    }

    if (!branch) {
      return { error: 'Course does not belong to your organization' }
    }

    const updateData: Record<string, any> = {}
    if (input.name !== undefined) updateData.name = input.name
    if (input.dayOfWeek !== undefined) updateData.day_of_week = input.dayOfWeek
    if (input.startTime !== undefined) updateData.start_time = input.startTime
    if (input.endTime !== undefined) updateData.end_time = input.endTime

    console.log('[updateCourse] Update data:', updateData)
    const { data, error } = await (supabase.from('courses') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle()

    console.log('[updateCourse] Update result - Error:', error, 'Data:', data?.id)

    if (error) {
      console.error('Error updating course:', error)
      return { error: 'Failed to update course' }
    }

    // If no data was returned, it means the update didn't affect any rows (likely RLS policy issue)
    if (!data) {
      console.error('[updateCourse] No rows updated - RLS policy may be blocking the update')
      return { error: 'Failed to update course - permission denied' }
    }

    // Update instructors if provided
    if (input.instructorIds) {
      await (supabase.from('course_instructors') as any).delete().eq('course_id', id)

      const instructorAssignments = input.instructorIds.map((instructorId) => ({
        course_id: id,
        instructor_id: instructorId,
      }))

      if (instructorAssignments.length > 0) {
        await (supabase.from('course_instructors') as any).insert(instructorAssignments)
      }
    }

    // Update students if provided
    if (input.studentIds) {
      await (supabase.from('course_students') as any).delete().eq('course_id', id)

      const studentAssignments = input.studentIds.map((studentId) => ({
        course_id: id,
        student_id: studentId,
      }))

      if (studentAssignments.length > 0) {
        await (supabase.from('course_students') as any).insert(studentAssignments)
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
    const { data: course, error: courseError } = await (supabase
      .from('courses') as any)
      .select('day_of_week')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      console.error('Course error:', courseError)
      return { error: 'Course not found' }
    }

    // Validate day_of_week
    if (course.day_of_week === null || course.day_of_week === undefined) {
      return { error: 'Course day of week not set' }
    }

    // Get existing sessions for this period to avoid duplicates
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]
    
    // Use admin client to fetch existing sessions (bypasses RLS)
    const adminSupabase = createAdminClient()
    const { data: existingSessions, error: existingError } = await (adminSupabase
      .from('course_sessions') as any)
      .select('session_date')
      .eq('course_id', courseId)
      .gte('session_date', startDateStr)
      .lte('session_date', endDateStr)

    if (existingError) {
      console.error('Error fetching existing sessions:', existingError)
      // Don't fail - just continue with generation
    }

    const existingDates = new Set((existingSessions || []).map((s: any) => s.session_date))

    // Generate sessions for all matching days between start and end date
    const sessions = []
    const current = new Date(startDate)

    while (current <= endDate) {
      if (current.getDay() === course.day_of_week) {
        const sessionDate = current.toISOString().split('T')[0]
        // Only add if not already existing
        if (!existingDates.has(sessionDate)) {
          sessions.push({
            course_id: courseId,
            session_date: sessionDate,
          })
        }
      }
      current.setDate(current.getDate() + 1)
    }

    if (sessions.length === 0) {
      return { success: true, data: [] }
    }

    // Use admin client for insertion (bypasses RLS, which is fine for automatic generation)
    const { data, error } = await (adminSupabase.from('course_sessions') as any)
      .insert(sessions)
      .select()

    if (error) {
      console.error('Error inserting sessions:', {
        error,
        errorCode: (error as any)?.code,
        message: (error as any)?.message || JSON.stringify(error),
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        courseId,
        sessionCount: sessions.length,
        sessions: sessions.slice(0, 3), // Sample of sessions
      })
      // Return error so we know what happened
      return { error: 'Failed to insert sessions', details: (error as any)?.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error in generateCourseSessions:', {
      error,
      message: (error as any)?.message,
      stack: (error as any)?.stack?.split('\n').slice(0, 3),
    })
    return { error: 'Unexpected error generating sessions', details: (error as any)?.message }
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

// ===========================
// COURSE ENROLLMENT
// ===========================

export async function getCourseEnrolledStudents(courseId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()

    // Get course to find dance type
    const { data: course, error: courseError } = await (supabase
      .from('courses') as any)
      .select('dance_type_id')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return { error: 'Course not found' }
    }

    // Get students with active packages for this dance type
    const { data, error } = await (supabase
      .from('student_packages') as any)
      .select(
        'student_id, students(id, first_name, last_name), packages(dance_type_id)',
      )
      .eq('packages.dance_type_id', course.dance_type_id)

    if (error) {
      console.error('Error fetching enrolled students:', error)
      return { error: 'Failed to fetch enrolled students' }
    }

    return { data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getAvailableStudentsForCourse(courseId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    // Get course to find dance type
    const { data: course, error: courseError } = await (supabase
      .from('courses') as any)
      .select('dance_type_id')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return { error: 'Course not found' }
    }

    // Get all students with packages matching this dance type
    const { data, error } = await (supabase
      .from('student_packages') as any)
      .select(
        'student_id, students(id, first_name, last_name, email), packages(dance_type_id, remaining_credits)',
      )
      .eq('student_packages.packages.dance_type_id', course.dance_type_id)
      .eq('student_packages.students.organization_id', organization.id)

    if (error) {
      console.error('Error fetching available students:', error)
      return { error: 'Failed to fetch students' }
    }

    return { data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
