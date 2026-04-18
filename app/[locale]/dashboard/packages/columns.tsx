'use client'

import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2 } from 'lucide-react'
import type { Database } from '@/lib/types/database.types'

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
      header: 'Name',
      cell: ({ row }) => {
        const pkg = row.original
        return (
          <Link
            href={`/dashboard/packages/${pkg.id}/edit`}
            className="text-[#4F46E5] hover:underline font-medium"
          >
            {pkg.name}
          </Link>
        )
      },
    },
    {
      accessorKey: 'total_credits',
      header: 'Classes',
      cell: ({ row }) => {
        return <span className="font-medium">{row.original.total_credits}</span>
      },
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => {
        const price = row.original.price || 0
        const formatter = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
        })
        return <span>{formatter.format(price)}</span>
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        return (
          <div className="flex gap-2">
            <Link href={`/dashboard/packages/${row.original.id}/edit`}>
              <Button
                size="sm"
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white h-8"
              >
                <Edit2 size={14} />
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:bg-red-50 hover:text-red-700 h-8"
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
