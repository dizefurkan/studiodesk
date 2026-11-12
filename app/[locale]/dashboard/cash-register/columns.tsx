'use client'

import { ColumnDef } from '@tanstack/react-table'
import { TrendingUp, TrendingDown, Users, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ColumnHeader } from '@/components/table/column-header'

export interface CombinedCashItem {
  id: string
  type: 'income' | 'expense' | 'earning'
  amount: number
  description: string
  created_at: string
  branches?: { name: string } | null
  instructors?: { first_name: string; last_name: string }
}

interface ColumnContextProps {
  currency: string
  onDelete: (itemId: string) => void
}

export function getCashRegisterColumns({
  currency,
  onDelete,
}: ColumnContextProps): ColumnDef<CombinedCashItem>[] {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  })

  return [
    {
      accessorKey: 'description',
      header: () => <ColumnHeader k="description" />,
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex items-center gap-3">
            {item.type === 'income' ? (
              <TrendingUp className="text-green-600 shrink-0" size={18} />
            ) : item.type === 'expense' ? (
              <TrendingDown className="text-red-600 shrink-0" size={18} />
            ) : (
              <Users className="text-purple-600 shrink-0" size={18} />
            )}
            <div>
              <p className="font-medium text-foreground">{item.description}</p>
              <p className="text-xs text-muted-foreground">{item.branches?.name || 'N/A'}</p>
            </div>
          </div>
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
        const item = row.original
        return (
          <p
            className={`font-bold text-right ${
              item.type === 'income' ? 'text-green-600' : item.type === 'expense' ? 'text-red-600' : 'text-purple-600'
            }`}
          >
            {item.type === 'income' ? '+' : '-'}
            {formatter.format(item.amount)}
          </p>
        )
      },
    },
    {
      id: 'actions',
      header: () => <ColumnHeader k="actions" />,
      cell: ({ row }) => {
        const item = row.original
        // Only show delete button for transactions, not earnings
        if (item.type === 'earning') {
          return <span className="text-xs text-muted-foreground">System</span>
        }
        return (
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 hover:bg-red-50 hover:text-red-700 h-8"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 size={14} />
          </Button>
        )
      },
    },
  ]
}
