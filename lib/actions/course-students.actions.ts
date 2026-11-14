'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { logOperation } from '@/lib/actions/history.actions'
import { actionError } from '@/lib/i18n/actionError'

/**
 * Get all students enrolled in a course
 */
export async function getCourseStudents(courseId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }

  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await (supabase
      .from('course_students'))
      .select(`
        id, 
        student_id, 
        joined_at, 
        students(
          id,
          first_name, 
          last_name, 
          phone,
          student_packages(
            id,
            remaining_credits,
            packages(
              id,
              dance_type_id
            )
          )
        ),
        courses(
          dance_type_id
        )
      `)
      .eq('course_id', courseId)
      .order('joined_at', { ascending: false })

    if (error) {
      console.error('Error fetching course students:', error)
      return { error: await actionError('fetchCourseStudentsFailed') }
    }

    return { data }
  } catch (error) {
    console.error('Unexpected error in getCourseStudents:', error)
    return { error: await actionError('unexpected') }
  }
}

/**
 * Add a student to a course
 */
export async function addStudentToCourse(courseId: string, studentId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await (supabase
      .from('course_students'))
      .insert({
        course_id: courseId,
        student_id: studentId,
      })
      .select()
      .single()

    if (error) {
      // If it's a unique constraint error, return success (already enrolled)
      if (error?.code === '23505') {
        return { success: true, data: { message: 'Student already enrolled' } }
      }
      console.error('Error adding student to course:', error)
      return { error: await actionError('addStudentToCourseFailed') }
    }

    console.log('[addStudentToCourse] 🎯 Student added successfully, now logging...')

    // Get student name for history logging
    const { data: studentData } = await (supabase
      .from('students'))
      .select('first_name, last_name')
      .eq('id', studentId)
      .single()
    
    const studentName = studentData 
      ? `${studentData.first_name} ${studentData.last_name}`.trim()
      : 'Unknown Student'

    // Log the action to history using the standard pattern
    await logOperation('CREATE', 'course_student', courseId, {
      after: {
        studentId: studentId,
        studentName: studentName,
        courseId: courseId,
      },
    }, organization.id)

    console.log('[addStudentToCourse] ✅ History logged')
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error in addStudentToCourse:', error)
    return { error: await actionError('unexpected') }
  }
}

/**
 * Remove a student from a course
 */
export async function removeStudentFromCourse(courseId: string, studentId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  try {
    const supabase = await createServerSupabaseClient()

    const { error } = await (supabase
      .from('course_students'))
      .delete()
      .eq('course_id', courseId)
      .eq('student_id', studentId)

    if (error) {
      console.error('Error removing student from course:', error)
      return { error: await actionError('removeStudentFromCourseFailed') }
    }

    console.log('[removeStudentFromCourse] 🎯 Student removed successfully, now logging...')

    // Get student name for history logging
    const { data: studentData } = await (supabase
      .from('students'))
      .select('first_name, last_name')
      .eq('id', studentId)
      .single()
    
    const studentName = studentData 
      ? `${studentData.first_name} ${studentData.last_name}`.trim()
      : 'Unknown Student'

    // Log the action to history using the standard pattern
    await logOperation('DELETE', 'course_student', courseId, {
      before: {
        studentId: studentId,
        studentName: studentName,
        courseId: courseId,
      },
    }, organization.id)

    console.log('[removeStudentFromCourse] ✅ History logged')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error in removeStudentFromCourse:', error)
    return { error: await actionError('unexpected') }
  }
}

/**
 * Get all courses a student is enrolled in with attendance stats
 */
export async function getStudentEnrolledCourses(studentId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }

  try {
    const supabase = await createServerSupabaseClient()

    // Get all courses this student is enrolled in
    const { data: courseEnrollments, error: enrollmentError } = await (supabase
      .from('course_students'))
      .select(
        `
        id,
        course_id,
        joined_at,
        courses(
          id, name, day_of_week, start_time, end_time, dance_type_id,
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
      return { error: await actionError('fetchEnrolledCoursesFailed') }
    }

    if (!courseEnrollments || courseEnrollments.length === 0) {
      return { data: { active: [], completed: [] } }
    }

    // Get student packages to check remaining credits
    const { data: studentPackages, error: packagesError } = await (supabase
      .from('student_packages'))
      .select('id, remaining_credits, packages(dance_type_id)')
      .eq('student_id', studentId)

    if (packagesError) {
      console.error('Error fetching student packages:', packagesError)
      return { error: await actionError('fetchStudentPackagesFailed') }
    }

    // For each course, get attendance counts
    const coursesWithStats = await Promise.all(
      courseEnrollments.map(async (enrollment) => {
        // Get attendance records for this student in this course
        const { data: attendances } = await (supabase
          .from('attendances'))
          .select('id, created_at, course_sessions(session_date)')
          .eq('student_id', studentId)
          .in(
            'session_id',
            (
              await supabase.from('course_sessions')
                .select('id')
                .eq('course_id', enrollment.courses.id)
            ).data?.map((s) => s.id) || [],
          )

        // Find matching package for this course's dance type
        const matchingPackage = studentPackages?.find(
          (pkg) => pkg.packages?.dance_type_id === enrollment.courses.dance_type_id
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
          attendanceDates: attendances?.map((a) => a.course_sessions?.session_date) || [],
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
    return { error: await actionError('unexpected') }
  }
}
