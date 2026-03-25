import { getTransactions, getDailyReport, getInstructorEarningsByBranch } from '@/lib/actions/cash-register.actions'
import { getBranches } from '@/lib/actions/branches.actions'
import { getOrganization } from '@/lib/auth/getOrganization'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DeleteTransactionButton } from '@/components/cash-register/DeleteTransactionButton'
import { CashRegisterFilters } from '@/components/cash-register/CashRegisterFilters'
import { formatCurrency } from '@/lib/utils/format'
import Link from 'next/link'
import { Plus, DollarSign, TrendingUp, TrendingDown, Users } from 'lucide-react'

export default async function CashRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const branchId = typeof params.branch === 'string' ? params.branch : undefined
  const type = (typeof params.type === 'string' ? params.type : undefined) as 'income' | 'expense' | undefined
  const dataType = (typeof params.dataType === 'string' ? params.dataType : 'all') as 'all' | 'transactions' | 'earnings'
  const dateStr = typeof params.date === 'string' ? params.date : new Date().toISOString().split('T')[0]

  const organization = await getOrganization()
  const currency = organization?.currency || 'TRY'

  const [transactionsResult, branchesResult, dailyReportResult, earningsResult] = await Promise.all([
    dataType === 'earnings' ? { data: [] } : getTransactions(branchId, type),
    getBranches(),
    branchId && dataType !== 'earnings' ? getDailyReport(branchId, dateStr) : { success: false, data: null },
    dataType === 'transactions' ? { data: [] } : getInstructorEarningsByBranch(branchId, dateStr, dateStr),
  ])

  const transactions = transactionsResult.data || []
  const branches = branchesResult.data || []
  const dailyReport = dailyReportResult.success ? dailyReportResult.data : null
  const earnings = earningsResult.data || []

  // Merge transactions and earnings into a single sorted list
  interface CombinedItem {
    id: string
    type: 'income' | 'expense' | 'earning'
    amount: number
    description: string
    created_at: string
    branches?: { name: string } | null
    instructors?: { first_name: string; last_name: string }
  }

  const combinedItems: CombinedItem[] = [
    ...transactions.map((t: any) => ({
      ...t,
      type: t.type as 'income' | 'expense',
    })),
    ...earnings.map((e: any) => ({
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
    .filter((t: any) => t.type === 'income')
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0)
  const expenses = transactions
    .filter((t: any) => t.type === 'expense')
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0)
  const totalEarnings = earnings.reduce((sum: number, e: any) => sum + Number(e.amount), 0)
  const netBalance = income - expenses - totalEarnings

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">Cash Register</h1>
          <p className="text-gray-600 mt-1">Track all financial transactions</p>
        </div>
        <Link href="/dashboard/cash-register/new">
          <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2">
            <Plus size={20} />
            New Transaction
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#E5E7EB] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Income</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(income, currency)}</p>
            </div>
            <TrendingUp className="text-green-600" size={32} />
          </div>
        </Card>

        <Card className="border-[#E5E7EB] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Expenses</p>
              <p className="text-3xl font-bold text-red-600">{formatCurrency(expenses, currency)}</p>
            </div>
            <TrendingDown className="text-red-600" size={32} />
          </div>
        </Card>

        <Card className="border-[#E5E7EB] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Instructor Pay</p>
              <p className="text-3xl font-bold text-purple-600">{formatCurrency(totalEarnings, currency)}</p>
            </div>
            <Users className="text-purple-600" size={32} />
          </div>
        </Card>

        <Card className="border-[#E5E7EB] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Net Balance</p>
              <p
                className={`text-3xl font-bold ${
                  netBalance >= 0 ? 'text-[#4F46E5]' : 'text-red-600'
                }`}
              >
                {formatCurrency(netBalance, currency)}
              </p>
            </div>
            <DollarSign className="text-[#4F46E5]" size={32} />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-[#E5E7EB] p-6">
        <CashRegisterFilters branches={branches} branchId={branchId} type={type} dataType={dataType} dateStr={dateStr} />
      </Card>

      {/* Combined Transactions & Earnings List */}
      {combinedItems.length === 0 ? (
        <Card className="border-[#E5E7EB] p-12 text-center">
          <div className="text-gray-500">
            <DollarSign size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No records found</p>
            <p className="text-sm mt-1">Record your first transaction to get started</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {combinedItems.map((item) => (
            <Card key={item.id} className="border-[#E5E7EB] p-4">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {item.type === 'income' ? (
                      <TrendingUp className="text-green-600" size={20} />
                    ) : item.type === 'expense' ? (
                      <TrendingDown className="text-red-600" size={20} />
                    ) : (
                      <Users className="text-purple-600" size={20} />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-[#111827]">{item.description}</p>
                      <p className="text-sm text-gray-600">
                        {item.branches?.name} •{' '}
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <p
                    className={`text-lg font-bold min-w-30 text-right ${
                      item.type === 'income' ? 'text-green-600' : item.type === 'expense' ? 'text-red-600' : 'text-purple-600'
                    }`}
                  >
                    {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount, currency)}
                  </p>
                  {item.type !== 'earning' && <DeleteTransactionButton transactionId={item.id} />}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
