import { getCourses, getCourse } from '@/lib/actions/courses.actions'
import { getSessionAttendances, getSessionStudents } from '@/lib/actions/attendance.actions'
import { getCourseAttendanceHistory } from '@/lib/actions/course-attendance.actions'
import { getStudios } from '@/lib/actions/studios.actions'
import { getOrganization } from '@/lib/auth/getOrganization'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StudentAttendanceList } from '@/components/attendance/StudentAttendanceList'
import { AttendancePageWrapper } from '@/components/attendance/AttendancePageWrapper'
import { formatDateDisplay } from '@/lib/utils/formatting'
import Link from 'next/link'
import { Calendar, Users, CheckCircle } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { getTranslations } from 'next-intl/server'

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const t = await getTranslations()
  const params = await searchParams
  const sessionId = typeof params.session === 'string' ? params.session : undefined
  const courseId = typeof params.course === 'string' ? params.course : undefined
  const newSession = params.newSession === 'true'

  let selectedSession = null
  let attendances = []

  // MODE 1: Session-based attendance (legacy)
  if (sessionId) {
    // Fetch attendances, students, and studios for selected session
    const [attendancesResult, studentsResult, sessionDataResult] = await Promise.all([
      getSessionAttendances(sessionId),
      getSessionStudents(sessionId),
      (async () => {
        const { createServerSupabaseClient } = await import('@/lib/supabase/server')
        const supabase = await createServerSupabaseClient()
        const res = await (supabase.from('course_sessions') as any)
          .select('course_id')
          .eq('id', sessionId)
          .single()
        return res.data
      })(),
    ])
    attendances = attendancesResult.data || []
    const availableStudents = studentsResult.data || []
    const courseId = sessionDataResult?.course_id
    let studios: any[] = []
    let courseInstructors: any[] = []
    let allInstructors: any[] = []
    let instructorRates: any[] = []
    let danceTypeId = ''
    let attendanceHistory: any[] = []

    
    if (courseId) {
      const courseResult = await getCourse(courseId)
      const branchId = courseResult.data?.branch_id
      danceTypeId = courseResult.data?.dance_type_id || ''
      if (branchId) {
        const studiosResult = await getStudios(branchId)
        studios = studiosResult.data || []
      }

      // Get instructors for this course
      const { createServerSupabaseClient: createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data: courseInstructorsData } = await supabase
        .from('course_instructors')
        .select(`
          instructor_id,
          instructors(
            id,
            first_name,
            last_name
          )
        `)
        .eq('course_id', courseId)

      courseInstructors = (courseInstructorsData || [])
        .filter((ci: any) => ci.instructors)
        .map((ci: any) => ({
          id: ci.instructors.id,
          first_name: ci.instructors.first_name,
          last_name: ci.instructors.last_name,
        }))

      // Fetch all instructors for the organization (not just branch)
      const { createServerSupabaseClient: createSupabaseClient } = await import('@/lib/supabase/server')
      const supabaseClient = await createSupabaseClient()
      const organization = await getOrganization()
      
      const { data: orgInstructorsData } = await supabaseClient
        .from('instructors')
        .select('id, first_name, last_name')
        .eq('organization_id', organization?.id || '')

      const allInstructors = (orgInstructorsData || [])
        .map((instructor: any) => ({
          id: instructor.id,
          first_name: instructor.first_name,
          last_name: instructor.last_name,
        }))

      const { data: instructorRatesData } = await supabaseClient
        .from('instructor_rates')
        .select('instructor_id, dance_type_id, ratio_per_class')

      // Fetch attendance history for this course
      const attendanceHistoryResult = await getCourseAttendanceHistory(courseId)
      attendanceHistory = attendanceHistoryResult.data || []
    }

    return (
      <div className="space-y-6">
        <div>
          <Link href="/dashboard/attendance" className="text-primary hover:underline mb-4 inline-block">
            ← {t('attendance.backToSessions')}
          </Link>
          <h1 className="text-3xl font-bold text-foreground">{t('attendance.markAttendance')}</h1>
          <p className="text-muted-foreground mt-1">{t('attendance.recordDescription')}</p>
        </div>

        <Card className="border-border p-6 bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="text-primary" size={24} />
              <div>
                <p className="font-medium text-foreground">{t('attendance.session')}: {sessionId}</p>
                <p className="text-sm text-muted-foreground">{attendances.length} {t('attendance.marked')} • {availableStudents.length} {t('attendance.available')}</p>
              </div>
            </div>
          </div>
        </Card>

        {studios.length > 0 && (
          <Card className="border-border p-4">
            <p className="text-sm text-muted-foreground mb-2">{t('attendance.availableStudios')}: {studios.map((s: any) => s.name).join(', ')}</p>
          </Card>
        )}

        <StudentAttendanceList
          sessionId={sessionId}
          courseId={courseId}
          danceTypeId={danceTypeId}
          availableStudents={availableStudents}
          recordedAttendances={attendances}
          attendanceHistory={attendanceHistory}
          studios={studios}
          instructors={courseInstructors}
          allInstructors={allInstructors}
          instructorRates={instructorRates}
        />
      </div>
    )
  }

  // MODE 2: Course-based attendance (new - on-demand sessions)
  if (courseId) {
    const courseResult = await getCourse(courseId)
    if (courseResult.error || !courseResult.data) {
      return (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-foreground">Error</h1>
          <p className="text-muted-foreground">Course not found</p>
        </div>
      )
    }

    const course = courseResult.data
    const branchId = course.branch_id

    // Get enrolled students and their packages
    const { createServerSupabaseClient } = await import('@/lib/supabase/server')
    const supabase = await createServerSupabaseClient()

    const { data: courseStudentsData } = await supabase
      .from('course_students')
      .select(`
        student_id,
        students(
          id,
          first_name,
          last_name,
          student_packages(
            id,
            remaining_credits,
            packages(id, dance_type_id)
          )
        )
      `)
      .eq('course_id', courseId)

    // Get studios for branch
    const studiosResult = await getStudios(branchId)
    const studios = studiosResult.data || []

    // Get instructors for this course
    const { data: courseInstructorsData } = await supabase
      .from('course_instructors')
      .select(`
        instructor_id,
        instructors(
          id,
          first_name,
          last_name
        )
      `)
      .eq('course_id', courseId)

    const courseInstructors = (courseInstructorsData || [])
      .filter((ci: any) => ci.instructors)
      .map((ci: any) => ({
        id: ci.instructors.id,
        first_name: ci.instructors.first_name,
        last_name: ci.instructors.last_name,
      }))

    // Fetch all instructors for the organization (not just branch)
    const organization = await getOrganization()
    const { data: orgInstructorsData } = await supabase
      .from('instructors')
      .select('id, first_name, last_name')
      .eq('organization_id', organization?.id || '')

    const allInstructors = (orgInstructorsData || [])
      .map((instructor: any) => ({
        id: instructor.id,
        first_name: instructor.first_name,
        last_name: instructor.last_name,
      }))

    const { data: instructorRatesData } = await supabase
      .from('instructor_rates')
      .select('instructor_id, dance_type_id, ratio_per_class')

    // Transform students data and filter packages by dance_type_id
    const availableStudents = (courseStudentsData || [])
      .filter((cs: any) => cs.students)
      .map((cs: any) => ({
        id: cs.students.id,
        first_name: cs.students.first_name,
        last_name: cs.students.last_name,
        student_packages: (cs.students.student_packages || [])
          .filter((pkg: any) => pkg.packages?.dance_type_id === course.dance_type_id)
          .map((pkg: any) => ({
            id: pkg.id,
            remaining_credits: pkg.remaining_credits,
          })),
      }))

    // Check if a session exists for today and fetch attendances if it does
    const today = new Date().toISOString().split('T')[0]
    const todayDate = new Date()
    const todayDayOfWeek = todayDate.getDay()
    
    // Check if today matches the course's scheduled day
    const isCourseScheduledToday = course.day_of_week === todayDayOfWeek
    
    const { data: existingSessionData } = await (supabase
      .from('course_sessions') as any)
      .select('id')
      .eq('course_id', courseId)
      .eq('session_date', today)
      .single()

    let existingAttendances: any[] = []
    // Use fresh session ID if starting new session, otherwise use existing or create new
    const sessionIdToUse = newSession ? uuidv4() : (existingSessionData?.id || uuidv4())

    // Only load existing attendance if NOT starting a new session
    if (existingSessionData?.id && !newSession) {
      const { data: attendancesData } = await supabase
        .from('attendances')
        .select('*, students(first_name, last_name), student_packages(remaining_credits)')
        .eq('session_id', existingSessionData.id)
      
      existingAttendances = attendancesData || []
    }

    // Create on-demand session ID (will be created in DB when attendance is saved if new)
    const tempSessionId = sessionIdToUse

    // Fetch attendance history for this course
    const attendanceHistoryResult = await getCourseAttendanceHistory(courseId)
    const attendanceHistory = attendanceHistoryResult.data || []

    return (
      <div className="space-y-6">
        <AttendancePageWrapper
          sessionId={tempSessionId}
          courseId={courseId}
          courseName={course.name}
          danceTypeId={course.dance_type_id}
          availableStudents={availableStudents}
          recordedAttendances={existingAttendances}
          attendanceHistory={attendanceHistory}
          studios={studios}
          instructors={courseInstructors}
          allInstructors={allInstructors}
          instructorRates={instructorRatesData || []}
          totalEnrolled={availableStudents.length}
          presentCount={existingAttendances.filter((a: any) => a.is_present).length}
          absentCount={existingAttendances.filter((a: any) => !a.is_present).length}
        />
      </div>
    )
  }

  // MODE 3: Default - Show courses list
  {
    const coursesResult = await getCourses()
    const courses = coursesResult.data || []

    // Fetch attendance count for each course
    const coursesWithAttendance = await Promise.all(
      courses.map(async (course: any) => {
        const historyResult = await getCourseAttendanceHistory(course.id)
        const attendanceRecords = historyResult.data || []
        const totalAttendance = attendanceRecords.length // Number of times attendance was taken
        const mostRecentDate = attendanceRecords.length > 0 ? attendanceRecords[0].session_date : null
        return {
          ...course,
          totalAttendance,
          mostRecentDate,
        }
      })
    )

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('attendance.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('attendance.pageDescription')}</p>
        </div>

        {courses.length === 0 ? (
          <Card className="border-border p-12 text-center">
            <div className="text-muted-foreground">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">{t('attendance.noCoursesFound')}</p>
              <p className="text-sm mt-1">{t('attendance.noCoursesMessage')}</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {coursesWithAttendance.map((course: any) => (
              <Card key={course.id} className="border-border p-4 hover:border-primary transition-colors">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <Link href={`/dashboard/courses/${course.id}`} className="flex-1">
                    <div className="cursor-pointer">
                      <h3 className="font-semibold text-primary hover:underline">{course.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {course.branches?.name} • {course.dance_types?.name}
                      </p>
                      {course.totalAttendance > 0 && (
                        <div className="mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          {course.mostRecentDate && (
                            <span>{formatDateDisplay(course.mostRecentDate, t)} - </span>
                          )}
                          {t('attendance.totalAttendance')} {course.totalAttendance}
                        </div>
                      )}
                    </div>
                  </Link>
                  <Link href={`/dashboard/attendance?course=${course.id}`} className="w-full md:w-auto">
                    <Button className="gap-2 w-full md:w-auto">
                      <CheckCircle size={16} />
                      {t('attendance.markAttendance')}
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }
}
