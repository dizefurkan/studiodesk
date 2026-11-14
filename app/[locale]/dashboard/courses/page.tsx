import { Link } from '@/i18n/navigation'
import { getCourses } from '@/lib/actions/courses.actions'
import { getBranches } from '@/lib/actions/branches.actions'
import { getDanceTypes } from '@/lib/actions/dance-types.actions'
import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CoursesPageClient } from './courses-client'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Plus } from 'lucide-react'

const PAGE_SIZE = 10

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const t = await getTranslations()
  const params = await searchParams
  const searchQuery = typeof params.q === 'string' ? params.q : undefined
  const pageParam = typeof params.page === 'string' ? parseInt(params.page, 10) : 1
  const page = Math.max(1, pageParam)

  const [coursesResult, branchesResult, danceTypesResult] = await Promise.all([
    getCourses(searchQuery, page, PAGE_SIZE),
    getBranches(),
    getDanceTypes(),
  ])

  const courses = coursesResult.data || []
  const branches = branchesResult.data || []
  const danceTypes = danceTypesResult.data || []
  const totalCount = coursesResult.totalCount || 0

  const hasRecords = totalCount > 0 || !!searchQuery
  const createAction = (
    <Button asChild>
      <Link href="/dashboard/courses/new">
        <Plus /> {t('courses.addNew')}
      </Link>
    </Button>
  )

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title={t('courses.title')}
        description={t('courses.description')}
        action={hasRecords ? createAction : undefined}
      />

      {hasRecords ? (
        <Card className="p-3 sm:p-4 md:p-6">
          <CoursesPageClient
            courses={courses}
            branches={branches}
            danceTypes={danceTypes}
            searchQuery={searchQuery}
            currentPage={page}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
          />
        </Card>
      ) : (
        <EmptyState
          title={t('emptyStates.courses.title')}
          description={t('emptyStates.courses.description')}
          action={createAction}
        />
      )}
    </div>
  )
}
