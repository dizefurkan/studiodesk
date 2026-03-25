import { getInstructor } from '@/lib/actions/instructors.actions'
import { getInstructorCourses, getInstructorMonthlyStats, getInstructorTotalEarnings } from '@/lib/actions/instructor-detail.actions'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Edit2, Mail, Phone, BookOpen, DollarSign, Calendar } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface InstructorDetailPageProps {
  params: {
    id: string
  }
}

export default async function InstructorDetailPage({ params }: InstructorDetailPageProps) {
  const { id } = await params
  const result = await getInstructor(id)

  if (result.error) {
    notFound()
  }

  const instructor = result.data!

  // Fetch instructor stats in parallel
  const [coursesResult, statsResult, totalEarningsResult] = await Promise.all([
    getInstructorCourses(id),
    getInstructorMonthlyStats(id),
    getInstructorTotalEarnings(id),
  ])

  const courses = coursesResult.data || []
  const stats = statsResult.data
  const totalStats = totalEarningsResult.data

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white p-8">
      <div className="max-w-6xl">
        <Link href="/dashboard/instructors" className="text-[#4F46E5] hover:underline mb-6 inline-block">
          ← Back to Instructors
        </Link>

        <Card className="border-[#E5E7EB]">
          <div className="p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-[#111827] mb-2">
                  {instructor.first_name} {instructor.last_name}
                </h1>
                <p className="text-gray-600">Instructor Profile</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/instructors/${instructor.id}/edit`}>
                  <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2">
                    <Edit2 size={18} />
                    Edit
                  </Button>
                </Link>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4 border-t border-[#E5E7EB] pt-6 pb-8 mb-8">
              <div className="flex items-center gap-4">
                <Mail className="text-[#4F46E5]" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-lg font-medium text-[#111827]">{instructor.email}</p>
                </div>
              </div>

              {instructor.phone && (
                <div className="flex items-center gap-4">
                  <Phone className="text-[#4F46E5]" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-lg font-medium text-[#111827]">{instructor.phone}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Total Earnings Card */}
              <Card className="border-[#E5E7EB] p-6 bg-linear-to-br from-green-50 to-green-100">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                    <p className="text-3xl font-bold text-green-700">
                      ₺{totalStats?.totalEarnings?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      {totalStats?.sessionCount || 0} class{totalStats?.sessionCount !== 1 ? 'es' : ''}
                    </p>
                  </div>
                  <DollarSign className="text-green-600" size={28} />
                </div>
              </Card>

              {/* This Month Earnings Card */}
              <Card className="border-[#E5E7EB] p-6 bg-linear-to-br from-blue-50 to-blue-100">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">This Month Earnings</p>
                    <p className="text-3xl font-bold text-blue-700">
                      ₺{stats?.totalEarnings?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      {stats?.earningCount || 0} session{stats?.earningCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Calendar className="text-blue-600" size={28} />
                </div>
              </Card>

              {/* Attendance Count Card */}
              <Card className="border-[#E5E7EB] p-6 bg-linear-to-br from-purple-50 to-purple-100">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">This Month Sessions</p>
                    <p className="text-3xl font-bold text-purple-700">
                      {stats?.sessionCount || 0}
                    </p>
                    <p className="text-xs text-gray-600 mt-2">{stats?.attendanceCount || 0} students marked</p>
                  </div>
                  <BookOpen className="text-purple-600" size={28} />
                </div>
              </Card>
            </div>

            {/* Assigned Courses Section */}
            {courses.length > 0 && (
              <div className="border-t border-[#E5E7EB] pt-8">
                <h2 className="text-2xl font-bold text-[#111827] mb-4">Assigned Courses ({courses.length})</h2>
                <div className="space-y-3">
                  {courses.map((course: any) => (
                    <Card key={course.id} className="border-[#E5E7EB] p-4 hover:border-[#4F46E5] transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-[#111827] text-lg">{course.name}</h3>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">📚 {course.dance_types?.name}</span>
                            <span className="flex items-center gap-1">🏢 {course.branches?.name}</span>
                            <span className="flex items-center gap-1">⏰ {DAYS[course.day_of_week]} {course.start_time} - {course.end_time}</span>
                          </div>
                        </div>
                        <Link href={`/dashboard/courses/${course.id}`}>
                          <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm ml-4 shrink-0">
                            View
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {courses.length === 0 && (
              <div className="border-t border-[#E5E7EB] pt-8 text-center text-gray-500">
                <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">Not assigned to any courses yet</p>
              </div>
            )}

            {/* Monthly Attendance Details Table */}
            {stats?.attendanceDetails && stats.attendanceDetails.length > 0 && (
              <div className="border-t border-[#E5E7EB] pt-8">
                <h2 className="text-2xl font-bold text-[#111827] mb-4">This Month Attendance Details</h2>
                <Card className="border-[#E5E7EB] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-[#E5E7EB]">
                        <tr>
                          <th className="px-4 py-3 text-left text-gray-700 font-medium">Student Name</th>
                          <th className="px-4 py-3 text-left text-gray-700 font-medium">Status</th>
                          <th className="px-4 py-3 text-left text-gray-700 font-medium">Date</th>
                          <th className="px-4 py-3 text-left text-gray-700 font-medium">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.attendanceDetails.map((attendance: any, idx: number) => (
                          <tr key={idx} className="border-b border-[#E5E7EB] hover:bg-gray-50">
                            <td className="px-4 py-3 text-[#111827] font-medium">
                              {attendance.students?.first_name} {attendance.students?.last_name}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                attendance.is_present 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {attendance.is_present ? '✓ Present' : '✗ Absent'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {new Date(attendance.created_at).toLocaleDateString('tr-TR', { 
                                year: 'numeric', 
                                month: '2-digit', 
                                day: '2-digit' 
                              })}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {attendance.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
