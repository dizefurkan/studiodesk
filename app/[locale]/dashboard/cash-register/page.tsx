import { Link } from '@/i18n/navigation'
import { getTransactions, getDailyReport, getInstructorEarningsByBranch } from '@/lib/actions/cash-register.actions'
import { getBranches } from '@/lib/actions/branches.actions'
import { getOrganization } from '@/lib/auth/getOrganization'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/format'
import { Plus, DollarSign, TrendingUp, TrendingDown, Users } from 'lucide-react'
import { CashRegisterTable } from './cash-register-client'
import type { CombinedCashItem } from './columns'

export default async function CashRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const PAGE_SIZE = 10
  const params = await searchParams
  const branchId = typeof params.branch === 'string' ? params.branch : undefined
  const type = (typeof params.type === 'string' ? params.type : undefined) as 'income' | 'expense' | undefined
  const dataType = (typeof params.dataType === 'string' ? params.dataType : 'all') as 'all' | 'transactions' | 'earnings'
  const dateStr = typeof params.date === 'string' ? params.date : new Date().toISOString().split('T')[0]
  const searchQuery = typeof params.q === 'string' ? params.q : undefined
  const pageParam = typeof params.page === 'string' ? parseInt(params.page, 10) : 1
  const page = Math.max(1, pageParam)

  const organization = await getOrganization()
  if (!organization) {
    return <div className="p-8 text-center text-red-600">Organization not found</div>
  }

  const currency = organization?.currency || 'TRY'

  try {
    const [transactionsResult, branchesResult, dailyReportResult, earningsResult] = await Promise.all([
      dataType === 'earnings' ? { data: [] } : getTransactions(searchQuery, page, PAGE_SIZE),
      getBranches(),
      branchId && dataType !== 'earnings' ? getDailyReport(branchId, dateStr) : { success: false, data: null },
      dataType === 'transactions' ? { data: [] } : getInstructorEarningsByBranch(branchId, dateStr, dateStr),
    ])

    const transactions = transactionsResult?.data || []
    const branches = branchesResult?.data || []
    const dailyReport = dailyReportResult?.success ? dailyReportResult.data : null
    const earnings = earningsResult?.data || []

    // Merge transactions and earnings into a single sorted list
    const combinedItems: CombinedCashItem[] = [
      ...transactions.map((t) => ({
        ...t,
        type: t.type as 'income' | 'expense',
      })),
      ...earnings.map((e) => ({
        id: e.id,
        type: 'earning' as const,
        amount: e.amount,
        description: `Instructor Payment - ${e.instructors?.first_name} ${e.instructors?.last_name}`,
        created_at: e.created_at,
        instructors: e.instructors,
        branches: e.course_sessions?.courses?.branches || null,
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Calculate summary including earnings
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum: number, t) => sum + Number(t.amount), 0)
    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum: number, t) => sum + Number(t.amount), 0)
    const totalEarnings = earnings.reduce((sum: number, e) => sum + Number(e.amount), 0)
    const netBalance = income - expenses - totalEarnings

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Cash Register</h1>
            <p className="text-muted-foreground mt-1">Track all financial transactions</p>
          </div>
          <Link href="/dashboard/cash-register/new">
            <Button className="gap-2">
              <Plus size={20} />
              New Transaction
            </Button>
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Income</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(income, currency)}</p>
              </div>
              <TrendingUp className="text-green-600" size={32} />
            </div>
          </Card>

          <Card className="border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Expenses</p>
                <p className="text-3xl font-bold text-red-600">{formatCurrency(expenses, currency)}</p>
              </div>
              <TrendingDown className="text-red-600" size={32} />
            </div>
          </Card>

          <Card className="border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Instructor Pay</p>
                <p className="text-3xl font-bold text-purple-600">{formatCurrency(totalEarnings, currency)}</p>
              </div>
              <Users className="text-purple-600" size={32} />
            </div>
          </Card>

          <Card className="border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Net Balance</p>
                <p
                  className={`text-3xl font-bold ${
                    netBalance >= 0 ? 'text-primary' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(netBalance, currency)}
                </p>
              </div>
              <DollarSign className="text-primary" size={32} />
            </div>
          </Card>
        </div>

        {/* Table Section */}
        <CashRegisterTable
          items={combinedItems}
          branches={branches}
          currency={currency}
          branchId={branchId}
          type={type}
          dataType={dataType}
          dateStr={dateStr}
        />
      </div>
    )
  } catch (error) {
    console.error('Error loading cash register page:', error)
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 font-semibold mb-2">Error loading cash register</p>
        <p className="text-muted-foreground text-sm">Please try refreshing the page</p>
      </div>
    )
  }
}
