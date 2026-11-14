import { getInstructorEarnings } from '@/lib/actions/instructor-earnings.actions'
import { getInstructors } from '@/lib/actions/instructors.actions'
import { getOrganization } from '@/lib/auth/getOrganization'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/format'
import { TrendingUp, DollarSign } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { InstructorEarningsTable } from './instructor-earnings-client'
import { InstructorEarningsFilters } from '@/components/instructor-earnings/EarningsFilters'
import { PageHeader } from '@/components/common/PageHeader'
import { InstructorsTabs } from '@/components/instructors/InstructorsTabs'

export default async function InstructorEarningsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const PAGE_SIZE = 10
  const params = await searchParams
  const instructorId = typeof params.instructor === 'string' ? params.instructor : undefined
  const fromDate = typeof params.from === 'string' ? params.from : undefined
  const toDate = typeof params.to === 'string' ? params.to : undefined
  const searchQuery = typeof params.q === 'string' ? params.q : undefined
  const pageParam = typeof params.page === 'string' ? parseInt(params.page, 10) : 1
  const page = Math.max(1, pageParam)

  const t = await getTranslations('instructorEarnings')
  const organization = await getOrganization()
  const currency = organization?.currency || 'TRY'

  const [earningsResult, instructorsResult] = await Promise.all([
    getInstructorEarnings({ search: searchQuery, instructorId, from: fromDate, to: toDate }, page, PAGE_SIZE),
    getInstructors(),
  ])

  const earnings = earningsResult.data || []
  const instructors = instructorsResult.data || []
  const totalCount = earningsResult.totalCount || 0

  const totalEarnings = earningsResult.totalAmount || 0

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />
      <InstructorsTabs />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{t('totalEarnings')}</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(totalEarnings, currency)}</p>
            </div>
            <DollarSign className="text-primary" size={32} />
          </div>
        </Card>

        <Card className="border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{t('totalRecords')}</p>
              <p className="text-3xl font-bold text-primary">{totalCount}</p>
            </div>
            <TrendingUp className="text-primary" size={32} />
          </div>
        </Card>
      </div>

      <InstructorEarningsFilters
        instructors={instructors}
        instructorId={instructorId}
        fromDate={fromDate}
        toDate={toDate}
      />

      <InstructorEarningsTable
        earnings={earnings}
        currency={currency}
        searchQuery={searchQuery}
        currentPage={page}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
      />
    </div>
  )
}
