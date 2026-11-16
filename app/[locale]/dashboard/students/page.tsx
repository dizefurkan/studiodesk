import { Link } from '@/i18n/navigation'
import { getStudentsWithStats, getStudentFilterOptions, getStudentStatusCounts, type StudentStatusFilter } from '@/lib/actions/students.actions'
import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StudentTableWrapper } from '@/components/students/StudentTableWrapper'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
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
  const status: StudentStatusFilter =
    params.status === 'passive' || params.status === 'all' ? params.status : 'active'
  
  console.log('[PAGE] StudentsPage filters:', { danceTypeId, branchId, courseId, hasCredits, searchQuery, page })

  // Fetch students with backend pagination and filters
  const result = await getStudentsWithStats(
    searchQuery, 
    page, 
    PAGE_SIZE,
    danceTypeId,
    branchId,
    courseId,
    hasCredits,
    status
  )
  const statusCounts = (await getStudentStatusCounts()).data
  const students = result.data || []
  const totalCount = result.totalCount || 0
  const totalPages = result.totalPages || 1

  const filterOptions = await getStudentFilterOptions()
  const danceTypes = filterOptions.danceTypes || []
  const branches = filterOptions.branches || []
  const courses = filterOptions.courses || []

  // Check if any filters are active
  const hasActiveFilters = searchQuery || hasCredits || danceTypeId || courseId || branchId

  // Any student at all (active or passive) shows the table; the empty state is for a new studio
  const hasRecords =
    totalCount > 0 || !!hasActiveFilters || (statusCounts ? statusCounts.active + statusCounts.passive > 0 : false)
  const createAction = (
    <Button asChild>
      <Link href="/dashboard/students/new">
        <Plus /> {t('students.addNew')}
      </Link>
    </Button>
  )

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title={t('students.title')}
        description={t('students.description')}
        action={hasRecords ? createAction : undefined}
      />

      {hasRecords ? (
        <Card className="p-3 sm:p-4 md:p-6">
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
            status={status}
            statusCounts={statusCounts}
          />
        </Card>
      ) : (
        <EmptyState
          title={t('emptyStates.students.title')}
          description={t('emptyStates.students.description')}
          action={createAction}
        />
      )}
    </div>
  )
}
