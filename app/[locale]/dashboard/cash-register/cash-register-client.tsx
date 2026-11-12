'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { deleteTransaction } from '@/lib/actions/cash-register.actions'
import { DataTable } from '@/components/table/data-table'
import { getCashRegisterColumns, type CombinedCashItem } from './columns'
import { CashRegisterFilters } from '@/components/cash-register/CashRegisterFilters'
import { formatCurrency } from '@/lib/utils/format'
import { useConfirm } from '@/components/common/ConfirmProvider'

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

  const confirm = useConfirm()

  const handleDelete = async (transactionId: string) => {
    if (!(await confirm({ title: 'Are you sure you want to delete this transaction?', destructive: true }))) return

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
      <Card className="border-border p-6">
        <CashRegisterFilters
          branches={branches}
          branchId={initialBranchId}
          type={initialType}
          dataType={initialDataType}
          dateStr={initialDateStr}
        />
      </Card>

      <Card className="p-3 sm:p-4 md:p-6">
        <DataTable<CombinedCashItem, any>
          columns={columns}
          data={filteredItems}
          enablePagination={true}
          enableFilters={false}
          pageSize={10}
          emptyMessage={t('table.noResults')}
        />
      </Card>
    </>
  )
}
