'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import { DataTable } from '@/components/table/data-table'
import { getEarningsColumns, type EarningRecord } from './columns'
import { InstructorEarningsFilters } from '@/components/instructor-earnings/EarningsFilters'

interface InstructorEarningsTableProps {
  earnings: EarningRecord[]
  instructors: Array<{ id: string; first_name: string; last_name: string }>
  currency: string
  instructorId?: string
  fromDate?: string
  toDate?: string
}

export function InstructorEarningsTable({
  earnings: initialEarnings,
  instructors,
  currency,
  instructorId: initialInstructorId,
  fromDate: initialFromDate,
  toDate: initialToDate,
}: InstructorEarningsTableProps) {
  const [filterValues, setFilterValues] = useState({
    search: '',
  })

  const columns = getEarningsColumns({
    currency,
  })

  // Filter by search (instructor name)
  const filteredEarnings = initialEarnings.filter((earning) => {
    const searchLower = filterValues.search.toLowerCase()
    const instructorName =
      `${earning.instructors?.first_name} ${earning.instructors?.last_name}`.toLowerCase() || ''
    return instructorName.includes(searchLower)
  })

  return (
    <>
      {/* Filters Card */}
      <Card className="border-[#E5E7EB] p-6">
        <InstructorEarningsFilters
          instructors={instructors}
          instructorId={initialInstructorId}
          fromDate={initialFromDate}
          toDate={initialToDate}
        />
      </Card>

      {/* Table or Empty State */}
      {filteredEarnings.length === 0 ? (
        <Card className="border-[#E5E7EB] p-12 text-center">
          <div className="text-gray-500">
            <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No earnings records found</p>
            <p className="text-sm mt-1">Complete course sessions to generate instructor earnings</p>
          </div>
        </Card>
      ) : (
        <Card className="border-[#E5E7EB] p-3 sm:p-4 md:p-6">
          <DataTable<EarningRecord, any>
            columns={columns}
            data={filteredEarnings}
            enablePagination={true}
            enableFilters={false}
            pageSize={10}
            emptyMessage="No earnings found"
          />
        </Card>
      )}
    </>
  )
}
