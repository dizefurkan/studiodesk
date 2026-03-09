'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import type { Database } from '@/lib/types/database.types'

type Attendance = Database['public']['Tables']['attendances']['Row']

export async function getSessionAttendances(sessionId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('attendances')
      .select('*, students(first_name, last_name), student_packages(remaining_credits)')
      .eq('session_id', sessionId)

    if (error) {
      console.error('Error fetching attendances:', error)
      return { error: 'Failed to fetch attendances' }
    }

    return { data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getSessionStudents(sessionId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()

    // Get course from session
    const { data: session, error: sessionError } = await (supabase
      .from('course_sessions') as any)
      .select('course_id')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return { error: 'Session not found' }
    }

    // Get course info
    const { data: courseData, error: courseError } = await (supabase
      .from('courses') as any)
      .select('dance_type_id')
      .eq('id', session.course_id)
      .single()

    if (courseError || !courseData) {
      return { error: 'Course not found' }
    }

    // Use admin client to fetch students with packages (complex RLS-sensitive query)
    const adminSupabase = createAdminClient()
    const { data: students, error: studentsError } = await (adminSupabase
      .from('students') as any)
      .select(
        'id, first_name, last_name, student_packages(id, remaining_credits, package:packages(id, dance_type_id))',
      )
      .eq('student_packages.package.dance_type_id', courseData.dance_type_id)

    if (studentsError) {
      console.error('Error fetching students:', {
        error: studentsError,
        message: (studentsError as any)?.message,
        details: (studentsError as any)?.details,
      })
      return { error: 'Failed to fetch students' }
    }

    // Filter to only students with remaining credits
    const filteredStudents = (students || [])
      .map((student: any) => ({
        ...student,
        student_packages: (student.student_packages || []).filter((sp: any) => sp.remaining_credits > 0),
      }))
      .filter((student: any) => student.student_packages.length > 0)

    return { data: filteredStudents }
  } catch (error) {
    console.error('Unexpected error in getSessionStudents:', {
      error,
      message: (error as any)?.message,
      stack: (error as any)?.stack?.split('\n').slice(0, 3),
    })
    return { error: 'An unexpected error occurred' }
  }
}

export async function recordAttendance(sessionId: string, studentId: string, studentPackageId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()

    // Record attendance
    const { data, error } = await (supabase
      .from('attendances') as any)
      .insert({
        session_id: sessionId,
        student_id: studentId,
        student_package_id: studentPackageId,
      })
      .select()
      .single()

    if (error) {
      console.error('Error recording attendance:', error)
      return { error: 'Failed to record attendance' }
    }

    // Deduct credit from student_package
    const { data: pkg } = await (supabase
      .from('student_packages') as any)
      .select('remaining_credits')
      .eq('id', studentPackageId)
      .single()

    if (pkg && pkg.remaining_credits > 0) {
      await (supabase
        .from('student_packages') as any)
        .update({ remaining_credits: pkg.remaining_credits - 1 })
        .eq('id', studentPackageId)
    }

    // Get session and course info for instructor earnings
    const { data: sessionData } = await (supabase
      .from('course_sessions') as any)
      .select('course_id')
      .eq('id', sessionId)
      .single()

    if (sessionData) {
      // Get instructors for this course
      const { data: courseInstructors } = await (supabase
        .from('course_instructors') as any)
        .select('instructor_id')
        .eq('course_id', sessionData.course_id)

      if (courseInstructors && courseInstructors.length > 0) {
        // Get course details for rate calculation
        const { data: courseData } = await (supabase
          .from('courses') as any)
          .select('branch_id, dance_type_id')
          .eq('id', sessionData.course_id)
          .single()

        if (courseData) {
          // Calculate earnings for each instructor
          for (const ci of courseInstructors) {
            const { data: rateData } = await (supabase
              .from('instructor_rates') as any)
              .select('price_per_class')
              .eq('instructor_id', ci.instructor_id)
              .eq('branch_id', courseData.branch_id)
              .eq('dance_type_id', courseData.dance_type_id)
              .single()

            const amount = rateData?.price_per_class || 0

            // Check if earnings already recorded for this instructor and session
            const { data: existingEarning } = await (supabase
              .from('instructor_earnings') as any)
              .select('id')
              .eq('instructor_id', ci.instructor_id)
              .eq('session_id', sessionId)
              .single()

            // Only record if not already recorded
            if (!existingEarning && amount > 0) {
              await (supabase
                .from('instructor_earnings') as any)
                .insert({
                  instructor_id: ci.instructor_id,
                  session_id: sessionId,
                  amount,
                })
            }
          }
        }
      }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function removeAttendance(attendanceId: string, studentPackageId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()

    // Get the current credit count
    const { data: pkg } = await (supabase
      .from('student_packages') as any)
      .select('remaining_credits')
      .eq('id', studentPackageId)
      .single()

    // Restore credit
    if (pkg) {
      await (supabase
        .from('student_packages') as any)
        .update({ remaining_credits: pkg.remaining_credits + 1 })
        .eq('id', studentPackageId)
    }

    // Remove attendance record
    const { error } = await supabase.from('attendances').delete().eq('id', attendanceId)

    if (error) {
      console.error('Error removing attendance:', error)
      return { error: 'Failed to remove attendance' }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getAttendanceReports(
  studentId?: string,
  dateFrom?: string,
  dateTo?: string,
) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('attendances')
      .select(
        'id, student_id, session_id, created_at, students(first_name, last_name), course_sessions(session_date)',
      )
      .order('created_at', { ascending: false })

    if (studentId) {
      query = query.eq('student_id', studentId)
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching attendance reports:', error)
      return { error: 'Failed to fetch reports' }
    }

    return { data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
