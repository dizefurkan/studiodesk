import { Link } from '@/i18n/navigation'
import { getInstructors, getInstructorFilterOptions } from '@/lib/actions/instructors.actions'
import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InstructorTableWrapper } from '@/components/instructors/InstructorTableWrapper'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Plus } from 'lucide-react'
import type { Database } from '@/lib/types/database.types'

type Instructor = Database['public']['Tables']['instructors']['Row']

const PAGE_SIZE = 10

export default async function InstructorsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const t = await getTranslations()
  const params = await searchParams
  const searchQuery = typeof params.q === 'string' ? params.q : undefined
  const pageParam = typeof params.page === 'string' ? parseInt(params.page, 10) : 1
  const page = Math.max(1, pageParam)
  const danceTypeId = typeof params.danceType === 'string' ? params.danceType : undefined
  const branchId = typeof params.branch === 'string' ? params.branch : undefined

  const result = await getInstructors(searchQuery, page, PAGE_SIZE)

  if (result.error) {
    console.error('[InstructorsPage] Error fetching instructors:', result.error)
  }

  const instructors = result.data || []
  const totalCount = result.totalCount || 0
  const totalPages = result.totalPages || 1

  const filterOptions = await getInstructorFilterOptions()
  const danceTypes = filterOptions.danceTypes || []
  const branches = filterOptions.branches || []

  const hasRecords = totalCount > 0 || !!(searchQuery || danceTypeId || branchId)
  const createAction = (
    <Button asChild>
      <Link href="/dashboard/instructors/new">
        <Plus /> {t('instructors.addNew')}
      </Link>
    </Button>
  )

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title={t('instructors.title')}
        description={t('instructors.description')}
        action={hasRecords ? createAction : undefined}
      />

      {hasRecords ? (
        <Card className="p-3 sm:p-4 md:p-6">
          <InstructorTableWrapper
            instructors={instructors}
            danceTypes={danceTypes}
            branches={branches}
            searchQuery={searchQuery}
            danceTypeId={danceTypeId}
            branchId={branchId}
            currentPage={page}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
          />
        </Card>
      ) : (
        <EmptyState
          title={t('emptyStates.instructors.title')}
          description={t('emptyStates.instructors.description')}
          action={createAction}
        />
      )}
    </div>
  )
}
