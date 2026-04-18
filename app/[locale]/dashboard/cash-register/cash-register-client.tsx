'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, DollarSign } from 'lucide-react'
import { deleteTransaction } from '@/lib/actions/cash-register.actions'
import { DataTable } from '@/components/table/data-table'
import { getCashRegisterColumns, type CombinedCashItem } from './columns'
import { CashRegisterFilters } from '@/components/cash-register/CashRegisterFilters'
import { formatCurrency } from '@/lib/utils/format'

interface CashRegisterTableProps {
  items: CombinedCashItem[]
  branches: Array<{ id: string; name: string }>
  currency: string
  branchId?: string
  type?: 'income' | 'expense'
  dataType?: 'all' | 'transactions' | 'earnings'
  dateStr: string
  onItemsChange?: (items: CombinedCashItem[]) => void
}

export function CashRegisterTable({
  items: initialItems,
  branches,
  currency,
  branchId: initialBranchId,
  type: initialType,
  dataType: initialDataType,
  dateStr: initialDateStr,
  onItemsChange,
}: CashRegisterTableProps) {
  const t = useTranslations()
  const [items, setItems] = useState(initialItems)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [filterValues, setFilterValues] = useState({
    search: '',
  })

  const handleDelete = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return

    setIsDeletingId(transactionId)
    try {
      const result = await deleteTransaction(transactionId)
      if (result.error) {
        throw new Error(result.error)
      }
      const updatedItems = items.filter((item) => item.id !== transactionId)
      setItems(updatedItems)
      onItemsChange?.(updatedItems)
    } catch (err) {
      console.error('Error deleting transaction:', err)
    } finally {
      setIsDeletingId(null)
    }
  }

  const columns = getCashRegisterColumns({
    currency,
    onDelete: handleDelete,
  })

  // Filter by search (description or branch)
  const filteredItems = items.filter((item) => {
    const searchLower = filterValues.search.toLowerCase()
    return (
      item.description?.toLowerCase().includes(searchLower) ||
      item.branches?.name?.toLowerCase().includes(searchLower) ||
      false
    )
  })

  return (
    <>
      {/* Filters Card */}
      <Card className="border-[#E5E7EB] p-6">
        <CashRegisterFilters
          branches={branches}
          branchId={initialBranchId}
          type={initialType}
          dataType={initialDataType}
          dateStr={initialDateStr}
        />
      </Card>

      {/* Table or Empty State */}
      {filteredItems.length === 0 ? (
        <Card className="border-[#E5E7EB] p-12 text-center">
          <div className="text-gray-500">
            <DollarSign size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No records found</p>
            <p className="text-sm mt-1">Record your first transaction to get started</p>
          </div>
        </Card>
      ) : (
        <Card className="border-[#E5E7EB] p-3 sm:p-4 md:p-6">
          <DataTable<CombinedCashItem, any>
            columns={columns}
            data={filteredItems}
            enablePagination={true}
            enableFilters={false}
            pageSize={10}
            emptyMessage="No transactions found"
          />
        </Card>
      )}
    </>
  )
}
