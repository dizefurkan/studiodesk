import { Link } from '@/i18n/navigation'
import { getBranches } from '@/lib/actions/branches.actions'
import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Plus } from 'lucide-react'
import type { Database } from '@/lib/types/database.types'
import { BranchesPageClient } from './branches-client'

type Branch = Database['public']['Tables']['branches']['Row']

const PAGE_SIZE = 10

export default async function BranchesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const t = await getTranslations()
  const params = await searchParams
  const searchQuery = typeof params.q === 'string' ? params.q : undefined
  const pageParam = typeof params.page === 'string' ? parseInt(params.page, 10) : 1
  const page = Math.max(1, pageParam)

  const result = await getBranches(searchQuery, page, PAGE_SIZE)
  const branches = result.data || []
  const totalCount = result.totalCount || 0
  const totalPages = result.totalPages || 1
  console.log('[BranchesPage] Branches to render:', branches)
  console.log('[BranchesPage] Branches length:', branches.length)

  const hasRecords = totalCount > 0 || !!searchQuery
  const createAction = (
    <Button asChild>
      <Link href="/dashboard/branches/new">
        <Plus /> {t('branches.addNew')}
      </Link>
    </Button>
  )

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title={t('branches.title')}
        description={t('branches.description')}
        action={hasRecords ? createAction : undefined}
      />

      {hasRecords ? (
        <Card className="p-3 sm:p-4 md:p-6">
          <BranchesPageClient
            branches={branches}
            searchQuery={searchQuery}
            currentPage={page}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
          />
        </Card>
      ) : (
        <EmptyState
          title={t('emptyStates.branches.title')}
          description={t('emptyStates.branches.description')}
          action={createAction}
        />
      )}
    </div>
  )
}
