'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getWeekStart, getWeekEnd } from '@/lib/utils/session.utils'

/**
 * Check if a course already has attendance recorded this week
 */
export async function hasAttendanceThisWeek(
  courseId: string,
  weekStartDay: number,
): Promise<{ hasAttendance: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { hasAttendance: false, error: 'Not authenticated' }

  try {
    const today = new Date()
    const weekStart = getWeekStart(today, weekStartDay)
    const weekEnd = getWeekEnd(today, weekStartDay)

    const weekStartStr = weekStart.toISOString().split('T')[0]
    const weekEndStr = weekEnd.toISOString().split('T')[0]

    const supabase = await createServerSupabaseClient()

    // Check for any attendance in this week for this course
    const { data, error } = await supabase
      .from('attendances')
      .select('id', { count: 'exact' })
      .eq(
        'session_id',
        supabase
          .from('course_sessions')
          .select('id')
          .eq('course_id', courseId)
          .gte('session_date', weekStartStr)
          .lte('session_date', weekEndStr),
      )
      .limit(1)

    if (error) {
      console.error('Error checking attendance:', error)
      return { hasAttendance: false }
    }

    return { hasAttendance: (data?.length || 0) > 0 }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { hasAttendance: false, error: 'An error occurred' }
  }
}

/**
 * Get courses with attendance status for this week
 */
export async function getCoursesWithAttendanceStatus(weekStartDay: number) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()

    // Get all courses
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*, branches(name), dance_types(name), course_instructors(instructor_id)')
      .order('name')

    if (coursesError) {
      console.error('Error fetching courses:', coursesError)
      return { error: 'Failed to fetch courses' }
    }

    if (!courses) {
      return { data: [] }
    }

    // For each course, check if attendance was recorded this week
    const today = new Date()
    const weekStart = getWeekStart(today, weekStartDay)
    const weekEnd = getWeekEnd(today, weekStartDay)
    const weekStartStr = weekStart.toISOString().split('T')[0]
    const weekEndStr = weekEnd.toISOString().split('T')[0]

    const enrichedCourses = await Promise.all(
      (courses as any[]).map(async (course) => {
        // Check for sessions in this week
        const { data: sessionsThisWeek } = await supabase
          .from('course_sessions')
          .select('id')
          .eq('course_id', course.id)
          .gte('session_date', weekStartStr)
          .lte('session_date', weekEndStr)

        // Check for attendance in any of those sessions
        let attendanceRecorded = false
        const sessions = (sessionsThisWeek as Array<{ id: string }> | null) || []
        if (sessions && sessions.length > 0) {
          const { data: attendance } = await supabase
            .from('attendances')
            .select('id')
            .in(
              'session_id',
              sessions.map((s) => s.id),
            )
            .limit(1)

          attendanceRecorded = (attendance?.length || 0) > 0
        }

        return {
          ...course,
          attendanceRecordedThisWeek: attendanceRecorded,
        }
      }),
    )

    return { data: enrichedCourses }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
