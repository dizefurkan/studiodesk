'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'

export async function getInstructorCourses(instructorId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const adminSupabase = createAdminClient()

    // Verify instructor belongs to organization
    const { data: instructor, error: instructorError } = await (adminSupabase
      .from('instructors') as any)
      .select('organization_id')
      .eq('id', instructorId)
      .single()

    if (instructorError || !instructor || instructor.organization_id !== organization.id) {
      return { error: 'Instructor not found or access denied' }
    }

    // Get courses assigned to this instructor
    const { data, error } = await (adminSupabase
      .from('course_instructors') as any)
      .select(`
        course_id,
        courses(
          id,
          name,
          start_time,
          end_time,
          day_of_week,
          branches(name),
          dance_types(name)
        )
      `)
      .eq('instructor_id', instructorId)

    if (error) {
      console.error('Error fetching instructor courses:', error)
      return { error: 'Failed to fetch courses' }
    }

    const courses = (data || [])
      .filter((ci: any) => ci.courses)
      .map((ci: any) => ci.courses)

    return { data: courses }
  } catch (error) {
    console.error('Unexpected error in getInstructorCourses:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getInstructorMonthlyStats(instructorId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const adminSupabase = createAdminClient()

    // Verify instructor belongs to organization
    const { data: instructor, error: instructorError } = await (adminSupabase
      .from('instructors') as any)
      .select('organization_id')
      .eq('id', instructorId)
      .single()

    if (instructorError || !instructor || instructor.organization_id !== organization.id) {
      return { error: 'Instructor not found or access denied' }
    }

    // Get current month dates
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    // Get earnings for this month
    const { data: earningsData, error: earningsError } = await (adminSupabase
      .from('instructor_earnings') as any)
      .select('amount, created_at')
      .eq('instructor_id', instructorId)
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth)

    if (earningsError) {
      console.error('Error fetching monthly earnings:', earningsError)
      return { error: 'Failed to fetch earnings' }
    }

    const totalEarnings = ((earningsData || []) as any[]).reduce((sum, e) => sum + Number(e.amount), 0)
    const earningCount = earningsData?.length || 0

    // Get sessions for this month where instructor is assigned
    const { data: instructorSessions, error: sessionsError } = await (adminSupabase
      .from('session_instructors') as any)
      .select('session_id, course_sessions(id, session_date)')
      .eq('instructor_id', instructorId)

    if (sessionsError) {
      console.error('Error fetching instructor sessions:', sessionsError)
      return { error: 'Failed to fetch sessions' }
    }

    const monthSessions = (instructorSessions || []).filter((si: any) => {
      const sessionDate = si.course_sessions?.session_date
      return sessionDate && sessionDate >= startOfMonth && sessionDate <= endOfMonth
    })

    const sessionCount = monthSessions.length
    const sessionIds = monthSessions.map((si: any) => si.session_id)

    // Get attendance details for those sessions
    let attendanceDetails: any[] = []
    let attendanceCount = 0

    if (sessionIds.length > 0) {
      const { data: attendanceData, error: attendanceError } = await (adminSupabase
        .from('attendances') as any)
        .select('id, student_id, is_present, notes, created_at, students(first_name, last_name)')
        .in('session_id', sessionIds)
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth)

      if (attendanceError) {
        console.error('Error fetching monthly attendance:', attendanceError)
        return { error: 'Failed to fetch attendance' }
      }

      attendanceDetails = attendanceData || []
      attendanceCount = attendanceDetails.length
    }

    return {
      data: {
        totalEarnings,
        earningCount,
        sessionCount,
        attendanceCount,
        attendanceDetails,
        monthStart: startOfMonth,
        monthEnd: endOfMonth,
      }
    }
  } catch (error) {
    console.error('Unexpected error in getInstructorMonthlyStats:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getInstructorTotalEarnings(instructorId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const adminSupabase = createAdminClient()

    // Verify instructor belongs to organization
    const { data: instructor, error: instructorError } = await (adminSupabase
      .from('instructors') as any)
      .select('organization_id')
      .eq('id', instructorId)
      .single()

    if (instructorError || !instructor || instructor.organization_id !== organization.id) {
      return { error: 'Instructor not found or access denied' }
    }

    // Get all earnings for this instructor
    const { data: earningsData, error: earningsError } = await (adminSupabase
      .from('instructor_earnings') as any)
      .select('amount')
      .eq('instructor_id', instructorId)

    if (earningsError) {
      console.error('Error fetching total earnings:', earningsError)
      return { error: 'Failed to fetch earnings' }
    }

    const totalEarnings = ((earningsData || []) as any[]).reduce((sum, e) => sum + Number(e.amount), 0)

    return {
      data: {
        totalEarnings,
        sessionCount: earningsData?.length || 0,
      }
    }
  } catch (error) {
    console.error('Unexpected error in getInstructorTotalEarnings:', error)
    return { error: 'An unexpected error occurred' }
  }
}
