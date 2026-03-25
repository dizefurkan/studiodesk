'use client'

import { DatePicker } from '@/components/ui/date-picker'
import { format, parse } from 'date-fns'

interface CashRegisterFiltersProps {
  branches: Array<{ id: string; name: string }>
  branchId?: string
  type?: 'income' | 'expense' | 'earnings'
  dataType?: 'all' | 'transactions' | 'earnings'
  dateStr?: string
}

export function CashRegisterFilters({
  branches,
  branchId,
  type,
  dataType,
  dateStr,
}: CashRegisterFiltersProps) {
  const handleBranchChange = (value: string) => {
    const params = new URLSearchParams()
    if (value) params.set('branch', value)
    if (type) params.set('type', type)
    if (dataType) params.set('dataType', dataType)
    if (dateStr) params.set('date', dateStr)
    window.location.href = `/dashboard/cash-register?${params.toString()}`
  }

  const handleTypeChange = (value: string) => {
    const params = new URLSearchParams()
    if (branchId) params.set('branch', branchId)
    if (value && value !== 'earnings') params.set('type', value)
    if (dataType) params.set('dataType', dataType)
    if (dateStr) params.set('date', dateStr)
    window.location.href = `/dashboard/cash-register?${params.toString()}`
  }

  const handleDataTypeChange = (value: string) => {
    const params = new URLSearchParams()
    if (branchId) params.set('branch', branchId)
    if (value !== 'all') {
      if (value === 'earnings') {
        params.set('dataType', 'earnings')
      } else if (value === 'transactions') {
        if (type) params.set('type', type)
        params.set('dataType', 'transactions')
      }
    } else {
      params.set('dataType', 'all')
      if (type) params.set('type', type)
    }
    if (dateStr) params.set('date', dateStr)
    window.location.href = `/dashboard/cash-register?${params.toString()}`
  }

  const handleDateChange = (date: Date) => {
    const dateValue = format(date, 'yyyy-MM-dd')
    const params = new URLSearchParams()
    if (branchId) params.set('branch', branchId)
    if (type) params.set('type', type)
    if (dataType) params.set('dataType', dataType)
    if (dateValue) params.set('date', dateValue)
    window.location.href = `/dashboard/cash-register?${params.toString()}`
  }

  // Parse date string to Date object for DatePicker
  const dateObj = dateStr ? parse(dateStr, 'yyyy-MM-dd', new Date()) : undefined

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
        <label className="text-sm font-medium text-[#111827] block mb-2">Data Type</label>
        <select
          defaultValue={dataType || 'all'}
          onChange={(e) => handleDataTypeChange(e.target.value)}
          className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
        >
          <option value="all">All</option>
          <option value="transactions">Transactions</option>
          <option value="earnings">Instructor Earnings</option>
        </select>
      </div>

      <div className="flex-1 min-w-50">
        <label className="text-sm font-medium text-[#111827] block mb-2">Type</label>
        <select
          defaultValue={type || ''}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          disabled={dataType === 'earnings'}
        >
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>

      <div className="flex-1 min-w-50">
        <label className="text-sm font-medium text-[#111827] block mb-2">Date</label>
        <DatePicker
          value={dateObj}
          onDateChange={handleDateChange}
          placeholder="Select date"
          className="w-full"
        />
      </div>
    </div>
  )
}
