'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  currentPage: number
  totalCount: number
  pageSize: number
}

export function CoursesPageClient({
  courses,
  branches,
  danceTypes,
  searchQuery,
  currentPage,
  totalCount,
  pageSize,
}: CoursesPageClientProps) {
  const t = useTranslations()
  const router = useRouter()
  const [searchValue, setSearchValue] = useState<string>(searchQuery || '')
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    branch: '',
    danceType: '',
  })
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    const params = new URLSearchParams()
    if (value) params.set('q', value)
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    params.set('page', newPage.toString())
    router.push(`?${params.toString()}`)
  }

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
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t('common.searchCourse')}
        enablePagination={true}
        enableFilters={true}
        currentPage={currentPage}
        totalItems={totalCount}
        pageSize={pageSize}
        onPageChange={handlePageChange}
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
