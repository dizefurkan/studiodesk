'use client'

import { DatePicker } from '@/components/common/DatePicker'
import { format, parse } from 'date-fns'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Label } from '@/components/ui/label'

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
        <Label className="block mb-2">Branch</Label>
        <NativeSelect
          defaultValue={branchId || ''}
          onChange={(e) => handleBranchChange(e.target.value)}
          className="w-full"
        >
          <NativeSelectOption value="">All Branches</NativeSelectOption>
          {branches.map((branch) => (
            <NativeSelectOption key={branch.id} value={branch.id}>
              {branch.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      <div className="flex-1 min-w-50">
        <Label className="block mb-2">Data Type</Label>
        <NativeSelect
          defaultValue={dataType || 'all'}
          onChange={(e) => handleDataTypeChange(e.target.value)}
          className="w-full"
        >
          <NativeSelectOption value="all">All</NativeSelectOption>
          <NativeSelectOption value="transactions">Transactions</NativeSelectOption>
          <NativeSelectOption value="earnings">Instructor Earnings</NativeSelectOption>
        </NativeSelect>
      </div>

      <div className="flex-1 min-w-50">
        <Label className="block mb-2">Type</Label>
        <NativeSelect
          defaultValue={type || ''}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="w-full"
          disabled={dataType === 'earnings'}
        >
          <NativeSelectOption value="">All Types</NativeSelectOption>
          <NativeSelectOption value="income">Income</NativeSelectOption>
          <NativeSelectOption value="expense">Expense</NativeSelectOption>
        </NativeSelect>
      </div>

      <div className="flex-1 min-w-50">
        <Label className="block mb-2">Date</Label>
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
