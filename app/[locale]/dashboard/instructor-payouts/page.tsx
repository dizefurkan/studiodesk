import { getTranslations } from 'next-intl/server'
import { getPaySummary } from '@/lib/actions/instructor-pay.actions'
import { getPayAccess } from '@/lib/auth/payAccess'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/common/PageHeader'
import { InstructorsTabs } from '@/components/instructors/InstructorsTabs'
import { MonthSwitcher } from '@/components/instructor-pay/MonthSwitcher'
import { NoPayAccess } from '@/components/instructor-pay/NoPayAccess'
import { PeriodControls } from '@/components/instructor-pay/PeriodControls'
import { formatCurrency } from '@/lib/utils/format'
import { PayoutsTable } from './payouts-client'

export default async function InstructorPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const t = await getTranslations('instructorPay')
  const params = await searchParams
  const month = typeof params.month === 'string' ? params.month : undefined

  const access = await getPayAccess()
  if (!access?.canManage) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('payouts.title')} description={t('payouts.description')} />
        <InstructorsTabs />
        <NoPayAccess />
      </div>
    )
  }

  const result = await getPaySummary(month)
  const summary = result.data
  const currency = access.currency

  return (
    <div className="space-y-6">
      <PageHeader title={t('payouts.title')} description={t('payouts.description')} />
      <InstructorsTabs />

      {!summary ? (
        <Card className="p-6 text-sm text-danger">{result.error}</Card>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <MonthSwitcher month={summary.month} />
            <PeriodControls
              month={summary.month}
              isClosed={summary.isClosed}
              closedAt={summary.closedAt}
              canClose={summary.canClose}
              canReopen={summary.canReopen}
            />
          </div>

          {summary.isClosed && (
            <p className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              {t('period.lockedNotice')}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {(
              [
                ['opening', summary.totals.opening],
                ['earned', summary.totals.earned],
                ['adjustments', summary.totals.adjustments],
                ['paid', summary.totals.paid],
                ['closing', summary.totals.closing],
              ] as const
            ).map(([key, value]) => (
              <Card key={key} className={key === 'closing' ? 'col-span-2 gap-1 p-4 md:col-span-1' : 'gap-1 p-4'}>
                <p className="truncate text-xs text-muted-foreground sm:text-sm">{t(`summary.${key}`)}</p>
                <p
                  className={
                    key === 'closing'
                      ? 'truncate text-xl font-bold tabular-nums text-primary sm:text-2xl'
                      : 'truncate text-xl font-bold tabular-nums sm:text-2xl'
                  }
                >
                  {formatCurrency(value, currency)}
                </p>
              </Card>
            ))}
          </div>

          <PayoutsTable
            rows={summary.rows}
            branches={summary.branches}
            month={summary.month}
            isClosed={summary.isClosed}
            today={summary.today}
          />
        </>
      )}
    </div>
  )
}
