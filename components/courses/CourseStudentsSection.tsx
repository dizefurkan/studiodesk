'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ColumnDef } from '@tanstack/react-table'
import { Trash2 } from 'lucide-react'
import { getCourseStudents, removeStudentFromCourse } from '@/lib/actions/course-students.actions'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { toast } from 'sonner'
import { DataTable } from '@/components/table/data-table'
import { ColumnHeader } from '@/components/table/column-header'

interface CourseStudent {
  id: string
  student_id: string
  joined_at: string
  courses?: {
    dance_type_id: string
  }
  students: {
    id: string
    first_name: string
    last_name: string
    phone?: string
    student_packages?: Array<{
      id: string
      remaining_credits: number
      packages?: {
        id: string
        dance_type_id: string
      }
    }>
  }
}

interface CourseStudentsSectionProps {
  courseId: string
  danceTypeId: string
  onStudentsLoaded?: (count: number) => void
}

export function CourseStudentsSection({ courseId, danceTypeId, onStudentsLoaded }: CourseStudentsSectionProps) {
  const t = useTranslations()
  const [students, setStudents] = useState<CourseStudent[]>([])
  const [loading, setLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  // Load students on mount
  const loadStudents = async () => {
    setIsLoading(true)
    try {
      const result = await getCourseStudents(courseId)
      if (result.data) {
        setStudents(result.data)
        onStudentsLoaded?.(result.data.length)
      }
    } catch (error) {
      console.error('Error loading students:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [courseId])

  const confirm = useConfirm()

  const handleRemoveStudent = async (studentId: string) => {
    if (!(await confirm({ title: t('common.deleteStudentConfirm'), destructive: true }))) return

    setLoading(true)
    try {
      const result = await removeStudentFromCourse(courseId, studentId)
      if (result.success) {
        await loadStudents()
      } else {
        toast.error(result.error || 'Failed to remove student')
      }
    } catch (error) {
      console.error('Error removing student:', error)
      toast.error('Failed to remove student')
    } finally {
      setLoading(false)
    }
  }

  // Get remaining credits for a student for this dance type
  const getStudentCredits = (studentPackages?: CourseStudent['students']['student_packages']) => {
    if (!studentPackages) return '-'
    
    const packageForDanceType = studentPackages.find(
      (pkg) => pkg.packages?.dance_type_id === danceTypeId
    )
    
    return packageForDanceType ? packageForDanceType.remaining_credits : '-'
  }

  const columns: ColumnDef<CourseStudent>[] = [
    {
      id: 'name',
      header: () => <ColumnHeader k="studentName" />,
      cell: ({ row }) => (
        <Link
          href={`/dashboard/students/${row.original.students.id}`}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {row.original.students.first_name} {row.original.students.last_name}
        </Link>
      ),
    },
    {
      id: 'credits',
      header: t('courses.credits'),
      cell: ({ row }) => <Badge variant="secondary">{getStudentCredits(row.original.students.student_packages)}</Badge>,
    },
    {
      id: 'joined',
      header: () => <ColumnHeader k="joined" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{new Date(row.original.joined_at).toLocaleDateString()}</span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Action</span>,
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive"
            aria-label="Remove student"
            onClick={() => handleRemoveStudent(row.original.student_id)}
            disabled={loading}
          >
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <DataTable<CourseStudent, unknown>
      columns={columns}
      data={students}
      loading={isLoading}
      enableSearch={false}
      enableFilters={false}
      enablePagination={false}
      emptyMessage="No students enrolled yet"
    />
  )
}
