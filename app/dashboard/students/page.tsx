import { getStudentsWithStats, getStudentFilterOptions } from '@/lib/actions/students.actions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StudentFilters } from '@/components/students/StudentFilters'
import { StudentTable } from '@/components/students/StudentTable'
import Link from 'next/link'
import { Users, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Database } from '@/lib/types/database.types'

type Student = Database['public']['Tables']['students']['Row']

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const searchQuery = typeof params.q === 'string' ? params.q : undefined
  const page = typeof params.page === 'string' ? parseInt(params.page, 10) : 1
  const hasCredits = params.hasCredits === 'true'
  const danceTypeId = typeof params.danceType === 'string' ? params.danceType : undefined
  const courseId = typeof params.course === 'string' ? params.course : undefined
  const branchId = typeof params.branch === 'string' ? params.branch : undefined

  const result = await getStudentsWithStats(searchQuery, page, 10, {
    hasCredits,
    danceTypeId,
    courseId,
    branchId,
  })
  const students = result.data || []
  const pagination = result.pagination || { page: 1, limit: 10, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false }

  const filterOptions = await getStudentFilterOptions()
  const danceTypes = (filterOptions as any).danceTypes || []
  const branches = (filterOptions as any).branches || []
  const courses = (filterOptions as any).courses || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">Students</h1>
          <p className="text-gray-600 mt-1">Manage your studio students</p>
        </div>
        <Link href="/dashboard/students/new">
          <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
            <Plus size={20} className="mr-2" />
            Add Student
          </Button>
        </Link>
      </div>

      {/* Content */}
      {students.length === 0 ? (
        <Card className="border-[#E5E7EB]">
          <div className="p-12 text-center">
            <Users className="mx-auto text-[#9CA3AF] mb-4" size={48} />
            <h3 className="text-lg font-semibold text-[#111827] mb-1">No students yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first student</p>
            <Link href="/dashboard/students/new">
              <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
                <Plus size={20} className="mr-2" />
                Add First Student
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="border-[#E5E7EB] p-6">
          <StudentTable
            students={students}
            danceTypes={danceTypes}
            branches={branches}
            courses={courses}
            searchQuery={searchQuery}
            hasCredits={hasCredits}
            danceTypeId={danceTypeId}
            branchId={branchId}
            courseId={courseId}
          />

          {/* Pagination Controls */}
          <div className="mt-6 pt-6 border-t border-[#E5E7EB] flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} students
            </div>
            <div className="flex gap-2 items-center">
              <Link 
                href={`/dashboard/students?q=${searchQuery || ''}&page=${pagination.page - 1}`}
                className={pagination.hasPrevPage ? '' : 'pointer-events-none opacity-50'}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#E5E7EB]"
                  disabled={!pagination.hasPrevPage}
                >
                  <ChevronLeft size={16} className="mr-1" />
                  Previous
                </Button>
              </Link>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <Link 
                    key={p}
                    href={`/dashboard/students?q=${searchQuery || ''}&page=${p}`}
                  >
                    <Button
                      variant={p === pagination.page ? 'default' : 'outline'}
                      size="sm"
                      className={p === pagination.page ? 'bg-[#4F46E5] text-white' : 'border-[#E5E7EB]'}
                    >
                      {p}
                    </Button>
                  </Link>
                ))}
              </div>

              <Link 
                href={`/dashboard/students?q=${searchQuery || ''}&page=${pagination.page + 1}`}
                className={pagination.hasNextPage ? '' : 'pointer-events-none opacity-50'}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#E5E7EB]"
                  disabled={!pagination.hasNextPage}
                >
                  Next
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
