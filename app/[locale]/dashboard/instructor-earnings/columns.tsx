'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { EarningsEditButton } from '@/components/instructor-earnings/EarningsEditButton'
import { ColumnHeader } from '@/components/table/column-header'

export interface EarningRecord {
  id: string
  amount: number
  created_at: string
  instructors?: {
    first_name: string
    last_name: string
  }
}

interface ColumnContextProps {
  currency: string
}

export function getEarningsColumns({ currency }: ColumnContextProps): ColumnDef<EarningRecord>[] {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  })

  return [
    {
      accessorKey: 'instructors',
      header: () => <ColumnHeader k="instructor" />,
      cell: ({ row }) => {
        const earning = row.original
        const instructor = earning.instructors
        if (!instructor) return 'N/A'
        return (
          <p className="font-medium">
            {instructor.first_name} {instructor.last_name}
          </p>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: () => <ColumnHeader k="date" />,
      cell: ({ row }) => {
        return new Date(row.original.created_at).toLocaleDateString()
      },
    },
    {
      accessorKey: 'amount',
      header: () => <ColumnHeader k="amount" />,
      cell: ({ row }) => {
        return (
          <p className="font-bold text-green-600">
            {formatter.format(row.original.amount)}
          </p>
        )
      },
    },
    {
      id: 'actions',
      header: () => <ColumnHeader k="actions" />,
      cell: ({ row }) => {
        const earning = row.original
        return (
          <EarningsEditButton
            earningsId={earning.id}
            currentAmount={Number(earning.amount)}
          />
        )
      },
    },
  ]
}
