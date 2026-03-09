import { getCourses } from '@/lib/actions/courses.actions'
import { getBranches } from '@/lib/actions/branches.actions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, edit, trash2, Clock, Users } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

async function deleteCourse(courseId: string) {
  'use server'
  const { deleteCourse } = await import('@/lib/actions/courses.actions')
  await deleteCourse(courseId)
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const branchId = typeof searchParams.branch === 'string' ? searchParams.branch : undefined
  const searchQuery = typeof searchParams.q === 'string' ? searchParams.q : undefined

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
      <Card className="border-[#E5E7EB] p-6">
        <div className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-[#111827] block mb-2">Branch</label>
            <select
              defaultValue={branchId || ''}
              onChange={(e) => {
                const params = new URLSearchParams()
                if (e.target.value) params.set('branch', e.target.value)
                if (searchQuery) params.set('q', searchQuery)
                window.location.href = `/dashboard/courses?${params.toString()}`
              }}
              className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

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
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users size={16} />
                      Max {course.capacity} students
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/dashboard/courses/${course.id}/edit`}>
                    <Button size="sm" variant="outline" className="border-[#E5E7EB]" title="Edit">
                      <edit size={16} />
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    title="Delete"
                    onClick={async () => {
                      if (confirm('Delete this course?')) {
                        await deleteCourse(course.id)
                        window.location.reload()
                      }
                    }}
                  >
                    <trash2 size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
