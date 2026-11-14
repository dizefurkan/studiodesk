'use client'

import { Link } from '@/i18n/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit2, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ColumnHeader } from '@/components/table/column-header'

export interface Instructor {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  created_at: string
  branchCount: number
  courseCount: number
  danceTypeCount: number
  branches?: Array<{ id: string; name: string }>
  courses?: Array<{ id: string; name: string }>
  danceTypes?: Array<{ id: string; name: string }>
}

interface ColumnsProps {
  onDelete: (instructor: Instructor) => void
  visibleColumns?: {
    name?: boolean
    email?: boolean
    phone?: boolean
    courses?: boolean
    danceTypes?: boolean
    branches?: boolean
    joined?: boolean
    actions?: boolean
  }
}

export function getInstructorColumns({
  onDelete,
  visibleColumns = {
    name: true,
    email: true,
    phone: true,
    courses: true,
    danceTypes: true,
    branches: true,
    joined: true,
    actions: true,
  },
}: ColumnsProps): ColumnDef<Instructor>[] {
  const columns: ColumnDef<Instructor>[] = []

  if (visibleColumns.name !== false) {
    columns.push({
      accessorKey: 'first_name',
      header: () => <ColumnHeader k="name" />,
      cell: ({ row }) => (
        <Link
          href={`/dashboard/instructors/${row.original.id}`}
          className="font-medium text-foreground hover:text-primary"
        >
          {row.original.first_name} {row.original.last_name}
        </Link>
      ),
    })
  }

  if (visibleColumns.email !== false) {
    columns.push({
      accessorKey: 'email',
      header: () => <ColumnHeader k="email" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground truncate">{row.original.email}</span>
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

  if (visibleColumns.courses !== false) {
    columns.push({
      accessorKey: 'courseCount',
      header: () => <ColumnHeader k="courses" />,
      cell: ({ row }) => (
        <Badge className="bg-primary/10 text-primary">
          {row.original.courseCount}
        </Badge>
      ),
    })
  }

  if (visibleColumns.danceTypes !== false) {
    columns.push({
      accessorKey: 'danceTypeCount',
      header: () => <ColumnHeader k="danceTypes" />,
      cell: ({ row }) => (
        <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-200">
          {row.original.danceTypeCount}
        </Badge>
      ),
    })
  }

  if (visibleColumns.branches !== false) {
    columns.push({
      id: 'branches',
      header: () => <ColumnHeader k="branches" />,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.branches?.slice(0, 2).map((branch) => (
            <Badge
              key={branch.id}
              className="bg-cyan-50 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-200 text-xs"
            >
              {branch.name}
            </Badge>
          ))}
          {row.original.branches && row.original.branches.length > 2 && (
            <span className="text-xs text-muted-foreground">
              +{row.original.branches.length - 2}
            </span>
          )}
        </div>
      ),
    })
  }

  if (visibleColumns.joined !== false) {
    columns.push({
      accessorKey: 'created_at',
      header: () => <ColumnHeader k="joined" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {format(new Date(row.original.created_at), 'MMM dd, yyyy')}
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
          <Link href={`/dashboard/instructors/${row.original.id}/edit`}>
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
