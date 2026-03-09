import { getTransactions, getDailyReport } from '@/lib/actions/cash-register.actions'
import { getBranches } from '@/lib/actions/branches.actions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DeleteTransactionButton } from '@/components/cash-register/DeleteTransactionButton'
import Link from 'next/link'
import { Plus, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'

export default async function CashRegisterPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const branchId = typeof searchParams.branch === 'string' ? searchParams.branch : undefined
  const type = (typeof searchParams.type === 'string' ? searchParams.type : undefined) as 'income' | 'expense' | undefined
  const dateStr = typeof searchParams.date === 'string' ? searchParams.date : new Date().toISOString().split('T')[0]

  const [transactionsResult, branchesResult, dailyReportResult] = await Promise.all([
    getTransactions(branchId, type),
    getBranches(),
    branchId ? getDailyReport(branchId, dateStr) : { success: false, data: null },
  ])

  const transactions = transactionsResult.data || []
  const branches = branchesResult.data || []
  const dailyReport = dailyReportResult.success ? dailyReportResult.data : null

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
      {dailyReport && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-[#E5E7EB] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Income</p>
                <p className="text-3xl font-bold text-green-600">${dailyReport.summary.income.toFixed(2)}</p>
              </div>
              <TrendingUp className="text-green-600" size={32} />
            </div>
          </Card>

          <Card className="border-[#E5E7EB] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Expenses</p>
                <p className="text-3xl font-bold text-red-600">${dailyReport.summary.expenses.toFixed(2)}</p>
              </div>
              <TrendingDown className="text-red-600" size={32} />
            </div>
          </Card>

          <Card className="border-[#E5E7EB] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Balance</p>
                <p
                  className={`text-3xl font-bold ${
                    dailyReport.summary.balance >= 0 ? 'text-[#4F46E5]' : 'text-red-600'
                  }`}
                >
                  ${dailyReport.summary.balance.toFixed(2)}
                </p>
              </div>
              <DollarSign className="text-[#4F46E5]" size={32} />
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="border-[#E5E7EB] p-6">
        <div className="flex gap-4 flex-wrap items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-[#111827] block mb-2">Branch</label>
            <select
              defaultValue={branchId || ''}
              onChange={(e) => {
                const params = new URLSearchParams()
                if (e.target.value) params.set('branch', e.target.value)
                if (type) params.set('type', type)
                if (dateStr) params.set('date', dateStr)
                window.location.href = `/dashboard/cash-register?${params.toString()}`
              }}
              className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-[#111827] block mb-2">Type</label>
            <select
              defaultValue={type || ''}
              onChange={(e) => {
                const params = new URLSearchParams()
                if (branchId) params.set('branch', branchId)
                if (e.target.value) params.set('type', e.target.value)
                if (dateStr) params.set('date', dateStr)
                window.location.href = `/dashboard/cash-register?${params.toString()}`
              }}
              className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <Card className="border-[#E5E7EB] p-12 text-center">
          <div className="text-gray-500">
            <DollarSign size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No transactions found</p>
            <p className="text-sm mt-1">Record your first transaction to get started</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <Card key={transaction.id} className="border-[#E5E7EB] p-4">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {transaction.type === 'income' ? (
                      <TrendingUp className="text-green-600" size={20} />
                    ) : (
                      <TrendingDown className="text-red-600" size={20} />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-[#111827]">{transaction.description}</p>
                      <p className="text-sm text-gray-600">
                        {transaction.branches?.name} •{' '}
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <p
                    className={`text-lg font-bold min-w-[120px] text-right ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}${transaction.amount}
                  </p>
                  <DeleteTransactionButton transactionId={transaction.id} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
