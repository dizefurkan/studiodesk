import { getTranslations } from 'next-intl/server'
import { Info } from 'lucide-react'
import { getCourseProfitability } from '@/lib/actions/instructor-pay.actions'
import { getPayAccess } from '@/lib/auth/payAccess'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/common/PageHeader'
import { InstructorsTabs } from '@/components/instructors/InstructorsTabs'
import { NoPayAccess } from '@/components/instructor-pay/NoPayAccess'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import { ProfitabilityFilters, ProfitabilityTable } from './profitability-client'

export default async function CourseProfitabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const t = await getTranslations('instructorPay.profitability')
  const params = await searchParams
  const str = (k: string) => (typeof params[k] === 'string' ? (params[k] as string) : undefined)

  const access = await getPayAccess()
  if (!access?.canManage) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('title')} description={t('description')} />
        <InstructorsTabs />
        <NoPayAccess />
      </div>
    )
  }

  const result = await getCourseProfitability({ from: str('from'), to: str('to'), branchId: str('branch') })
  const report = result.data
  const money = (n: number) => formatCurrency(n, access.currency)

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />
      <InstructorsTabs />

      {!report ? (
        <Card className="p-6 text-sm text-danger">{result.error}</Card>
      ) : (
        <>
          <ProfitabilityFilters from={report.from} to={report.to} branchId={report.branchId} branches={report.branches} />

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card className="gap-1 p-4">
              <p className="truncate text-xs text-muted-foreground sm:text-sm">{t('revenue')}</p>
              <p className="truncate text-xl font-bold tabular-nums sm:text-2xl">{money(report.totals.revenue)}</p>
            </Card>
            <Card className="gap-1 p-4">
              <p className="truncate text-xs text-muted-foreground sm:text-sm">{t('cost')}</p>
              <p className="truncate text-xl font-bold tabular-nums sm:text-2xl">{money(report.totals.cost)}</p>
            </Card>
            <Card className="gap-1 p-4">
              <p className="truncate text-xs text-muted-foreground sm:text-sm">{t('profit')}</p>
              <p
                className={cn(
                  'truncate text-xl font-bold tabular-nums sm:text-2xl',
                  report.totals.profit < 0 ? 'text-danger' : 'text-primary'
                )}
              >
                {money(report.totals.profit)}
              </p>
            </Card>
            <Card className="gap-1 p-4">
              <p className="truncate text-xs text-muted-foreground sm:text-sm">{t('margin')}</p>
              <p className="truncate text-xl font-bold tabular-nums sm:text-2xl">
                {report.totals.margin === null ? '—' : t('marginValue', { value: report.totals.margin.toLocaleString() })}
              </p>
            </Card>
          </div>

          <ProfitabilityTable rows={report.rows} />

          <Alert>
            <Info />
            <AlertDescription>{t('note')}</AlertDescription>
          </Alert>
        </>
      )}
    </div>
  )
}
