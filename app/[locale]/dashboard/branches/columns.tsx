'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Edit2, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import type { Database } from '@/lib/types/database.types'

export type Branch = Database['public']['Tables']['branches']['Row']

interface ColumnsProps {
  onDelete: (branch: Branch) => void
  visibleColumns?: {
    name?: boolean
    address?: boolean
    phone?: boolean
    created?: boolean
    actions?: boolean
  }
}

export function getBranchColumns({
  onDelete,
  visibleColumns = {
    name: true,
    address: true,
    phone: true,
    created: true,
    actions: true,
  },
}: ColumnsProps): ColumnDef<Branch>[] {
  const columns: ColumnDef<Branch>[] = []

  if (visibleColumns.name !== false) {
    columns.push({
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <Link
          href={`/dashboard/branches/${row.original.id}`}
          className="font-medium text-foreground hover:text-primary"
        >
          {row.original.name}
        </Link>
      ),
    })
  }

  if (visibleColumns.address !== false) {
    columns.push({
      accessorKey: 'address',
      header: 'Address',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.address || '-'}</span>
      ),
    })
  }

  if (visibleColumns.phone !== false) {
    columns.push({
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        row.original.phone ? (
          <a
            href={`tel:${row.original.phone}`}
            className="text-primary hover:underline"
          >
            {row.original.phone}
          </a>
        ) : (
          <span className="text-muted-foreground/70">-</span>
        )
      ),
    })
  }

  if (visibleColumns.created !== false) {
    columns.push({
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {format(new Date(row.original.created_at!), 'MMM dd, yyyy')}
        </span>
      ),
    })
  }

  if (visibleColumns.actions !== false) {
    columns.push({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Link href={`/dashboard/branches/${row.original.id}/edit`}>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:bg-primary/10"
            >
              <Edit2 size={16} />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:bg-red-50"
            onClick={() => onDelete(row.original)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    })
  }

  return columns
}
