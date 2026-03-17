import { getCourses } from '@/lib/actions/courses.actions'
import { getBranches } from '@/lib/actions/branches.actions'
import { BranchFilter } from '@/components/courses/BranchFilter'
import { DeleteCourseButton } from '@/components/courses/DeleteCourseButton'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Edit2, Clock, Users } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const branchId = typeof params.branch === 'string' ? params.branch : undefined
  const searchQuery = typeof params.q === 'string' ? params.q : undefined

  const [coursesResult, branchesResult] = await Promise.all([
    getCourses(branchId, searchQuery),
    getBranches(),
  ])

  const courses = coursesResult.data || []
  const branches = branchesResult.data || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">Courses</h1>
          <p className="text-gray-600 mt-1">Manage your dance courses and schedules</p>
        </div>
        <Link href="/dashboard/courses/new">
          <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2">
            <Plus size={20} />
            New Course
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <BranchFilter branchId={branchId} branches={branches} searchQuery={searchQuery} />

      {/* Courses List */}
      {courses.length === 0 ? (
        <Card className="border-[#E5E7EB] p-12 text-center">
          <div className="text-gray-500">
            <Clock size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No courses found</p>
            <p className="text-sm mt-1">Create your first course to get started</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {courses.map((course) => (
            <Card key={course.id} className="border-[#E5E7EB] p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Link href={`/dashboard/courses/${course.id}`}>
                    <h3 className="text-lg font-semibold text-[#111827] hover:text-[#4F46E5]">{course.name}</h3>
                  </Link>
                  <p className="text-sm text-gray-600 mt-1">
                    {course.branches?.name} • {course.dance_types?.name}
                  </p>

                  <div className="flex gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock size={16} />
                      {DAYS[course.day_of_week]} {course.start_time} - {course.end_time}
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
