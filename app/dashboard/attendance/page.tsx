import { getCourseSessions } from '@/lib/actions/courses.actions'
import { getSessionAttendances } from '@/lib/actions/attendance.actions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Calendar, Users, CheckCircle } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const sessionId = typeof searchParams.session === 'string' ? searchParams.session : undefined

  let selectedSession = null
  let attendances = []

  if (sessionId) {
    // Fetch attendances for selected session
    const result = await getSessionAttendances(sessionId)
    attendances = result.data || []
  } else {
    // Show upcoming sessions
    const today = new Date()
    const in4Weeks = new Date(today.getTime() + 4 * 7 * 24 * 60 * 60 * 1000)

    const sessionsResult = await getCourseSessions(
      '',
      today.toISOString().split('T')[0],
      in4Weeks.toISOString().split('T')[0],
    )

    const sessions = sessionsResult.data || []

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">Attendance</h1>
          <p className="text-gray-600 mt-1">Mark student attendance and manage class sessions</p>
        </div>

        {sessions.length === 0 ? (
          <Card className="border-[#E5E7EB] p-12 text-center">
            <div className="text-gray-500">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">No upcoming sessions</p>
              <p className="text-sm mt-1">Create courses and schedule sessions to start tracking attendance</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {sessions.map((session) => (
              <Card key={session.id} className="border-[#E5E7EB] p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#111827]">{session.session_date}</h3>
                    <p className="text-sm text-gray-600 mt-1">{DAYS[new Date(session.session_date).getDay()]}</p>
                  </div>
                  <Link href={`/dashboard/attendance?session=${session.id}`}>
                    <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
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

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/attendance" className="text-[#4F46E5] hover:underline mb-4 inline-block">
          ← Back to Sessions
        </Link>
        <h1 className="text-3xl font-bold text-[#111827]">Mark Attendance</h1>
        <p className="text-gray-600 mt-1">Record attendance for this session</p>
      </div>

      <Card className="border-[#E5E7EB] p-6 bg-blue-50">
        <div className="flex items-center gap-3">
          <Calendar className="text-[#4F46E5]" size={24} />
          <div>
            <p className="font-medium text-[#111827]">Session: {sessionId}</p>
            <p className="text-sm text-gray-600">{attendances.length} student(s) marked</p>
          </div>
        </div>
      </Card>

      {attendances.length === 0 ? (
        <Card className="border-[#E5E7EB] p-12 text-center">
          <div className="text-gray-500">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No attendance records yet</p>
            <p className="text-sm mt-1">Mark students as present to deduct credits from their packages</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {attendances.map((record) => (
            <Card key={record.id} className="border-[#E5E7EB] p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-600" size={20} />
                  <div>
                    <p className="font-medium text-[#111827]">
                      {record.students?.first_name} {record.students?.last_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Credits remaining: {record.student_packages?.remaining_credits}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (confirm('Remove this attendance record?')) {
                      // Remove attendance
                    }
                  }}
                >
                  Remove
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
