'use client'

import { useState } from 'react'
import { DataTable } from '@/components/table/data-table'
import { FilterConfig } from '@/components/table/data-table-filters'
import { getCourseColumns, Course } from './columns'
import { useTranslations } from 'next-intl'
import { deleteCourse } from '@/lib/actions/courses.actions'
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal'

interface CoursesPageClientProps {
  courses: Course[]
  branches: Array<{ id: string; name: string }>
  danceTypes: Array<{ id: string; name: string }>
  searchQuery?: string
  branchId?: string
  danceTypeId?: string
}

export function CoursesPageClient({
  courses,
  branches,
  danceTypes,
  searchQuery,
  branchId,
  danceTypeId,
}: CoursesPageClientProps) {
  const t = useTranslations()
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    search: searchQuery || '',
    branch: branchId || '',
    danceType: danceTypeId || '',
  })
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = (course: Course) => {
    setSelectedCourse(course)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async (reason?: string) => {
    if (!selectedCourse) return

    setIsDeleting(true)
    try {
      const result = await deleteCourse(selectedCourse.id, reason)

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
      id: 'search',
      label: t('common.search'),
      type: 'text',
      placeholder: t('common.searchCourse'),
    },
    {
      id: 'branch',
      label: t('courses.branch'),
      type: 'select',
      options: branches.map((b) => ({ label: b.name, value: b.id })),
    },
    {
      id: 'danceType',
      label: t('courses.danceType'),
      type: 'select',
      options: danceTypes.map((dt) => ({ label: dt.name, value: dt.id })),
    },
  ]

  // Get columns with delete handler
  const columns = getCourseColumns({
    onDelete: handleDeleteClick,
  })

  return (
    <>
      <DataTable<Course, any>
        columns={columns}
        data={courses}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={(filterId, value) =>
          setFilterValues((prev) => ({ ...prev, [filterId]: value }))
        }
        enablePagination={true}
        enableFilters={true}
        pageSize={10}
        emptyMessage={t('courses.noCourses')}
      />

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title={t('courses.deleteTitle')}
        description={t('courses.deleteDescription')}
        itemName={selectedCourse?.name || ''}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        withReason={true}
        isLoading={isDeleting}
      />
    </>
  )
}
