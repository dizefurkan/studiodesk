'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { logOperation } from '@/lib/actions/history.actions'
import { getChanges } from '@/lib/utils/history-utils'
import type { Database } from '@/lib/types/database.types'

type Course = Database['public']['Tables']['courses']['Row']
type CourseSession = Database['public']['Tables']['course_sessions']['Row']
type Branch = Database['public']['Tables']['branches']['Row']
type DanceType = Database['public']['Tables']['dance_types']['Row']
type CourseInstructor = Database['public']['Tables']['course_instructors']['Row']
type Instructor = Database['public']['Tables']['instructors']['Row']
type Student = Database['public']['Tables']['students']['Row']
type StudentPackage = Database['public']['Tables']['student_packages']['Row']
type Package = Database['public']['Tables']['packages']['Row']
type InstructorRate = Database['public']['Tables']['instructor_rates']['Row']

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

type CourseWithStats = Course & {
  branches: { name: string }
  dance_types: { name: string }
  course_instructors: Array<{ instructor_id: string; instructors: { id: string; first_name: string; last_name: string } }>
  studentCount?: number
  instructorCount?: number
  attendanceCount?: number
}

export async function getCourses(
  branchId?: string,
  searchQuery?: string,
  danceTypeId?: string,
): Promise<{ data?: CourseWithStats[]; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const admin = createAdminClient()
    let query = admin
      .from('courses')
      .select('*, branches(name), dance_types(name), course_instructors(instructor_id, instructors(id, first_name, last_name))')
      .order('created_at', { ascending: false })

    if (branchId) {
      query = query.eq('branch_id', branchId)
    }

    if (danceTypeId) {
      query = query.eq('dance_type_id', danceTypeId)
    }

    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`)
    }

    const result = await query.overrideTypes<CourseWithStats[]>()
    const { data, error } = result as { data: CourseWithStats[] | null; error: any }

    if (error) {
      console.error('Error fetching courses:', error)
      return { error: 'Failed to fetch courses' }
    }

    // Fetch student counts and attendance counts for each course
    const coursesWithStats = await Promise.all(
      (data || []).map(async (course) => {
        // Get student count
        const { count: studentCount } = await (admin as any)
          .from('course_students')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', course.id)

        // Get attendance count
        const { data: sessions } = await admin
          .from('course_sessions')
          .select('id')
          .eq('course_id', course.id)
          .overrideTypes<CourseSession[]>()

        let attendanceCount = 0
        if (sessions && sessions.length > 0) {
          const sessionIds = sessions.map((s) => s.id)
          const { count } = await admin
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

export async function getCourse(id: string): Promise<{ data?: CourseWithStats; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const admin = createAdminClient()
    const result = await admin
      .from('courses')
      .select('*, branches(name), dance_types(name), course_instructors(instructor_id, instructors(id, first_name, last_name))')
      .eq('id', id)
      .single()
      .overrideTypes<CourseWithStats>() as any

    const { data, error } = result as { data: CourseWithStats | null; error: any }

    if (error || !data) {
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
  excludeCourseId?: string,
): Promise<{ data?: Course[]; isDuplicate?: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const admin = createAdminClient()
    let query = admin
      .from('courses')
      .select('id, name, start_time, end_time, dance_type_id')
      .eq('branch_id', branchId)
      .eq('dance_type_id', danceTypeId)
      .eq('day_of_week', dayOfWeek)

    if (excludeCourseId) {
      query = query.neq('id', excludeCourseId)
    }

    const result = await query.overrideTypes<Course[]>()
    const { data, error } = result as { data: Course[] | null; error: any }

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

export async function createCourse(
  input: CreateCourseInput,
): Promise<{ data?: Course; success?: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    // Verify branch belongs to organization
    const result = await supabase
      .from('branches')
      .select('id')
      .eq('id', input.branchId)
      .eq('organization_id', organization.id)
      .single()
      .overrideTypes<Branch>() as any

    const { data: branch, error: branchError } = result as { data: Branch | null; error: any }

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

    const courseResult = await supabase
      .from('courses')
      .insert({
        branch_id: input.branchId,
        dance_type_id: input.danceTypeId,
        name: input.name,
        day_of_week: input.dayOfWeek,
        start_time: input.startTime,
        end_time: input.endTime,
      } as any)
      .select()
      .single()
      .overrideTypes<Course>() as any

    const { data: course, error: courseError } = courseResult as { data: Course | null; error: any }

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

    // Log the create operation
    void logOperation('CREATE', 'course', course.id, {
      after: {
        name: course.name,
        dayOfWeek: course.day_of_week,
        startTime: course.start_time,
        endTime: course.end_time,
        branchId: course.branch_id,
        danceTypeId: course.dance_type_id,
      }
    }, organization.id)

    return { success: true, data: course }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function updateCourse(
  id: string,
  input: UpdateCourseInput,
): Promise<{ data?: Course; success?: boolean; error?: string }> {
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

    // Fetch before state for logging
    const beforeResult = await supabase
      .from('courses')
      .select('id, name, day_of_week, start_time, end_time, branch_id, dance_type_id')
      .eq('id', id)
      .single()
      .overrideTypes<Course>() as any

    const { data: beforeCourse, error: beforeError } = beforeResult as { data: Course | null; error: any }

    console.log('[updateCourse] Before course fetch - Error:', beforeError, 'Data:', beforeCourse?.id)
    if (!beforeCourse) {
      return { error: 'Course not found' }
    }

    // Verify the branch belongs to the organization
    const branchResult = await supabase
      .from('branches')
      .select('id')
      .eq('id', beforeCourse.branch_id)
      .eq('organization_id', organization.id)
      .single()
      .overrideTypes<Branch>() as any

    const { data: branch, error: branchError } = branchResult as { data: Branch | null; error: any }

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
    const updateResult = await (supabase.from('courses') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle() as any

    const { data, error } = updateResult as { data: Course | null; error: any }

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

    // Log the update operation
    const beforeObj = {
      name: beforeCourse.name,
      dayOfWeek: beforeCourse.day_of_week,
      startTime: beforeCourse.start_time,
      endTime: beforeCourse.end_time,
      branchId: beforeCourse.branch_id,
      danceTypeId: beforeCourse.dance_type_id,
    }
    const afterObj = {
      name: data.name,
      dayOfWeek: data.day_of_week,
      startTime: data.start_time,
      endTime: data.end_time,
      branchId: data.branch_id,
      danceTypeId: data.dance_type_id,
    }
    const changes = getChanges(beforeObj, afterObj)
    void logOperation('UPDATE', 'course', id, {
      before: beforeObj,
      after: afterObj,
      changes,
    }, organization.id)

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function deleteCourse(id: string): Promise<{ success?: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    // Fetch before state for logging
    const deleteResult = await supabase
      .from('courses')
      .select('id, name, day_of_week, start_time, end_time, branch_id, dance_type_id')
      .eq('id', id)
      .single()
      .overrideTypes<Course>() as any

    const { data: beforeCourse, error: fetchError } = deleteResult as { data: Course | null; error: any }

    if (!beforeCourse) {
      return { error: 'Course not found' }
    }

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id)
      .overrideTypes<Course>()

    if (error) {
      console.error('Error deleting course:', error)
      return { error: 'Failed to delete course' }
    }

    // Log the delete operation
    const beforeObj = {
      name: beforeCourse.name,
      dayOfWeek: beforeCourse.day_of_week,
      startTime: beforeCourse.start_time,
      endTime: beforeCourse.end_time,
      branchId: beforeCourse.branch_id,
      danceTypeId: beforeCourse.dance_type_id,
    }
    void logOperation('DELETE', 'course', id, {
      before: beforeObj,
    }, organization.id)

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function generateCourseSessions(
  courseId: string,
  startDate: Date,
  endDate: Date,
): Promise<{ success?: boolean; data?: CourseSession[]; error?: string; details?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()

    // Get course with day of week
    const courseResult = await supabase
      .from('courses')
      .select('day_of_week')
      .eq('id', courseId)
      .single()
      .overrideTypes<Course>() as any

    const { data: course, error: courseError } = courseResult as { data: Course | null; error: any }

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
    const existingResult = await adminSupabase
      .from('course_sessions')
      .select('session_date')
      .eq('course_id', courseId)
      .gte('session_date', startDateStr)
      .lte('session_date', endDateStr)
      .overrideTypes<CourseSession[]>()

    const { data: existingSessions, error: existingError } = existingResult as { data: CourseSession[] | null; error: any }

    if (existingError) {
      console.error('Error fetching existing sessions:', existingError)
      // Don't fail - just continue with generation
    }

    const existingDates = new Set((existingSessions || []).map((s: CourseSession) => s.session_date))

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
    const insertResult = await (adminSupabase.from('course_sessions') as any)
      .insert(sessions)
      .select() as any

    const { data, error } = insertResult as { data: CourseSession[] | null; error: any }

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

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error in generateCourseSessions:', {
      error,
      message: (error as any)?.message,
      stack: (error as any)?.stack?.split('\n').slice(0, 3),
    })
    return { error: 'Unexpected error generating sessions', details: (error as any)?.message }
  }
}

export async function getCourseSessions(
  courseId: string,
  fromDate?: string,
  toDate?: string,
): Promise<{ data?: CourseSession[]; error?: string }> {
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

    const result = await query.overrideTypes<CourseSession[]>()
    const { data, error } = result as { data: CourseSession[] | null; error: any }

    if (error) {
      console.error('Error fetching course sessions:', error)
      return { error: 'Failed to fetch sessions' }
    }

    return { data: data || [] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// ===========================
// COURSE ENROLLMENT
// ===========================

type EnrolledStudent = StudentPackage & {
  students: Student
  packages: Package
}

export async function getCourseEnrolledStudents(
  courseId: string,
): Promise<{ data?: EnrolledStudent[]; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()

    // Get course to find dance type
    const courseResult = await supabase
      .from('courses')
      .select('dance_type_id')
      .eq('id', courseId)
      .single()
      .overrideTypes<Course>() as any

    const { data: course, error: courseError } = courseResult as { data: Course | null; error: any }

    if (courseError || !course) {
      return { error: 'Course not found' }
    }

    // Get students with active packages for this dance type
    const enrolledResult = await supabase
      .from('student_packages')
      .select(
        'student_id, students(id, first_name, last_name), packages(dance_type_id)',
      )
      .eq('packages.dance_type_id', course.dance_type_id)
      .overrideTypes<EnrolledStudent[]>()

    const { data, error } = enrolledResult as { data: EnrolledStudent[] | null; error: any }

    if (error) {
      console.error('Error fetching enrolled students:', error)
      return { error: 'Failed to fetch enrolled students' }
    }

    return { data: data || [] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

type AvailableStudent = StudentPackage & {
  students: Student
  packages: Package
}

export async function getAvailableStudentsForCourse(
  courseId: string,
): Promise<{ data?: AvailableStudent[]; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    // Get course to find dance type
    const courseResult = await supabase
      .from('courses')
      .select('dance_type_id')
      .eq('id', courseId)
      .single()
      .overrideTypes<Course>() as any

    const { data: course, error: courseError } = courseResult as { data: Course | null; error: any }

    if (courseError || !course) {
      return { error: 'Course not found' }
    }

    // Get all students with packages matching this dance type
    const availableResult = await supabase
      .from('student_packages')
      .select(
        'student_id, students(id, first_name, last_name, email), packages(dance_type_id, remaining_credits)',
      )
      .eq('student_packages.packages.dance_type_id', course.dance_type_id)
      .eq('student_packages.students.organization_id', organization.id)
      .overrideTypes<AvailableStudent[]>()

    const { data, error } = availableResult as { data: AvailableStudent[] | null; error: any }

    if (error) {
      console.error('Error fetching available students:', error)
      return { error: 'Failed to fetch students' }
    }

    return { data: data || [] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
