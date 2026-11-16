'use client'

import { Link } from '@/i18n/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2 } from 'lucide-react'
import type { Database } from '@/lib/types/database.types'
import { ColumnHeader } from '@/components/table/column-header'
import { getLocaleForCurrency } from '@/lib/utils/format'

type Package = Database['public']['Tables']['packages']['Row']

interface ColumnContextProps {
  onDelete: (pkg: Package) => void
  currency: string
}

export function getPackageColumns({
  onDelete,
  currency,
}: ColumnContextProps): ColumnDef<Package>[] {
  return [
    {
      accessorKey: 'name',
      header: () => <ColumnHeader k="name" />,
      cell: ({ row }) => {
        const pkg = row.original
        return (
          <Link
            href={`/dashboard/packages/${pkg.id}/edit`}
            className="text-primary hover:underline font-medium"
          >
            {pkg.name}
          </Link>
        )
      },
    },
    {
      accessorKey: 'total_credits',
      header: () => <ColumnHeader k="classes" />,
      cell: ({ row }) => {
        return <span className="font-medium">{row.original.total_credits}</span>
      },
    },
    {
      accessorKey: 'price',
      header: () => <ColumnHeader k="price" />,
      cell: ({ row }) => {
        const price = row.original.price || 0
        const formatter = new Intl.NumberFormat(getLocaleForCurrency(currency), {
          style: 'currency',
          currency: currency,
        })
        return <span>{formatter.format(price)}</span>
      },
    },
    {
      id: 'actions',
      header: () => <ColumnHeader k="actions" />,
      cell: ({ row }) => {
        return (
          <div className="flex gap-2">
            <Link href={`/dashboard/packages/${row.original.id}/edit`}>
              <Button
                size="sm"
                className="h-8"
              >
                <Edit2 size={14} />
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8"
              onClick={() => onDelete(row.original)}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        )
      },
    },
  ]
}
