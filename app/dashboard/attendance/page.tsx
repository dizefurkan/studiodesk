import { getCourses, getCourse } from '@/lib/actions/courses.actions'
import { getSessionAttendances, getSessionStudents } from '@/lib/actions/attendance.actions'
import { getStudios } from '@/lib/actions/studios.actions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StudentAttendanceList } from '@/components/attendance/StudentAttendanceList'
import Link from 'next/link'
import { Calendar, Users, CheckCircle } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
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

    if (courseId) {
      const courseResult = await getCourse(courseId)
      const branchId = courseResult.data?.branch_id
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
    }

    return (
      <div className="space-y-6">
        <div>
          <Link href="/dashboard/attendance" className="text-[#4F46E5] hover:underline mb-4 inline-block">
            ← Back to Sessions
          </Link>
          <h1 className="text-3xl font-bold text-[#111827]">Mark Attendance</h1>
          <p className="text-gray-600 mt-1">Record attendance for this session and deduct credits</p>
        </div>

        <Card className="border-[#E5E7EB] p-6 bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="text-[#4F46E5]" size={24} />
              <div>
                <p className="font-medium text-[#111827]">Session: {sessionId}</p>
                <p className="text-sm text-gray-600">{attendances.length} marked • {availableStudents.length} available</p>
              </div>
            </div>
          </div>
        </Card>

        {studios.length > 0 && (
          <Card className="border-[#E5E7EB] p-4">
            <p className="text-sm text-gray-600 mb-2">Available Studios: {studios.map((s: any) => s.name).join(', ')}</p>
          </Card>
        )}

        <StudentAttendanceList
          sessionId={sessionId}
          courseId={courseId}
          availableStudents={availableStudents}
          recordedAttendances={attendances}
          studios={studios}
          instructors={courseInstructors}
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
          <h1 className="text-3xl font-bold text-[#111827]">Error</h1>
          <p className="text-gray-600">Course not found</p>
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
            packages(id)
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

    // Transform students data
    const availableStudents = (courseStudentsData || [])
      .filter((cs: any) => cs.students)
      .map((cs: any) => ({
        id: cs.students.id,
        first_name: cs.students.first_name,
        last_name: cs.students.last_name,
        student_packages: cs.students.student_packages || [],
      }))

    // Check if a session exists for today and fetch attendances if it does
    const today = new Date().toISOString().split('T')[0]
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

    return (
      <div className="space-y-6">
        <div>
          <Link href="/dashboard/attendance" className="text-[#4F46E5] hover:underline mb-4 inline-block">
            ← Back
          </Link>
          <h1 className="text-3xl font-bold text-[#111827]">Mark Attendance</h1>
          <p className="text-gray-600 mt-1">{course.name} - Record attendance for today</p>
        </div>

        <Card className="border-[#E5E7EB] p-6 bg-linear-to-r from-green-50 to-emerald-50">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Users className="text-green-600" size={28} />
              <div>
                <p className="font-semibold text-lg text-[#111827]">{course.name}</p>
                <p className="text-xs text-gray-500">Record attendance for today</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-500 text-white rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">{availableStudents.length}</p>
                <p className="text-xs font-medium mt-1">Total Enrolled</p>
              </div>
              <div className="bg-green-500 text-white rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">
                  {existingAttendances.filter((a: any) => a.is_present).length}
                </p>
                <p className="text-xs font-medium mt-1">✓ Present</p>
              </div>
              <div className="bg-red-500 text-white rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">
                  {existingAttendances.filter((a: any) => !a.is_present).length}
                </p>
                <p className="text-xs font-medium mt-1">✗ Absent</p>
              </div>
            </div>

            {courseInstructors.length > 0 && (
              <div className="border-t border-green-200 pt-4">
                <p className="text-sm font-medium text-[#111827] mb-2">Instructors:</p>
                <div className="flex flex-wrap gap-2">
                  {courseInstructors.map((instructor) => (
                    <Link
                      key={instructor.id}
                      href={`/dashboard/instructors/${instructor.id}`}
                      className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium hover:bg-green-700 transition-colors cursor-pointer"
                    >
                      {instructor.first_name} {instructor.last_name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {existingAttendances.length > 0 && (
              <div className="border-t border-green-200 pt-4">
                <p className="text-sm font-medium text-[#111827] mb-3">✓ Attendance already recorded for today</p>
                <a
                  href={`?course=${courseId}&newSession=true`}
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Start New Session
                </a>
              </div>
            )}
          </div>
        </Card>

        <StudentAttendanceList
          sessionId={tempSessionId}
          courseId={courseId}
          availableStudents={availableStudents}
          recordedAttendances={existingAttendances}
          studios={studios}
          instructors={courseInstructors}
        />
      </div>
    )
  }

  // MODE 3: Default - Show courses list
  {
    const coursesResult = await getCourses()
    const courses = coursesResult.data || []

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">Attendance</h1>
          <p className="text-gray-600 mt-1">Mark student attendance and manage class sessions</p>
        </div>

        {courses.length === 0 ? (
          <Card className="border-[#E5E7EB] p-12 text-center">
            <div className="text-gray-500">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">No courses found</p>
              <p className="text-sm mt-1">Create courses and schedule sessions to start tracking attendance</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {courses.map((course: any) => (
              <Card key={course.id} className="border-[#E5E7EB] p-4 hover:border-[#4F46E5] transition-colors">
                <div className="flex justify-between items-center">
                  <Link href={`/dashboard/courses/${course.id}`} className="flex-1">
                    <div className="cursor-pointer">
                      <h3 className="font-semibold text-[#4F46E5] hover:underline">{course.name}</h3>
                      <p className="text-sm text-gray-600">{course.branches?.name} • {course.dance_types?.name}</p>
                    </div>
                  </Link>
                  <Link href={`/dashboard/attendance?course=${course.id}`}>
                    <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2">
                      <CheckCircle size={16} />
                      Mark Attendance
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
