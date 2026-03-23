import { getCourse, getCourseSessions } from '@/lib/actions/courses.actions'
import { getCourseAttendanceHistory } from '@/lib/actions/course-attendance.actions'
import { CourseStudentsContainer } from '@/components/courses/CourseStudentsContainer'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Clock, Users, Edit2, BookOpen, CheckCircle } from 'lucide-react'

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

  // Get attendance history
  const historyResult = await getCourseAttendanceHistory(course.id)
  const attendanceHistory = historyResult.data || []

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
              <div className="flex gap-2">
                <Link href={`/dashboard/attendance?course=${course.id}`}>
                  <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
                    <CheckCircle size={18} />
                    Mark Attendance
                  </Button>
                </Link>
                <Link href={`/dashboard/courses/${course.id}/edit`}>
                  <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2">
                    <Edit2 size={18} />
                    Edit
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 border-t border-[#E5E7EB] pt-8">
              <div>
                <p className="text-sm text-gray-600 mb-2">Schedule</p>
                <div className="flex items-center gap-2 text-lg font-medium text-[#111827]">
                  <Clock size={20} className="text-[#4F46E5]" />
                  {DAYS[course.day_of_week]} {course.start_time} - {course.end_time}
                </div>
              </div>
            </div>

            {course.course_instructors && course.course_instructors.length > 0 && (
              <div className="mt-8 pt-8 border-t border-[#E5E7EB]">
                <p className="text-sm text-gray-600 mb-4">Assigned Instructors</p>
                <div className="flex gap-2 flex-wrap">
                  {course.course_instructors.map((ci: any) => {
                    const instructor = ci.instructors
                    const instructorName = instructor 
                      ? `${instructor.first_name} ${instructor.last_name}`
                      : ci.instructor_id
                    
                    return (
                      <a
                        key={ci.instructor_id}
                        href={`/dashboard/instructors/${ci.instructor_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#4F46E5] text-white px-4 py-2 rounded-full text-sm hover:bg-[#4338CA] transition-colors cursor-pointer font-medium"
                      >
                        {instructorName}
                      </a>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Attendance History */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-[#111827] mb-4">Attendance History</h2>

        {attendanceHistory.length === 0 ? (
            <Card className="border-[#E5E7EB] p-12 text-center">
              <div className="text-gray-500">
                <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">No attendance records yet</p>
                <p className="text-sm mt-1">Start marking attendance to build history</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {attendanceHistory.map((record: any) => (
                <details key={record.id} className="border border-[#E5E7EB] rounded-lg hover:border-[#4F46E5] transition-colors group">
                  <summary className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium text-[#111827]">{record.session_date}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {record.attendance_count} student{record.attendance_count !== 1 ? 's' : ''} attended
                        {record.attendances?.length > 0 && record.attendances[0]?.studios?.name && 
                          ` • Studio: ${record.attendances[0].studios.name}`}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full ml-4">
                      {record.attendance_count}/{record.attendances?.length || 0}
                    </span>
                  </summary>
                  <div className="px-4 pb-4 border-t border-[#E5E7EB] pt-4 bg-gray-50">
                    <p className="text-sm font-semibold text-[#111827] mb-3">Attendees:</p>
                    <div className="space-y-2">
                      {record.attendances && record.attendances.length > 0 ? (
                        record.attendances.map((att: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <span className={`font-bold ${att.is_present ? 'text-green-600' : 'text-red-600'}`}>
                              {att.is_present ? '✓' : '✗'}
                            </span>
                            <Link href={`/dashboard/students/${att.students.id}`} className="text-[#4F46E5] hover:underline font-medium">
                              {att.students.first_name} {att.students.last_name}
                            </Link>
                            {att.notes && <span className="text-gray-600">({att.notes})</span>}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No attendance records</p>
                      )}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>

        {/* Students */}
        <CourseStudentsContainer courseId={course.id} danceTypeId={course.dance_type_id} />
      </div>
    </div>
  )
}
