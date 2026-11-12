'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { DataTable } from '@/components/table/data-table'
import { getEarningsColumns, type EarningRecord } from './columns'
import { InstructorEarningsFilters } from '@/components/instructor-earnings/EarningsFilters'

interface InstructorEarningsTableProps {
  earnings: EarningRecord[]
  instructors: Array<{ id: string; first_name: string; last_name: string }>
  currency: string
  searchQuery?: string
  currentPage: number
  totalCount: number
  pageSize: number
}

export function InstructorEarningsTable({
  earnings: initialEarnings,
  instructors,
  currency,
  searchQuery,
  currentPage,
  totalCount,
  pageSize,
}: InstructorEarningsTableProps) {
  const [searchValue, setSearchValue] = useState<string>(searchQuery || '')
  const router = useRouter()

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    const params = new URLSearchParams()
    if (value) params.set('q', value)
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    params.set('page', newPage.toString())
    router.push(`?${params.toString()}`)
  }

  const columns = getEarningsColumns({
    currency,
  })

  return (
    <>
      <Card className="p-3 sm:p-4 md:p-6">
        <DataTable<EarningRecord, any>
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
          searchPlaceholder="Search instructors..."
          emptyMessage="No earnings found"
        />
      </Card>
    </>
  )
}
