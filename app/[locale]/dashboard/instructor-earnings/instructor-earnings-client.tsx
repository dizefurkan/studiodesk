'use client'

import { useRouter } from '@/i18n/navigation'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { DataTable } from '@/components/table/data-table'
import { getEarningsColumns, type EarningRecord } from './columns'

interface InstructorEarningsTableProps {
  earnings: EarningRecord[]
  currency: string
  canManage: boolean
  searchQuery?: string
  currentPage: number
  totalCount: number
  pageSize: number
}

export function InstructorEarningsTable({
  earnings: initialEarnings,
  currency,
  canManage,
  searchQuery,
  currentPage,
  totalCount,
  pageSize,
}: InstructorEarningsTableProps) {
  const [searchValue, setSearchValue] = useState<string>(searchQuery || '')
  const router = useRouter()
  const urlParams = useSearchParams()
  const t = useTranslations('instructorEarnings')

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    const params = new URLSearchParams(urlParams.toString())
    if (value) params.set('q', value)
    else params.delete('q')
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(urlParams.toString())
    params.set('page', newPage.toString())
    router.push(`?${params.toString()}`)
  }

  const columns = getEarningsColumns({ currency, canManage })

  return (
    <>
      <Card className="p-3 sm:p-4 md:p-6">
        <DataTable<EarningRecord, unknown>
          columns={columns}
          data={initialEarnings}
          enablePagination={true}
          enableFilters={false}
          currentPage={currentPage}
          totalItems={totalCount}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          searchPlaceholder={t('searchPlaceholder')}
          emptyMessage={t('empty')}
        />
      </Card>
    </>
  )
}
