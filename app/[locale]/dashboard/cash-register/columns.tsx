'use client'

import { ColumnDef } from '@tanstack/react-table'
import { TrendingUp, TrendingDown, Users, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ColumnHeader } from '@/components/table/column-header'
import { getLocaleForCurrency } from '@/lib/utils/format'
import { FormattedDate } from '@/components/common/FormattedDate'

export interface CombinedCashItem {
  id: string
  type: 'income' | 'expense' | 'earning'
  amount: number
  /** Cash register category; earnings rows have none */
  category?: string
  description: string | null
  created_at: string
  branches?: { name: string } | null
  instructors?: { first_name: string; last_name: string }
}

interface ColumnContextProps {
  currency: string
  /** Label of a category key */
  categoryLabel: (category: string) => string
  onDelete: (itemId: string) => void
}

export function getCashRegisterColumns({
  currency,
  categoryLabel,
  onDelete,
}: ColumnContextProps): ColumnDef<CombinedCashItem>[] {
  const formatter = new Intl.NumberFormat(getLocaleForCurrency(currency), {
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
            <div className="min-w-0">
              {/* Category as the title, the description (or note) under it */}
              <p className="font-medium text-foreground">
                {item.category ? categoryLabel(item.category) : item.description}
              </p>
              {item.category && item.description && (
                <p className="truncate text-sm text-foreground/80">{item.description}</p>
              )}
              <p className="text-xs text-muted-foreground">{item.branches?.name || <ColumnHeader k="notAvailable" />}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: () => <ColumnHeader k="date" />,
      cell: ({ row }) => {
        return <FormattedDate value={row.original.created_at} />
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
          return <span className="text-xs text-muted-foreground"><ColumnHeader k="system" /></span>
        }
        return (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 size={14} />
          </Button>
        )
      },
    },
  ]
}
