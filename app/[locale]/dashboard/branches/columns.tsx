'use client'

import { Link } from '@/i18n/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2 } from 'lucide-react'
import type { Database } from '@/lib/types/database.types'
import { ColumnHeader } from '@/components/table/column-header'
import { FormattedDate } from '@/components/common/FormattedDate'

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
      header: () => <ColumnHeader k="name" />,
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
      header: () => <ColumnHeader k="address" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.address || '-'}</span>
      ),
    })
  }

  if (visibleColumns.phone !== false) {
    columns.push({
      accessorKey: 'phone',
      header: () => <ColumnHeader k="phone" />,
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
      header: () => <ColumnHeader k="created" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          <FormattedDate value={row.original.created_at} />
        </span>
      ),
    })
  }

  if (visibleColumns.actions !== false) {
    columns.push({
      id: 'actions',
      header: () => <ColumnHeader k="actions" />,
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
