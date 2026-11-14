'use client'

import { Link } from '@/i18n/navigation'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Calendar, ArrowRight } from 'lucide-react'
import { getStudentEnrolledCourses } from '@/lib/actions/course-students.actions'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLocaleNames } from '@/hooks/useLocaleNames'
import { parseDateOnly } from '@/lib/i18n/dates'
import { formatTime } from '@/lib/utils/formatTime'

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


export function StudentCoursesSection({ studentId }: StudentCoursesSectionProps) {
  const tx = useTranslations('studentCourses')
  const { DAYS, locale } = useLocaleNames()
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
      <Card className="border-border p-6">
        <div className="text-center text-muted-foreground">{tx('loading')}</div>
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
      <Card className="border-border p-12 text-center">
        <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground text-lg font-medium">{tx('emptyTitle')}</p>
        <p className="text-sm text-muted-foreground mt-1">{tx('emptyDescription')}</p>
      </Card>
    )
  }

  return (
    <Card className="border-border p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BookOpen size={20} className="text-primary" />
            {tx('title')}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t('students.enrolledCourses', { total: totalCourses, active: activeCourses.length, completed: completedCourses.length })}
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as typeof selectedTab)}>
          <TabsList>
            <TabsTrigger value="active">{t('students.activeCourses', { count: activeCourses.length })}</TabsTrigger>
            <TabsTrigger value="completed">
              {t('students.completedCourses', { count: completedCourses.length })}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Course List */}
        {courses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {selectedTab === 'active'
                ? tx('noActive')
                : tx('noCompleted')}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {courses.map((course) => (
              <Link key={course.courseId} href={`/dashboard/courses/${course.courseId}`}>
                <div
                  className={`block p-4 rounded-lg border-2 transition-all hover:shadow-md hover:border-primary cursor-pointer ${getAttendanceColor(course.attendanceCount)}`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-base hover:text-primary">
                          {course.courseName}
                        </h4>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {course.danceTypeName && (
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                              {course.danceTypeName}
                            </Badge>
                          )}
                          {course.branchName && (
                            <Badge className="bg-muted text-foreground/80 hover:bg-muted">
                              {course.branchName}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="text-muted-foreground/70 mt-1" size={20} />
                    </div>

                    {/* Schedule */}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar size={16} />
                      <span>
                        {DAYS[course.dayOfWeek]} • {formatTime(course.startTime)} - {formatTime(course.endTime)}
                      </span>
                    </div>

                    {/* Attendance & Credits */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{tx('attendance')}</p>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-2xl font-bold ${getAttendanceTextColor(course.attendanceCount)}`}>
                            {course.attendanceCount}
                          </span>
                          <span className="text-sm text-muted-foreground">{tx('classesAttended')}</span>
                        </div>
                        {course.attendanceDates.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {course.attendanceDates
                              .filter((d) => d)
                              .slice(0, 3)
                              .map((date) => date && parseDateOnly(date).toLocaleDateString(locale))
                              .join(', ')}{' '}
                            {course.attendanceDates.filter((d) => d).length > 3 && '...'}
                          </div>
                        )}
                      </div>

                      {selectedTab === 'active' && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{tx('remainingCredits')}</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-primary">
                              {course.remainingCredits}
                            </span>
                            <span className="text-sm text-muted-foreground">{tx('creditsUnit')}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Enrolled Date */}
                    <div className="text-xs text-muted-foreground border-t border-current border-opacity-10 pt-2">
                      {tx('enrolledOn', { date: new Date(course.enrolledAt).toLocaleDateString(locale) })}
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
