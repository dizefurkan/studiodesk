'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Edit2, Trash2 } from 'lucide-react'
import type { Database } from '@/lib/types/database.types'
import { ColumnHeader } from '@/components/table/column-header'

export type DanceType = Database['public']['Tables']['dance_types']['Row']

interface ColumnsProps {
  onDelete: (danceType: DanceType) => void
  visibleColumns?: {
    name?: boolean
    description?: boolean
    actions?: boolean
  }
}

export function getDanceTypeColumns({
  onDelete,
  visibleColumns = {
    name: true,
    description: true,
    actions: true,
  },
}: ColumnsProps): ColumnDef<DanceType>[] {
  const columns: ColumnDef<DanceType>[] = []

  if (visibleColumns.name !== false) {
    columns.push({
      accessorKey: 'name',
      header: () => <ColumnHeader k="name" />,
      cell: ({ row }) => (
        <Link
          href={`/dashboard/dance-types/${row.original.id}`}
          className="font-medium text-foreground hover:text-primary"
        >
          {row.original.name}
        </Link>
      ),
    })
  }

  if (visibleColumns.description !== false) {
    columns.push({
      accessorKey: 'description',
      header: () => <ColumnHeader k="description" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.description ? (
            <span className="line-clamp-2">{row.original.description}</span>
          ) : (
            <span className="text-muted-foreground/70">-</span>
          )}
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
          <Link href={`/dashboard/dance-types/${row.original.id}/edit`}>
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
