import { getCourses } from '@/lib/actions/courses.actions'
import { getBranches } from '@/lib/actions/branches.actions'
import { getDanceTypes } from '@/lib/actions/dance-types.actions'
import { getTranslations } from 'next-intl/server'
import { BranchFilter } from '@/components/courses/BranchFilter'
import { DeleteCourseButton } from '@/components/courses/DeleteCourseButton'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Edit2, Clock, Users, BookOpen, User } from 'lucide-react'

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const t = await getTranslations()
  const params = await searchParams
  const branchId = typeof params.branch === 'string' ? params.branch : undefined
  const searchQuery = typeof params.q === 'string' ? params.q : undefined
  const danceTypeId = typeof params.danceType === 'string' ? params.danceType : undefined

  const [coursesResult, branchesResult, danceTypesResult] = await Promise.all([
    getCourses(branchId, searchQuery, danceTypeId),
    getBranches(),
    getDanceTypes(),
  ])

  const courses = coursesResult.data || []
  const branches = branchesResult.data || []
  const danceTypes = danceTypesResult.data || []

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#111827]">{t('courses.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">{t('courses.description')}</p>
        </div>
        <Link href="/dashboard/courses/new" className="inline-block w-fit">
          <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2 text-sm md:text-base h-9 md:h-10">
            <Plus size={20} />
            {t('courses.addNew')}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <BranchFilter branchId={branchId} branches={branches} searchQuery={searchQuery} danceTypeId={danceTypeId} danceTypes={danceTypes} />

      {/* Courses List */}
      {courses.length === 0 ? (
        <Card className="border-[#E5E7EB] p-6 sm:p-8 md:p-12 text-center">
          <div className="text-gray-500">
            <Clock size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">{t('courses.noCourses')}</p>
            <p className="text-sm mt-1">{t('courses.createFirstCourse')}</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6">
          {courses.map((course: any) => (
            <Card key={course.id} className="border-[#E5E7EB] p-3 sm:p-4 md:p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                <div className="flex-1">
                  <Link href={`/dashboard/courses/${course.id}`}>
                    <h3 className="text-lg font-semibold text-[#111827] hover:text-[#4F46E5]">{course.name}</h3>
                  </Link>
                  <p className="text-sm text-gray-600 mt-1">
                    {course.branches?.name} • {course.dance_types?.name}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock size={16} />
                      {t(`data.days.${['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][course.day_of_week]}`)} {course.start_time} - {course.end_time}
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users size={16} />
                      {course.studentCount || 0} {t('courses.students')}
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <User size={16} />
                      <span>{course.course_instructors && course.course_instructors.length > 0 
                        ? course.course_instructors.map((ci: any) => `${ci.instructors?.first_name} ${ci.instructors?.last_name}`).join(', ')
                        : t('courses.noInstructors')}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <BookOpen size={16} />
                      {course.attendanceCount || 0} {t('courses.attendanceRecords')}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/dashboard/courses/${course.id}/edit`}>
                    <Button size="sm" variant="outline" className="border-[#E5E7EB]" title="Edit">
                      <Edit2 size={16} />
                    </Button>
                  </Link>
                  <DeleteCourseButton courseId={course.id} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
