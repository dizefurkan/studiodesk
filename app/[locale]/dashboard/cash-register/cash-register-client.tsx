'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Card } from '@/components/ui/card'
import { deleteTransaction } from '@/lib/actions/cash-register.actions'
import { DataTable } from '@/components/table/data-table'
import { getCashRegisterColumns, type CombinedCashItem } from './columns'
import { CashRegisterFilters, type CashFilters } from '@/components/cash-register/CashRegisterFilters'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { toast } from 'sonner'

/** Filters and the list of cash entries (and instructor earnings) for the chosen period. */
export function CashRegisterTable({
  items,
  branches,
  currency,
  filters,
}: {
  items: CombinedCashItem[]
  branches: Array<{ id: string; name: string }>
  currency: string
  filters: CashFilters
}) {
  const t = useTranslations()
  const router = useRouter()
  const confirm = useConfirm()
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (transactionId: string) => {
    if (!(await confirm({ title: t('cashRegister.deleteConfirm'), destructive: true }))) return
    setDeletingId(transactionId)
    const result = await deleteTransaction(transactionId)
    setDeletingId(null)
    if (result.error) {
      toast.error(result.error)
      return
    }
    // Totals come from the server
    router.refresh()
  }

  const categoryLabel = (c: string) => t(`cashCategories.${c}`)
  const columns = getCashRegisterColumns({ currency, categoryLabel, onDelete: handleDelete })

  const q = search.trim().toLocaleLowerCase()
  const visible = q
    ? items.filter(
        (item) =>
          item.description?.toLocaleLowerCase().includes(q) ||
          item.branches?.name?.toLocaleLowerCase().includes(q) ||
          (item.category ? categoryLabel(item.category).toLocaleLowerCase().includes(q) : false)
      )
    : items

  return (
    <>
      <Card className="p-4 sm:p-6">
        <CashRegisterFilters branches={branches} filters={filters} />
      </Card>
      <div className="min-w-0">
        <DataTable<CombinedCashItem, unknown>
          columns={columns}
          data={visible.filter((i) => i.id !== deletingId)}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={t('cashRegister.searchPlaceholder')}
          enablePagination
          enableFilters={false}
          pageSize={20}
          emptyMessage={t('cashRegister.empty')}
        />
      </div>
    </>
  )
}
