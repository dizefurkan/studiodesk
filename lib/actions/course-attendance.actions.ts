'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { actionError } from '@/lib/i18n/actionError'
import { unstable_rethrow } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPayAccess } from '@/lib/auth/payAccess'
import { addDaysToDateString, lastOccurrence, todayInTimeZone } from '@/lib/i18n/dates'

export async function getCourseAttendanceHistory(courseId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  try {
    const supabase = await createServerSupabaseClient()

    // Get all sessions for this course FIRST
    const { data: sessions, error: sessionsError } = await (supabase
      .from('course_sessions'))
      .select('id, session_date')
      .eq('course_id', courseId)
      .order('session_date', { ascending: false })

    if (sessionsError) {
      console.error('Error fetching course sessions:', sessionsError)
      return { error: await actionError('fetchSessionsFailed') }
    }

    if (!sessions || sessions.length === 0) {
      return { data: [] }
    }

    // Get session IDs
    const sessionIds = sessions.map((s) => s.id)

    // NOW get attendances for these specific sessions (all records: present and absent)
    const { data: attendances, error: attendancesError } = await (supabase
      .from('attendances'))
      .select('id, session_id, is_present, created_at, notes, student:students(id, first_name, last_name), studios(id, name)')
      .in('session_id', sessionIds)

    if (attendancesError) {
      console.error('Error fetching attendances:', attendancesError)
      return { error: await actionError('fetchAttendancesFailed') }
    }

    // Get instructors for these sessions
    const { data: sessionInstructors, error: instructorsError } = await (supabase
      .from('session_instructors'))
      .select('session_id, instructor:instructors(id, first_name, last_name)')
      .in('session_id', sessionIds)

    if (instructorsError) {
      console.error('Error fetching session instructors:', instructorsError)
      // Don't fail - instructors are optional
    }

    // Fallback: Get course instructors if session-specific instructors don't exist
    const { data: courseInstructors, error: courseInstructorsError } = await (supabase
      .from('course_instructors'))
      .select('instructor:instructors(id, first_name, last_name)')
      .eq('course_id', courseId)

    if (courseInstructorsError) {
      console.error('Error fetching course instructors:', courseInstructorsError)
      // Don't fail - instructors are optional
    }

    // Combine sessions with their attendance counts and instructors
    const formattedSessions = sessions.map((session) => {
      const sessionAttendances = (attendances || []).filter(
        (a) => a.session_id === session.id
      )
      const presentCount = sessionAttendances.filter((a) => a.is_present).length
      
      // ✅ Use session-specific instructors if available, fallback to course instructors
      const sessionSpecificInstructors = (sessionInstructors || []).filter(
        (si) => si.session_id === session.id
      ).map((si) => si.instructor)
      
      const instructors = sessionSpecificInstructors.length > 0 
        ? sessionSpecificInstructors 
        : (courseInstructors || []).map((ci) => ci.instructor)

      return {
        id: session.id,
        session_date: session.session_date,
        attendance_count: presentCount,  // Count of students who were present
        total_attendance: sessionAttendances.length,  // Total attendance records (present + absent)
        attendances: sessionAttendances,  // All attendance records (present and absent)
        instructors: instructors,  // Instructors for this session (session-specific or course default)
      }
    })

    return { data: formattedSessions }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: await actionError('unexpected') }
  }
}

/**
 * Numbers for the top of a course page: lessons held, attendance and its rate, instructor
 * pay for the course (owners and managers only) and when the first lesson was or will be.
 */
export async function getCourseSummary(courseId: string) {
  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  try {
    const admin = createAdminClient()
    const { data: course } = await admin
      .from('courses')
      .select('id, day_of_week, created_at, branches!inner(organization_id)')
      .eq('id', courseId)
      .eq('branches.organization_id', organization.id)
      .maybeSingle()
    if (!course) return { error: await actionError('courseNotFound') }

    const { data: sessions, error } = await admin
      .from('course_sessions')
      .select('id, session_date, attendances(is_present), instructor_earnings(amount)')
      .eq('course_id', courseId)
      .order('session_date')
    if (error) throw error

    // A lesson counts once attendance was taken for it
    const held = (sessions ?? []).filter((s) => (s.attendances ?? []).length > 0)
    const records = held.reduce((n, s) => n + s.attendances.length, 0)
    const present = held.reduce((n, s) => n + s.attendances.filter((a) => a.is_present).length, 0)

    const access = await getPayAccess()
    const earnings = access?.canManage
      ? (sessions ?? []).reduce((sum, s) => sum + (s.instructor_earnings ?? []).reduce((a, e) => a + Number(e.amount), 0), 0)
      : null

    // First lesson: the first one with attendance; otherwise the next one on the timetable
    const today = todayInTimeZone(organization.timezone)
    let firstLesson: { date: string; planned: boolean }
    if (held.length > 0) {
      firstLesson = { date: held[0].session_date, planned: false }
    } else {
      const from = course.created_at.slice(0, 10) > today ? course.created_at.slice(0, 10) : today
      // The course's weekday on or after `from`
      firstLesson = { date: lastOccurrence(course.day_of_week, addDaysToDateString(from, 6)), planned: true }
    }

    return {
      data: {
        lessons: held.length,
        present,
        records,
        rate: records > 0 ? present / records : null,
        earnings,
        currency: organization.currency || 'TRY',
        firstLesson,
      },
    }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Error in getCourseSummary:', error)
    return { error: await actionError('fetchSessionsFailed') }
  }
}
