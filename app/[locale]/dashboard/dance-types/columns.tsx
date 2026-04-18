'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Edit2, Trash2 } from 'lucide-react'
import type { Database } from '@/lib/types/database.types'

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
      header: 'Name',
      cell: ({ row }) => (
        <Link
          href={`/dashboard/dance-types/${row.original.id}`}
          className="font-medium text-[#111827] hover:text-[#4F46E5]"
        >
          {row.original.name}
        </Link>
      ),
    })
  }

  if (visibleColumns.description !== false) {
    columns.push({
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="text-gray-600 text-sm">
          {row.original.description ? (
            <span className="line-clamp-2">{row.original.description}</span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
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
          <Link href={`/dashboard/dance-types/${row.original.id}/edit`}>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#4F46E5] hover:bg-[#EEF2FF]"
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
