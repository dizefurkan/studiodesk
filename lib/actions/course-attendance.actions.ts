'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'

export async function getCourseAttendanceHistory(courseId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    // Get all sessions for this course FIRST
    const { data: sessions, error: sessionsError } = await (supabase
      .from('course_sessions') as any)
      .select('id, session_date')
      .eq('course_id', courseId)
      .order('session_date', { ascending: false })

    if (sessionsError) {
      console.error('Error fetching course sessions:', sessionsError)
      return { error: 'Failed to fetch sessions' }
    }

    if (!sessions || sessions.length === 0) {
      return { data: [] }
    }

    // Get session IDs
    const sessionIds = sessions.map((s: any) => s.id)

    // NOW get attendances for these specific sessions (all records: present and absent)
    const { data: attendances, error: attendancesError } = await (supabase
      .from('attendances') as any)
      .select('id, session_id, is_present, created_at, notes, student:students(id, first_name, last_name), studios(id, name)')
      .in('session_id', sessionIds)

    if (attendancesError) {
      console.error('Error fetching attendances:', attendancesError)
      return { error: 'Failed to fetch attendances' }
    }

    // Combine sessions with their attendance counts
    const formattedSessions = sessions.map((session: any) => {
      const sessionAttendances = (attendances || []).filter(
        (a: any) => a.session_id === session.id
      )
      const presentCount = sessionAttendances.filter((a: any) => a.is_present).length
      return {
        id: session.id,
        session_date: session.session_date,
        attendance_count: presentCount,  // Count of students who were present
        attendances: sessionAttendances,  // All attendance records (present and absent)
      }
    })

    return { data: formattedSessions }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
