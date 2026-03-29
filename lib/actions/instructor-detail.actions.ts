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

export async function getInstructorAttendanceHistory(instructorId: string) {
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

    // Get all session IDs where instructor is assigned
    const { data: sessionInstructorLinks, error: linksError } = await (adminSupabase
      .from('session_instructors') as any)
      .select('session_id')
      .eq('instructor_id', instructorId)

    if (linksError) {
      console.error('Error fetching session links:', linksError)
      return { error: 'Failed to fetch sessions' }
    }

    const sessionIds = (sessionInstructorLinks || [])
      .map((si: any) => si.session_id)
      .filter((id: string) => id)

    if (sessionIds.length === 0) {
      return { data: [] }
    }

    // Get session details
    const { data: sessionDetails, error: sessionDetailsError } = await (adminSupabase
      .from('course_sessions') as any)
      .select('id, session_date, course_id')
      .in('id', sessionIds)

    if (sessionDetailsError) {
      console.error('Error fetching session details:', sessionDetailsError)
      return { error: 'Failed to fetch session details' }
    }

    // Get unique course IDs
    const courseIds = (sessionDetails || [])
      .filter((s: any) => s.course_id)
      .map((s: any) => s.course_id)
      .filter((id: string, idx: number, arr: string[]) => arr.indexOf(id) === idx)

    if (sessionIds.length === 0) {
      return { data: [] }
    }

    // Get course details
    let coursesMap = new Map()
    if (courseIds.length > 0) {
      const { data: courses, error: coursesError } = await (adminSupabase
        .from('courses') as any)
        .select(`
          id,
          name,
          dance_types(name)
        `)
        .in('id', courseIds)

      if (!coursesError && courses) {
        courses.forEach((course: any) => {
          coursesMap.set(course.id, course)
        })
      }
    }

    // Get attendance details for all sessions
    const { data: attendanceData, error: attendanceError } = await (adminSupabase
      .from('attendances') as any)
      .select(`
        id,
        session_id,
        student_id,
        is_present,
        notes,
        created_at,
        students(id, first_name, last_name)
      `)
      .in('session_id', sessionIds)

    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError)
      return { error: 'Failed to fetch attendance' }
    }

    // Get other instructors for each session
    const { data: allSessionInstructors, error: instructorsError } = await (adminSupabase
      .from('session_instructors') as any)
      .select(`
        session_id,
        instructor_id,
        instructors(id, first_name, last_name)
      `)
      .in('session_id', sessionIds)

    if (instructorsError) {
      console.error('Error fetching session instructors:', instructorsError)
      return { error: 'Failed to fetch instructors' }
    }

    // Combine data by session
    const sessionsMap = new Map()
    
    sessionDetails.forEach((session: any) => {
      const sessionId = session.id
      const course = coursesMap.get(session.course_id)
      
      if (!sessionsMap.has(sessionId)) {
        sessionsMap.set(sessionId, {
          sessionId,
          session_date: session.session_date,
          course_name: course?.name,
          dance_type: course?.dance_types?.name,
          course_id: session.course_id,
          instructors: [],
          attendance: [],
        })
      }
    })

    // Add instructors to sessions
    allSessionInstructors?.forEach((si: any) => {
      const session = sessionsMap.get(si.session_id)
      if (session && si.instructors) {
        session.instructors.push({
          id: si.instructors.id,
          name: `${si.instructors.first_name} ${si.instructors.last_name}`,
        })
      }
    })

    // Add attendance to sessions
    attendanceData?.forEach((att: any) => {
      const session = sessionsMap.get(att.session_id)
      if (session) {
        session.attendance.push(att)
      }
    })

    // Convert map to array and sort by date descending
    const result = Array.from(sessionsMap.values()).sort((a, b) => 
      new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
    )

    return { data: result }
  } catch (error) {
    console.error('Unexpected error in getInstructorAttendanceHistory:', error)
    return { error: 'An unexpected error occurred' }
  }
}
