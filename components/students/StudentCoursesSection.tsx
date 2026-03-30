'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Calendar, Users, ArrowRight } from 'lucide-react'
import { getStudentEnrolledCourses } from '@/lib/actions/course-students.actions'

interface CourseWithStats {
  courseId: string
  courseName: string
  branchName?: string
  danceTypeName?: string
  dayOfWeek: number
  startTime: string
  endTime: string
  enrolledAt: string
  attendanceCount: number
  attendanceDates: (string | null)[]
  remainingCredits: number
  packageDanceTypeId?: string
}

interface StudentCoursesSectionProps {
  studentId: string
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function StudentCoursesSection({ studentId }: StudentCoursesSectionProps) {
  const t = useTranslations()
  const [activeCourses, setActiveCourses] = useState<CourseWithStats[]>([])
  const [completedCourses, setCompletedCourses] = useState<CourseWithStats[]>([])
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed'>('active')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true)
      setError(null)

      const result = await getStudentEnrolledCourses(studentId)

      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        setActiveCourses(result.data.active || [])
        setCompletedCourses(result.data.completed || [])
      }

      setLoading(false)
    }

    loadCourses()
  }, [studentId])

  const getAttendanceColor = (count: number) => {
    if (count >= 10) return 'bg-green-50 border-green-200'
    if (count >= 5) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  const getAttendanceTextColor = (count: number) => {
    if (count >= 10) return 'text-green-700'
    if (count >= 5) return 'text-yellow-700'
    return 'text-red-700'
  }

  const courses = selectedTab === 'active' ? activeCourses : completedCourses

  if (loading) {
    return (
      <Card className="border-[#E5E7EB] p-6">
        <div className="text-center text-gray-500">Loading courses...</div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 p-6">
        <p className="text-red-700">{error}</p>
      </Card>
    )
  }

  const totalCourses = activeCourses.length + completedCourses.length

  if (totalCourses === 0) {
    return (
      <Card className="border-[#E5E7EB] p-12 text-center">
        <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-gray-600 text-lg font-medium">No courses enrolled</p>
        <p className="text-sm text-gray-500 mt-1">Student hasn't enrolled in any courses yet</p>
      </Card>
    )
  }

  return (
    <Card className="border-[#E5E7EB] p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-[#111827] flex items-center gap-2">
            <BookOpen size={20} className="text-[#4F46E5]" />
            Enrolled Courses
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {t('students.enrolledCourses', { total: totalCourses, active: activeCourses.length, completed: completedCourses.length })}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[#E5E7EB]">
          <button
            onClick={() => setSelectedTab('active')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              selectedTab === 'active'
                ? 'border-[#4F46E5] text-[#4F46E5]'
                : 'border-transparent text-gray-600 hover:text-[#111827]'
            }`}
          >
            {t('students.activeCourses', { count: activeCourses.length })}
          </button>
          <button
            onClick={() => setSelectedTab('completed')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              selectedTab === 'completed'
                ? 'border-[#4F46E5] text-[#4F46E5]'
                : 'border-transparent text-gray-600 hover:text-[#111827]'
            }`}
          >
            {t('students.completedCourses', { count: completedCourses.length })}
          </button>
        </div>

        {/* Course List */}
        {courses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {selectedTab === 'active'
                ? 'No active courses with remaining credits'
                : 'No completed courses yet'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {courses.map((course) => (
              <Link key={course.courseId} href={`/dashboard/courses/${course.courseId}`}>
                <div
                  className={`block p-4 rounded-lg border-2 transition-all hover:shadow-md hover:border-[#4F46E5] cursor-pointer ${getAttendanceColor(course.attendanceCount)}`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#111827] text-base hover:text-[#4F46E5]">
                          {course.courseName}
                        </h4>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {course.danceTypeName && (
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                              {course.danceTypeName}
                            </Badge>
                          )}
                          {course.branchName && (
                            <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
                              {course.branchName}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="text-gray-400 mt-1" size={20} />
                    </div>

                    {/* Schedule */}
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar size={16} />
                      <span>
                        {DAYS[course.dayOfWeek]} • {course.startTime} - {course.endTime}
                      </span>
                    </div>

                    {/* Attendance & Credits */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Attendance</p>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-2xl font-bold ${getAttendanceTextColor(course.attendanceCount)}`}>
                            {course.attendanceCount}
                          </span>
                          <span className="text-sm text-gray-600">classes attended</span>
                        </div>
                        {course.attendanceDates.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {course.attendanceDates
                              .filter((d) => d)
                              .slice(0, 3)
                              .map((date) => date && new Date(date).toLocaleDateString('tr-TR'))
                              .join(', ')}{' '}
                            {course.attendanceDates.filter((d) => d).length > 3 && '...'}
                          </div>
                        )}
                      </div>

                      {selectedTab === 'active' && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Remaining Credits</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-[#4F46E5]">
                              {course.remainingCredits}
                            </span>
                            <span className="text-sm text-gray-600">credits</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Enrolled Date */}
                    <div className="text-xs text-gray-500 border-t border-current border-opacity-10 pt-2">
                      Enrolled {new Date(course.enrolledAt).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
