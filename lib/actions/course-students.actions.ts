'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'

/**
 * Get students with active packages for a dance type (not yet enrolled in the course)
 */
export async function getAvailableStudentsForCourse(courseId: string, danceTypeId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const adminSupabase = createAdminClient()

    // Get all students with active packages for this dance type
    // Join: student_packages -> packages -> dance_type
    const { data: studentsWithPackages, error: packagesError } = await (adminSupabase
      .from('student_packages') as any)
      .select('student_id, students(id, first_name, last_name), packages(dance_type_id)')
      .eq('students.organization_id', organization.id)
      .eq('packages.dance_type_id', danceTypeId)
      .gt('remaining_credits', 0)

    if (packagesError) {
      console.error('Error fetching students with packages:', packagesError)
      return { error: 'Failed to fetch available students' }
    }

    // Get students already enrolled in this course
    const { data: enrolledStudents, error: enrolledError } = await (adminSupabase
      .from('course_students') as any)
      .select('student_id')
      .eq('course_id', courseId)

    if (enrolledError) {
      console.error('Error fetching enrolled students:', enrolledError)
    }

    const enrolledStudentIds = new Set((enrolledStudents || []).map((cs: any) => cs.student_id))

    // Filter out already enrolled students and deduplicate
    const uniqueStudents = new Map()
    for (const record of studentsWithPackages || []) {
      const student = record.students
      if (student && !enrolledStudentIds.has(student.id)) {
        uniqueStudents.set(student.id, {
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
        })
      }
    }

    return { data: Array.from(uniqueStudents.values()) }
  } catch (error) {
    console.error('Unexpected error in getAvailableStudentsForCourse:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get all students enrolled in a course
 */
export async function getCourseStudents(courseId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await (supabase
      .from('course_students') as any)
      .select('id, student_id, joined_at, students(first_name, last_name, email)')
      .eq('course_id', courseId)
      .order('joined_at', { ascending: false })

    if (error) {
      console.error('Error fetching course students:', error)
      return { error: 'Failed to fetch course students' }
    }

    return { data }
  } catch (error) {
    console.error('Unexpected error in getCourseStudents:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Add a student to a course
 */
export async function addStudentToCourse(courseId: string, studentId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await (supabase
      .from('course_students') as any)
      .insert({
        course_id: courseId,
        student_id: studentId,
      })
      .select()
      .single()

    if (error) {
      // If it's a unique constraint error, return success (already enrolled)
      if ((error as any)?.code === '23505') {
        return { success: true, data: { message: 'Student already enrolled' } }
      }
      console.error('Error adding student to course:', error)
      return { error: 'Failed to add student to course' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error in addStudentToCourse:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Remove a student from a course
 */
export async function removeStudentFromCourse(courseId: string, studentId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()

    const { error } = await (supabase
      .from('course_students') as any)
      .delete()
      .eq('course_id', courseId)
      .eq('student_id', studentId)

    if (error) {
      console.error('Error removing student from course:', error)
      return { error: 'Failed to remove student from course' }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error in removeStudentFromCourse:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Auto-enroll a student in all courses matching their newly purchased package's dance type
 */
export async function autoEnrollStudentInCourses(studentId: string, danceTypeId: string, branchId?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const adminSupabase = createAdminClient()

    // Get all courses for this dance type
    let query = (adminSupabase
      .from('courses') as any)
      .select('id')
      .eq('dance_type_id', danceTypeId)

    // If branch is specified, only enroll in that branch; otherwise, all branches
    if (branchId) {
      query = query.eq('branch_id', branchId)
    }

    const { data: courses, error: coursesError } = await query

    if (coursesError) {
      console.error('Error fetching matching courses:', coursesError)
      return { error: 'Failed to find matching courses' }
    }

    if (!courses || courses.length === 0) {
      return { success: true, data: { enrolledCount: 0 } }
    }

    // Enroll in all matching courses
    const enrollments = courses.map((course: any) => ({
      course_id: course.id,
      student_id: studentId,
    }))

    const { error: insertError } = await (adminSupabase
      .from('course_students') as any)
      .insert(enrollments)

    if (insertError) {
      // If it's a unique constraint error, it means some are already enrolled - that's ok
      if ((insertError as any)?.code !== '23505') {
        console.error('Error enrolling student in courses:', insertError)
        return { error: 'Failed to enroll student in courses' }
      }
    }

    return { success: true, data: { enrolledCount: enrollments.length } }
  } catch (error) {
    console.error('Unexpected error in autoEnrollStudentInCourses:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get all courses a student is enrolled in with attendance stats
 */
export async function getStudentEnrolledCourses(studentId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()

    // Get all courses this student is enrolled in
    const { data: courseEnrollments, error: enrollmentError } = await (supabase
      .from('course_students') as any)
      .select(
        `
        id,
        course_id,
        joined_at,
        courses(
          id, name, day_of_week, start_time, end_time,
          branches(name),
          dance_types(name),
          course_instructors(instructor_id)
        )
      `,
      )
      .eq('student_id', studentId)
      .order('joined_at', { ascending: false })

    if (enrollmentError) {
      console.error('Error fetching course enrollments:', enrollmentError)
      return { error: 'Failed to fetch enrolled courses' }
    }

    if (!courseEnrollments || courseEnrollments.length === 0) {
      return { data: { active: [], completed: [] } }
    }

    // Get student packages to check remaining credits
    const { data: studentPackages, error: packagesError } = await (supabase
      .from('student_packages') as any)
      .select('id, remaining_credits, packages(dance_type_id)')
      .eq('student_id', studentId)

    if (packagesError) {
      console.error('Error fetching student packages:', packagesError)
      return { error: 'Failed to fetch student packages' }
    }

    // For each course, get attendance counts
    const coursesWithStats = await Promise.all(
      courseEnrollments.map(async (enrollment: any) => {
        // Get attendance records for this student in this course
        const { data: attendances } = await (supabase
          .from('attendances') as any)
          .select('id, created_at, course_sessions(session_date)')
          .eq('student_id', studentId)
          .in(
            'session_id',
            (
              await (supabase.from('course_sessions') as any)
                .select('id')
                .eq('course_id', enrollment.courses.id)
            ).data?.map((s: any) => s.id) || [],
          )

        // Find matching package for this course's dance type
        const matchingPackage = studentPackages?.find(
          (pkg: any) => pkg.packages?.dance_type_id === enrollment.courses.dance_type_id
        )

        return {
          courseId: enrollment.courses.id,
          courseName: enrollment.courses.name,
          branchName: enrollment.courses.branches?.name,
          danceTypeName: enrollment.courses.dance_types?.name,
          dayOfWeek: enrollment.courses.day_of_week,
          startTime: enrollment.courses.start_time,
          endTime: enrollment.courses.end_time,
          enrolledAt: enrollment.joined_at,
          attendanceCount: attendances?.length || 0,
          attendanceDates: attendances?.map((a: any) => a.course_sessions?.session_date) || [],
          remainingCredits: matchingPackage?.remaining_credits || 0,
          packageDanceTypeId: matchingPackage?.packages?.dance_type_id,
        }
      }),
    )

    // Separate into active (remaining_credits > 0) and completed (remaining_credits = 0)
    const active = coursesWithStats.filter((c) => c.remainingCredits > 0)
    const completed = coursesWithStats.filter((c) => c.remainingCredits === 0)

    return { data: { active, completed } }
  } catch (error) {
    console.error('Unexpected error in getStudentEnrolledCourses:', error)
    return { error: 'An unexpected error occurred' }
  }
}
