import { getTranslations } from 'next-intl/server'
import { Plus, TrendingDown, TrendingUp, Users, Wallet, type LucideIcon } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { getCashTransactions, getInstructorEarningsByBranch } from '@/lib/actions/cash-register.actions'
import { getBranches } from '@/lib/actions/branches.actions'
import { getOrganization } from '@/lib/auth/getOrganization'
import { getPayAccess } from '@/lib/auth/payAccess'
import { parseDateOnly, toDateString, todayInTimeZone } from '@/lib/i18n/dates'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/common/PageHeader'
import { CashRegisterTable } from './cash-register-client'
import type { CombinedCashItem } from './columns'
import { CASH_PERIODS, type CashPeriod } from '@/lib/cash/categories'

export default async function CashRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const tx = await getTranslations('cashRegister')
  const params = await searchParams
  const str = (k: string) => (typeof params[k] === 'string' ? (params[k] as string) : undefined)

  const organization = await getOrganization()
  if (!organization) return <Card className="p-8 text-center text-danger">{tx('orgNotFound')}</Card>
  const currency = organization.currency || 'TRY'
  const today = todayInTimeZone(organization.timezone)

  // Filters (all in the URL)
  const branchId = str('branch')
  const type = str('type') === 'income' || str('type') === 'expense' ? (str('type') as 'income' | 'expense') : undefined
  const category = str('category')
  const dataType = (['all', 'transactions', 'earnings'] as const).find((d) => d === str('dataType')) ?? 'all'
  const period: CashPeriod = (CASH_PERIODS as readonly string[]).includes(str('period') ?? '') ? (str('period') as CashPeriod) : 'month'
  const dateParam = str('date')
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today

  // The day range the period covers
  const d = parseDateOnly(date)
  const range =
    period === 'day'
      ? { from: date, to: date }
      : period === 'month'
        ? {
            from: toDateString(new Date(d.getFullYear(), d.getMonth(), 1)),
            to: toDateString(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
          }
        : { from: undefined, to: undefined }

  const access = await getPayAccess()
  const canSeePay = !!access?.canManage
  const [transactionsResult, branchesResult, earningsResult] = await Promise.all([
    // Branch and period apply to the totals; type and category only narrow the list
    getCashTransactions({ branchId, from: range.from, to: range.to }),
    getBranches(undefined, 1, 500),
    canSeePay ? getInstructorEarningsByBranch(branchId, range.from, range.to) : Promise.resolve({ data: [] }),
  ])
  const transactions = transactionsResult.data ?? []
  const branches = (branchesResult.data ?? []).map((b) => ({ id: b.id, name: b.name }))
  const earnings = earningsResult.data ?? []

  const income = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const expenses = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const accrued = earnings.reduce((sum, e) => sum + Number(e.amount), 0)
  // Earnings are what instructors are owed, not cash: payments to them are already expenses
  const net = income - expenses

  const listed = transactions.filter((t) => (!type || t.type === type) && (!category || t.category === category))
  const items: CombinedCashItem[] = [
    ...(dataType === 'earnings' ? [] : listed),
    ...(dataType === 'transactions' || type
      ? []
      : earnings.map((e) => ({
          id: e.id,
          type: 'earning' as const,
          amount: Number(e.amount),
          description: tx('instructorEarningRow', {
            name: `${e.instructors?.first_name ?? ''} ${e.instructors?.last_name ?? ''}`.trim(),
          }),
          created_at: e.created_at,
          branches: e.course_sessions?.courses?.branches || null,
        }))),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const cards: Array<{ label: string; value: number; icon: LucideIcon; tone: string; hint?: string }> = [
    { label: tx('income'), value: income, icon: TrendingUp, tone: 'text-success' },
    { label: tx('expenses'), value: expenses, icon: TrendingDown, tone: 'text-danger' },
    ...(canSeePay
      ? [{ label: tx('instructorPayAccrued'), value: accrued, icon: Users, tone: 'text-foreground', hint: tx('accruedHint') }]
      : []),
    { label: tx('netBalance'), value: net, icon: Wallet, tone: net >= 0 ? 'text-foreground' : 'text-danger', hint: tx('netHint') },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={tx('title')}
        description={tx('description')}
        action={
          <Button asChild>
            <Link href="/dashboard/cash-register/new">
              <Plus /> {tx('newTransaction')}
            </Link>
          </Button>
        }
      />

      <div className={cn('grid grid-cols-2 gap-3', cards.length === 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3')}>
        {cards.map((c) => (
          <Card key={c.label} className="min-w-0 gap-1 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm text-muted-foreground">{c.label}</p>
              <c.icon className={cn('size-5 shrink-0', c.tone)} aria-hidden />
            </div>
            <p className={cn('truncate font-display text-xl font-semibold tabular-nums sm:text-2xl', c.tone)}>
              {formatCurrency(c.value, currency)}
            </p>
            {c.hint && <p className="text-xs text-muted-foreground">{c.hint}</p>}
          </Card>
        ))}
      </div>

      <CashRegisterTable
        items={items}
        branches={branches}
        currency={currency}
        filters={{ branchId, type, category, dataType, period, date, today }}
      />
    </div>
  )
}
