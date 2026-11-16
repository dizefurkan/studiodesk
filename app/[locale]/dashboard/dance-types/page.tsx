import { Link } from '@/i18n/navigation'
import { getDanceTypes } from '@/lib/actions/dance-types.actions'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { DanceTypesPageClient } from './dance-types-client'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Plus } from 'lucide-react'

const PAGE_SIZE = 10

export default async function DanceTypesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const t = await getTranslations()
  const params = await searchParams
  const searchQuery = typeof params.q === 'string' ? params.q : undefined
  const pageParam = typeof params.page === 'string' ? parseInt(params.page, 10) : 1
  const page = Math.max(1, pageParam)

  const result = await getDanceTypes(searchQuery, page, PAGE_SIZE)
  const danceTypes = result.data || []
  const totalCount = result.totalCount || 0
  const totalPages = result.totalPages || 1

  const hasRecords = totalCount > 0 || !!searchQuery
  const createAction = (
    <Button asChild>
      <Link href="/dashboard/dance-types/new">
        <Plus /> {t('danceTypes.addNew')}
      </Link>
    </Button>
  )

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title={t('danceTypes.title')}
        description={t('danceTypes.description')}
        action={hasRecords ? createAction : undefined}
      />

      {hasRecords ? (
        <div className="min-w-0">
          <DanceTypesPageClient
            danceTypes={danceTypes}
            searchQuery={searchQuery}
            currentPage={page}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
          />
        </div>
      ) : (
        <EmptyState
          title={t('emptyStates.danceTypes.title')}
          description={t('emptyStates.danceTypes.description')}
          action={createAction}
        />
      )}
    </div>
  )
}
