'use client'

import { useState } from 'react'
import { DataTable } from '@/components/table/data-table'
import { FilterConfig } from '@/components/table/data-table-filters'
import { getStudentColumns, Student } from '@/app/[locale]/dashboard/students/columns'
import { useTranslations } from 'next-intl'
import { deleteStudent } from '@/lib/actions/students.actions'
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal'

interface StudentTableWrapperProps {
  students: Student[]
  danceTypes: Array<{ id: string; name: string; studentCount?: number }>
  branches: Array<{ id: string; name: string; studentCount?: number }>
  courses: Array<{ id: string; name: string; branch_id?: string; dance_type_id?: string; studentCount?: number }>
  searchQuery?: string
  hasCredits?: boolean
  danceTypeId?: string
  branchId?: string
  courseId?: string
  filteredDanceTypeId?: string
}

export function StudentTableWrapper({
  students,
  danceTypes,
  branches,
  courses,
  searchQuery,
  hasCredits,
  danceTypeId,
  branchId,
  courseId,
  filteredDanceTypeId,
}: StudentTableWrapperProps) {
  const t = useTranslations()
  const [searchValue, setSearchValue] = useState<string>(searchQuery || '')
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    danceType: danceTypeId || '',
    branch: branchId || '',
    course: courseId || '',
    withCredits: hasCredits ? 'true' : '',
  })
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = (student: Student) => {
    setSelectedStudent(student)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async (reason?: string) => {
    if (!selectedStudent) return

    setIsDeleting(true)
    try {
      const result = await deleteStudent(selectedStudent.id, reason)

      if (result.error) {
        throw new Error(result.error)
      }

      // Reload page to reflect deletion
      window.location.reload()
    } catch (err) {
      throw err
    } finally {
      setIsDeleting(false)
    }
  }

  // Define filters
  const filters: FilterConfig[] = [
    {
      id: 'danceType',
      label: t('students.danceType'),
      type: 'select',
      options: danceTypes.map((dt) => ({ label: dt.name, value: dt.id })),
    },
    {
      id: 'branch',
      label: t('students.branch'),
      type: 'select',
      options: branches.map((b) => ({ label: b.name, value: b.id })),
    },
    {
      id: 'course',
      label: t('students.course'),
      type: 'select',
      options: courses.map((c) => ({ label: c.name, value: c.id })),
    },
  ]

  // Get columns with delete handler
  const columns = getStudentColumns({
    onDelete: handleDeleteClick,
    filteredDanceTypeId,
  })

  return (
    <>
      <DataTable<Student, any>
        columns={columns}
        data={students}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={(filterId, value) =>
          setFilterValues((prev) => ({ ...prev, [filterId]: value }))
        }
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder={t('common.searchStudent')}
        searchableColumns={['first_name', 'last_name', 'email', 'phone']}
        enablePagination={true}
        enableFilters={true}
        pageSize={10}
        emptyMessage={t('students.noStudents')}
      />

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title={t('students.deleteTitle')}
        description={t('students.deleteDescription')}
        itemName={selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : ''}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        withReason={true}
        isLoading={isDeleting}
      />
    </>
  )
}
