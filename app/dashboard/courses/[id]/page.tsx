import { getCourse, getCourseSessions } from '@/lib/actions/courses.actions'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Clock, Users, Edit2, BookOpen } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface CourseDetailPageProps {
  params: {
    id: string
  }
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { id } = await params
  const result = await getCourse(id)

  if (result.error) {
    notFound()
  }

  const course = result.data!

  // Get next 12 weeks of sessions
  const today = new Date()
  const in12Weeks = new Date(today.getTime() + 12 * 7 * 24 * 60 * 60 * 1000)
  const sessionsResult = await getCourseSessions(
    course.id,
    today.toISOString().split('T')[0],
    in12Weeks.toISOString().split('T')[0],
  )

  const sessions = sessionsResult.data || []

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white p-8">
      <div className="max-w-4xl">
        <Link href="/dashboard/courses" className="text-[#4F46E5] hover:underline mb-6 inline-block">
          ← Back to Courses
        </Link>

        <Card className="border-[#E5E7EB]">
          <div className="p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-[#111827] mb-2">{course.name}</h1>
                <p className="text-gray-600">
                  {course.branches?.name} • {course.dance_types?.name}
                </p>
              </div>
              <Link href={`/dashboard/courses/${course.id}/edit`}>
                <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2">
                  <Edit2 size={18} />
                  Edit
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-6 border-t border-[#E5E7EB] pt-8">
              <div>
                <p className="text-sm text-gray-600 mb-2">Schedule</p>
                <div className="flex items-center gap-2 text-lg font-medium text-[#111827]">
                  <Clock size={20} className="text-[#4F46E5]" />
                  {DAYS[course.day_of_week]} {course.start_time} - {course.end_time}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Class Capacity</p>
                <div className="flex items-center gap-2 text-lg font-medium text-[#111827]">
                  <Users size={20} className="text-[#4F46E5]" />
                  {course.capacity} students max
                </div>
              </div>
            </div>

            {course.course_instructors && course.course_instructors.length > 0 && (
              <div className="mt-8 pt-8 border-t border-[#E5E7EB]">
                <p className="text-sm text-gray-600 mb-4">Assigned Instructors</p>
                <div className="flex gap-2 flex-wrap">
                  {course.course_instructors.map((ci: any) => (
                    <div
                      key={ci.instructor_id}
                      className="bg-[#4F46E5] bg-opacity-10 text-[#4F46E5] px-3 py-1 rounded-full text-sm"
                    >
                      {ci.instructor_id}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Sessions */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-[#111827]">Upcoming Sessions (12 weeks)</h2>
            <Link href={`/dashboard/courses/${course.id}/sessions`}>
              <Button variant="outline" className="border-[#E5E7EB]">
                Manage Sessions
              </Button>
            </Link>
          </div>

          {sessions.length === 0 ? (
            <Card className="border-[#E5E7EB] p-12 text-center">
              <div className="text-gray-500">
                <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">No sessions scheduled</p>
                <p className="text-sm mt-1">Sessions will be auto-generated on the schedule day</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {sessions.map((session) => (
                <Card key={session.id} className="border-[#E5E7EB] p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-[#111827]">{session.session_date}</p>
                      <p className="text-sm text-gray-600">{DAYS[new Date(session.session_date).getDay()]}</p>
                    </div>
                    <Link href={`/dashboard/attendance?session=${session.id}`}>
                      <Button size="sm" className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
                        Attendance
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
