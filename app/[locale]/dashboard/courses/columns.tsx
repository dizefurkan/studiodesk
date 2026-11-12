'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Edit2, Trash2 } from 'lucide-react'
import { formatTime } from '@/lib/utils/formatTime'

export interface Course {
  id: string
  name: string
  day_of_week: number
  start_time: string
  end_time: string
  branch_id: string
  dance_type_id: string
  branches?: { name: string }
  dance_types?: { name: string }
  course_instructors?: Array<{ instructors?: { id: string; first_name: string; last_name: string } }>
  studentCount?: number
  attendanceCount?: number
}

interface ColumnsProps {
  onDelete: (course: Course) => void
  visibleColumns?: {
    name?: boolean
    branch?: boolean
    danceType?: boolean
    schedule?: boolean
    students?: boolean
    instructors?: boolean
    attendance?: boolean
    actions?: boolean
  }
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function getCourseColumns({
  onDelete,
  visibleColumns = {
    name: true,
    branch: true,
    danceType: true,
    schedule: true,
    students: true,
    instructors: true,
    attendance: true,
    actions: true,
  },
}: ColumnsProps): ColumnDef<Course>[] {
  const columns: ColumnDef<Course>[] = []

  if (visibleColumns.name !== false) {
    columns.push({
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <Link
          href={`/dashboard/courses/${row.original.id}`}
          className="font-medium text-foreground hover:text-primary"
        >
          {row.original.name}
        </Link>
      ),
    })
  }

  if (visibleColumns.branch !== false) {
    columns.push({
      accessorKey: 'branch_id',
      header: 'Branch',
      cell: ({ row }) => (
        <Badge className="bg-primary/10 text-primary">
          {row.original.branches?.name || '-'}
        </Badge>
      ),
    })
  }

  if (visibleColumns.danceType !== false) {
    columns.push({
      accessorKey: 'dance_type_id',
      header: 'Dance Type',
      cell: ({ row }) => (
        <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-200">
          {row.original.dance_types?.name || '-'}
        </Badge>
      ),
    })
  }

  if (visibleColumns.schedule !== false) {
    columns.push({
      id: 'schedule',
      header: 'Schedule',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {DAYS[row.original.day_of_week]} {formatTime(row.original.start_time)} - {formatTime(row.original.end_time)}
        </span>
      ),
    })
  }

  if (visibleColumns.students !== false) {
    columns.push({
      accessorKey: 'studentCount',
      header: 'Students',
      cell: ({ row }) => (
        <Badge className="bg-cyan-50 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-200">
          {row.original.studentCount || 0}
        </Badge>
      ),
    })
  }

  if (visibleColumns.instructors !== false) {
    columns.push({
      id: 'instructors',
      header: 'Instructors',
      cell: ({ row }) => {
        const instructors = row.original.course_instructors || []
        return (
          <div className="flex flex-wrap gap-1">
            {instructors.slice(0, 1).map((ci, idx) => (
              <span key={idx} className="text-xs text-muted-foreground">
                {ci.instructors?.first_name} {ci.instructors?.last_name}
              </span>
            ))}
            {instructors.length > 1 && (
              <span className="text-xs text-muted-foreground">+{instructors.length - 1}</span>
            )}
            {instructors.length === 0 && (
              <span className="text-xs text-muted-foreground/70">-</span>
            )}
          </div>
        )
      },
    })
  }

  if (visibleColumns.attendance !== false) {
    columns.push({
      accessorKey: 'attendanceCount',
      header: 'Attendance',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{row.original.attendanceCount || 0}</span>
      ),
    })
  }

  if (visibleColumns.actions !== false) {
    columns.push({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Link href={`/dashboard/courses/${row.original.id}/edit`}>
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
