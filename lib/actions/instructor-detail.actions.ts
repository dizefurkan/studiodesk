'use server'

import { toDateString } from '@/lib/i18n/dates'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { actionError } from '@/lib/i18n/actionError'
import { canSeeInstructor, getPayAccess } from '@/lib/auth/payAccess'

export async function getInstructorCourses(instructorId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  try {
    const adminSupabase = createAdminClient()

    // Verify instructor belongs to organization
    const { data: instructor, error: instructorError } = await (adminSupabase
      .from('instructors'))
      .select('organization_id')
      .eq('id', instructorId)
      .single()

    if (instructorError || !instructor || instructor.organization_id !== organization.id) {
      return { error: await actionError('instructorAccessDenied') }
    }

    // Get courses assigned to this instructor
    const { data, error } = await (adminSupabase
      .from('course_instructors'))
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
      return { error: await actionError('fetchCoursesFailed') }
    }

    const courses = (data || [])
      .filter((ci) => ci.courses)
      .map((ci) => ci.courses)

    return { data: courses }
  } catch (error) {
    console.error('Unexpected error in getInstructorCourses:', error)
    return { error: await actionError('unexpected') }
  }
}

export async function getInstructorMonthlyStats(instructorId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  try {
    const adminSupabase = createAdminClient()

    // Verify instructor belongs to organization
    const { data: instructor, error: instructorError } = await (adminSupabase
      .from('instructors'))
      .select('organization_id')
      .eq('id', instructorId)
      .single()

    if (instructorError || !instructor || instructor.organization_id !== organization.id) {
      return { error: await actionError('instructorAccessDenied') }
    }

    // Get current month dates
    const now = new Date()
    const startOfMonth = toDateString(new Date(now.getFullYear(), now.getMonth(), 1))
    const endOfMonth = toDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0))

    // Get earnings for this month
    const { data: earningsData, error: earningsError } = await (adminSupabase
      .from('instructor_earnings'))
      .select('amount, earned_on')
      .eq('instructor_id', instructorId)
      .gte('earned_on', startOfMonth)
      .lte('earned_on', endOfMonth)

    if (earningsError) {
      console.error('Error fetching monthly earnings:', earningsError)
      return { error: await actionError('fetchEarningsFailed') }
    }

    // Pay is visible to owners/managers and to the instructor themself only
    const access = await getPayAccess()
    const canSeePay = !!access && canSeeInstructor(access, instructorId)
    const totalEarnings = canSeePay ? (earningsData || []).reduce((sum, e) => sum + Number(e.amount), 0) : 0
    const earningCount = canSeePay ? earningsData?.length || 0 : 0

    // Get sessions for this month where instructor is assigned
    const { data: instructorSessions, error: sessionsError } = await (adminSupabase
      .from('session_instructors'))
      .select('session_id, course_sessions(id, session_date)')
      .eq('instructor_id', instructorId)

    if (sessionsError) {
      console.error('Error fetching instructor sessions:', sessionsError)
      return { error: await actionError('fetchSessionsFailed') }
    }

    const monthSessions = (instructorSessions || []).filter((si) => {
      const sessionDate = si.course_sessions?.session_date
      return sessionDate && sessionDate >= startOfMonth && sessionDate <= endOfMonth
    })

    const sessionCount = monthSessions.length
    const sessionIds = monthSessions.map((si) => si.session_id)

    // Get attendance details for those sessions
    let attendanceDetails: {
      id: string
      student_id: string
      is_present: boolean
      notes: string | null
      created_at: string
      students: { first_name: string; last_name: string } | null
    }[] = []
    let attendanceCount = 0

    if (sessionIds.length > 0) {
      const { data: attendanceData, error: attendanceError } = await (adminSupabase
        .from('attendances'))
        .select('id, student_id, is_present, notes, created_at, students(first_name, last_name)')
        .in('session_id', sessionIds)

      if (attendanceError) {
        console.error('Error fetching monthly attendance:', attendanceError)
        return { error: await actionError('fetchAttendanceFailed') }
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
    return { error: await actionError('unexpected') }
  }
}

