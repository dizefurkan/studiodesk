'use client'

import { Link } from '@/i18n/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2 } from 'lucide-react'
import { StudentPopover } from '@/components/students/StudentPopover'
import { ColumnHeader } from '@/components/table/column-header'
import { FormattedDate } from '@/components/common/FormattedDate'

export interface Student {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  created_at: string
  totalRemainingCredits: number
  enrolledCoursesCount: number
  student_packages?: Array<{
    id: string
    remaining_credits: number
  }>
  course_students?: Array<{
    course_id: string
    course?: {
      id: string
      name: string
    }
  }>
  packageDetails?: Array<{
    id: string
    name: string
    danceType: string
    danceTypeId?: string
    remaining: number
  }>
}

interface ColumnsProps {
  onDelete: (student: Student) => void
  filteredDanceTypeId?: string
  visibleColumns?: {
    name?: boolean
    email?: boolean
    phone?: boolean
    credits?: boolean
    courses?: boolean
    joined?: boolean
    actions?: boolean
  }
}

export function getStudentColumns({
  onDelete,
  filteredDanceTypeId,
  visibleColumns = {
    name: true,
    email: true,
    phone: true,
    credits: true,
    courses: true,
    joined: true,
    actions: true,
  },
}: ColumnsProps): ColumnDef<Student>[] {
  const columns: ColumnDef<Student>[] = []

  if (visibleColumns.name !== false) {
    columns.push({
      accessorKey: 'first_name',
      header: () => <ColumnHeader k="name" />,
      cell: ({ row }) => (
        <Link
          href={`/dashboard/students/${row.original.id}`}
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

  if (visibleColumns.credits !== false) {
    columns.push({
      accessorKey: 'totalRemainingCredits',
      header: () => <ColumnHeader k="credits" />,
      cell: ({ row }) => (
        <StudentPopover
          type="credits"
          credits={row.original.totalRemainingCredits}
          packageDetails={row.original.packageDetails}
          filteredDanceTypeId={filteredDanceTypeId}
        />
      ),
    })
  }

  if (visibleColumns.courses !== false) {
    columns.push({
      accessorKey: 'enrolledCoursesCount',
      header: () => <ColumnHeader k="courses" />,
      cell: ({ row }) => {
        const courses = new Map<string, string>()
        row.original.course_students?.forEach((cs) => {
          if (cs.course) {
            courses.set(cs.course.id, cs.course.name)
          }
        })
        const courseList = Array.from(courses).map(([id, name]) => ({
          id,
          name,
        }))
        return (
          <StudentPopover
            type="courses"
            courses={courseList}
          />
        )
      },
    })
  }

  if (visibleColumns.joined !== false) {
    columns.push({
      accessorKey: 'created_at',
      header: () => <ColumnHeader k="joined" />,
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
          <Link href={`/dashboard/students/${row.original.id}/edit`}>
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
            className="text-destructive hover:bg-destructive/10"
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
