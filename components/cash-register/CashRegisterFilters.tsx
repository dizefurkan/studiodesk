'use client'

interface CashRegisterFiltersProps {
  branches: Array<{ id: string; name: string }>
  branchId?: string
  type?: 'income' | 'expense'
  dateStr?: string
}

export function CashRegisterFilters({
  branches,
  branchId,
  type,
  dateStr,
}: CashRegisterFiltersProps) {
  const handleBranchChange = (value: string) => {
    const params = new URLSearchParams()
    if (value) params.set('branch', value)
    if (type) params.set('type', type)
    if (dateStr) params.set('date', dateStr)
    window.location.href = `/dashboard/cash-register?${params.toString()}`
  }

  const handleTypeChange = (value: string) => {
    const params = new URLSearchParams()
    if (branchId) params.set('branch', branchId)
    if (value) params.set('type', value)
    if (dateStr) params.set('date', dateStr)
    window.location.href = `/dashboard/cash-register?${params.toString()}`
  }

  const handleDateChange = (value: string) => {
    const params = new URLSearchParams()
    if (branchId) params.set('branch', branchId)
    if (type) params.set('type', type)
    if (value) params.set('date', value)
    window.location.href = `/dashboard/cash-register?${params.toString()}`
  }

  return (
    <div className="flex gap-4 flex-wrap items-end">
      <div className="flex-1 min-w-50">
        <label className="text-sm font-medium text-[#111827] block mb-2">Branch</label>
        <select
          defaultValue={branchId || ''}
          onChange={(e) => handleBranchChange(e.target.value)}
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

      <div className="flex-1 min-w-50">
        <label className="text-sm font-medium text-[#111827] block mb-2">Type</label>
        <select
          defaultValue={type || ''}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
        >
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>

      <div className="flex-1 min-w-50">
        <label className="text-sm font-medium text-[#111827] block mb-2">Date</label>
        <input
          type="date"
          defaultValue={dateStr || ''}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
        />
      </div>
    </div>
  )
}
