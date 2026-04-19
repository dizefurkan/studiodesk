import { getStudentsWithStats, getStudentFilterOptions } from '@/lib/actions/students.actions'
import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StudentTableWrapper } from '@/components/students/StudentTableWrapper'
import Link from 'next/link'
import { Users, Plus } from 'lucide-react'
import type { Database } from '@/lib/types/database.types'

type Student = Database['public']['Tables']['students']['Row']

const PAGE_SIZE = 10

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const t = await getTranslations()
  const params = await searchParams
  
  // Extract parameters
  const searchQuery = typeof params.q === 'string' ? params.q : undefined
  const pageParam = typeof params.page === 'string' ? parseInt(params.page, 10) : 1
  const page = Math.max(1, pageParam) // Ensure page is at least 1
  
  // Note: Other filters (hasCredits, danceType, course, branch) are kept for potential
  // future client-side filtering UI, but not used in table queries anymore
  const hasCredits = params.hasCredits === 'true'
  const danceTypeId = typeof params.danceType === 'string' ? params.danceType : undefined
  const courseId = typeof params.course === 'string' ? params.course : undefined
  const branchId = typeof params.branch === 'string' ? params.branch : undefined
  
  console.log('[PAGE] StudentsPage filters:', { danceTypeId, branchId, courseId, hasCredits, searchQuery, page })

  // Fetch students with backend pagination and filters
  const result = await getStudentsWithStats(
    searchQuery, 
    page, 
    PAGE_SIZE,
    danceTypeId,
    branchId,
    courseId,
    hasCredits
  )
  const students = result.data || []
  const totalCount = result.totalCount || 0
  const totalPages = result.totalPages || 1

  const filterOptions = await getStudentFilterOptions()
  const danceTypes = (filterOptions as any).danceTypes || []
  const branches = (filterOptions as any).branches || []
  const courses = (filterOptions as any).courses || []

  // Check if any filters are active
  const hasActiveFilters = searchQuery || hasCredits || danceTypeId || courseId || branchId

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#111827]">{t('students.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">{t('students.description')}</p>
        </div>
        <Link href="/dashboard/students/new">
          <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm md:text-base h-9 md:h-10">
            <Plus size={20} className="mr-2" />
            {t('students.addNew')}
          </Button>
        </Link>
      </div>

      {/* Content - Always show table card with filters */}
      <Card className="border-[#E5E7EB] p-3 sm:p-4 md:p-6">
        {/* Filters and Table - Managed by Client Wrapper */}
        <StudentTableWrapper
          students={students}
          danceTypes={danceTypes}
          branches={branches}
          courses={courses}
          searchQuery={searchQuery}
          hasCredits={hasCredits}
          danceTypeId={danceTypeId}
          branchId={branchId}
          courseId={courseId}
          filteredDanceTypeId={danceTypeId}
          currentPage={page}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
        />

        {/* Empty State */}
        {students.length === 0 && (
          <div className="p-12 text-center mt-8">
            <Users className="mx-auto text-[#9CA3AF] mb-4" size={48} />
            {hasActiveFilters ? (
              <>
                <h3 className="text-lg font-semibold text-[#111827] mb-1">{t('students.noStudents')}</h3>
                <p className="text-gray-600 mb-6">No students match the selected filters. Try adjusting your search criteria.</p>
                <Link href="/dashboard/students">
                  <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
                    {t('common.filter')}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-[#111827] mb-1">{t('students.noStudents')}</h3>
                <p className="text-gray-600 mb-6">Get started by adding your first student</p>
                <Link href="/dashboard/students/new">
                  <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
                    <Plus size={20} className="mr-2" />
                    {t('students.addNew')}
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
