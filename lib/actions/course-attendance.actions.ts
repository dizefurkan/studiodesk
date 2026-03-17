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

    // Get all sessions for this course
    const { data: sessions, error: sessionsError } = await supabase
      .from('course_sessions')
      .select(`
        id,
        session_date,
        attendances(
          id,
          created_at,
          students(first_name, last_name),
          studios(name)
        )
      `)
      .eq('course_id', courseId)
      .order('session_date', { ascending: false })

    if (sessionsError) {
      console.error('Error fetching course attendance history:', sessionsError)
      return { error: 'Failed to fetch attendance history' }
    }

    // Transform data to include attendance count and studio used
    const formattedSessions = (sessions || []).map((session: any) => ({
      id: session.id,
      session_date: session.session_date,
      attendance_count: session.attendances?.length || 0,
      attendances: session.attendances || [],
    }))

    return { data: formattedSessions }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