export async function getInstructorTotalEarnings(instructorId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  try {
    const adminSupabase = createAdminClient()

    // Verify instructor belongs to organization
    const { data: instructor, error: instructorError } = await (adminSupabase
      .from('instructors'))
      .select('organization_id')
      .eq('id', instructorId)
      .single()

    if (instructorError || !instructor || instructor.organization_id !== organization.id) {
      return { error: await actionError('instructorAccessDenied') }
    }

    const access = await getPayAccess()
    if (!access || !canSeeInstructor(access, instructorId)) return { error: await actionError('noPayPermission') }

    // Get all earnings for this instructor
    const { data: earningsData, error: earningsError } = await (adminSupabase
      .from('instructor_earnings'))
      .select('amount')
      .eq('instructor_id', instructorId)

    if (earningsError) {
      console.error('Error fetching total earnings:', earningsError)
      return { error: await actionError('fetchEarningsFailed') }
    }

    const totalEarnings = ((earningsData || [])).reduce((sum, e) => sum + Number(e.amount), 0)

    return {
      data: {
        totalEarnings,
        sessionCount: earningsData?.length || 0,
      }
    }
  } catch (error) {
    console.error('Unexpected error in getInstructorTotalEarnings:', error)
    return { error: await actionError('unexpected') }
  }
}

type HistoryCourse = { id: string; name: string; dance_types: { name: string } | null }
export type InstructorSessionAttendance = {
  id: string
  session_id: string
  student_id: string
  is_present: boolean
  notes: string | null
  created_at: string
  students: { id: string; first_name: string; last_name: string } | null
}
export type InstructorSessionHistory = {
  sessionId: string
  session_date: string
  course_name?: string
  dance_type?: string
  course_id: string
  instructors: { id: string; name: string }[]
  attendance: InstructorSessionAttendance[]
}

export async function getInstructorAttendanceHistory(
  instructorId: string
): Promise<{ data?: InstructorSessionHistory[]; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  try {
    const adminSupabase = createAdminClient()

    // Verify instructor belongs to organization
    const { data: instructor, error: instructorError } = await (adminSupabase
      .from('instructors'))
      .select('organization_id')
      .eq('id', instructorId)
      .single()

    if (instructorError || !instructor || instructor.organization_id !== organization.id) {
      return { error: await actionError('instructorAccessDenied') }
    }

    // Get all session IDs where instructor is assigned
    const { data: sessionInstructorLinks, error: linksError } = await (adminSupabase
      .from('session_instructors'))
      .select('session_id')
      .eq('instructor_id', instructorId)

    if (linksError) {
      console.error('Error fetching session links:', linksError)
      return { error: await actionError('fetchSessionsFailed') }
    }

    const sessionIds = (sessionInstructorLinks || [])
      .map((si) => si.session_id)
      .filter((id: string) => id)

    if (sessionIds.length === 0) {
      return { data: [] }
    }

    // Get session details
    const { data: sessionDetails, error: sessionDetailsError } = await (adminSupabase
      .from('course_sessions'))
      .select('id, session_date, course_id')
      .in('id', sessionIds)

    if (sessionDetailsError) {
      console.error('Error fetching session details:', sessionDetailsError)
      return { error: await actionError('fetchSessionFailed') }
    }

    // Get unique course IDs
    const courseIds = (sessionDetails || [])
      .filter((s) => s.course_id)
      .map((s) => s.course_id)
      .filter((id: string, idx: number, arr: string[]) => arr.indexOf(id) === idx)

    if (sessionIds.length === 0) {
      return { data: [] }
    }

    // Get course details
    const coursesMap = new Map<string, HistoryCourse>()
    if (courseIds.length > 0) {
      const { data: courses, error: coursesError } = await (adminSupabase
        .from('courses'))
        .select(`
          id,
          name,
          dance_types(name)
        `)
        .in('id', courseIds)

      if (!coursesError && courses) {
        courses.forEach((course) => {
          coursesMap.set(course.id, course)
        })
      }
    }

    // Get attendance details for all sessions
    const { data: attendanceData, error: attendanceError } = await (adminSupabase
      .from('attendances'))
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
      return { error: await actionError('fetchAttendanceFailed') }
    }

    // Get other instructors for each session
    const { data: allSessionInstructors, error: instructorsError } = await (adminSupabase
      .from('session_instructors'))
      .select(`
        session_id,
        instructor_id,
        instructors(id, first_name, last_name)
      `)
      .in('session_id', sessionIds)

    if (instructorsError) {
      console.error('Error fetching session instructors:', instructorsError)
      return { error: await actionError('fetchInstructorsFailed') }
    }

    // Combine data by session
    const sessionsMap = new Map<string, InstructorSessionHistory>()
    
    sessionDetails.forEach((session) => {
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
    allSessionInstructors?.forEach((si) => {
      const session = sessionsMap.get(si.session_id)
      if (session && si.instructors) {
        session.instructors.push({
          id: si.instructors.id,
          name: `${si.instructors.first_name} ${si.instructors.last_name}`,
        })
      }
    })

    // Add attendance to sessions
    attendanceData?.forEach((att) => {
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
    return { error: await actionError('unexpected') }
  }
}
