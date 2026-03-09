import { getCourses } from '@/lib/actions/courses.actions'
import { getSessionAttendances, getSessionStudents } from '@/lib/actions/attendance.actions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StudentAttendanceList } from '@/components/attendance/StudentAttendanceList'
import Link from 'next/link'
import { Calendar, Users, CheckCircle } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const sessionId = typeof params.session === 'string' ? params.session : undefined

  let selectedSession = null
  let attendances = []

  if (sessionId) {
    // Fetch attendances and available students for selected session
    const [attendancesResult, studentsResult] = await Promise.all([
      getSessionAttendances(sessionId),
      getSessionStudents(sessionId),
    ])
    attendances = attendancesResult.data || []
    const availableStudents = studentsResult.data || []

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

        <StudentAttendanceList
          sessionId={sessionId}
          availableStudents={availableStudents}
          recordedAttendances={attendances}
        />
      </div>
    )
  } else {
    // Show upcoming courses with their sessions
    const today = new Date()
    const in4Weeks = new Date(today.getTime() + 4 * 7 * 24 * 60 * 60 * 1000)

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
              <Card key={course.id} className="border-[#E5E7EB] p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-[#111827]">{course.name}</h3>
                    <p className="text-sm text-gray-600">{course.branches?.name} • {course.dance_types?.name}</p>
                  </div>
                  <Link href={`/dashboard/courses/${course.id}`}>
                    <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
                      View Sessions
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
