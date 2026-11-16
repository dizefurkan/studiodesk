'use client'

import { useRouter } from '@/i18n/navigation'
import { useState } from 'react'
import { DataTable } from '@/components/table/data-table'
import { FilterConfig, type FilterValue } from '@/components/table/data-table-filters'
import { getStudentColumns, Student } from '@/app/[locale]/dashboard/students/columns'
import { useTranslations } from 'next-intl'
import { deleteStudent } from '@/lib/actions/students.actions'
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { StudentStatusFilter } from '@/lib/actions/students.actions'

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
  currentPage?: number
  totalCount?: number
  pageSize?: number
  status?: StudentStatusFilter
  statusCounts?: { active: number; passive: number }
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
  currentPage = 1,
  totalCount = 0,
  pageSize = 10,
  status = 'active',
  statusCounts,
}: StudentTableWrapperProps) {
  const t = useTranslations()
  const router = useRouter()
  const [searchValue, setSearchValue] = useState<string>(searchQuery || '')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
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

      setDeleteModalOpen(false)
      router.refresh()
    } catch (err) {
      throw err
    } finally {
      setIsDeleting(false)
    }
  }

  // Active is the default; other statuses travel in the URL
  const withStatus = (params: URLSearchParams, value: StudentStatusFilter = status) => {
    if (value !== 'active') params.set('status', value)
    return params
  }

  const handleStatusChange = (value: string) => {
    if (!value) return
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    withStatus(params, value as StudentStatusFilter)
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  // Handle search change - update URL param
  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    const params = withStatus(new URLSearchParams())
    if (value) params.set('q', value)
    params.set('page', '1') // Reset to first page on search change
    router.push(`?${params.toString()}`)
  }

  // Handle page change - update URL param
  const handlePageChange = (newPage: number) => {
    const params = withStatus(new URLSearchParams())
    if (searchQuery) params.set('q', searchQuery)
    if (filterValues.danceType) params.set('danceType', filterValues.danceType)
    if (filterValues.branch) params.set('branch', filterValues.branch)
    if (filterValues.course) params.set('course', filterValues.course)
    if (filterValues.withCredits) params.set('withCredits', filterValues.withCredits)
    params.set('page', newPage.toString())
    router.push(`?${params.toString()}`)
  }

  // Handle filter change - update URL param
  const handleFilterChange = (filterId: string, value: FilterValue) => {
    const newFilterValues = { ...filterValues, [filterId]: typeof value === 'string' ? value : '' }
    setFilterValues(newFilterValues)
    
    const params = withStatus(new URLSearchParams())
    if (searchQuery) params.set('q', searchQuery)
    if (newFilterValues.danceType) params.set('danceType', newFilterValues.danceType)
    if (newFilterValues.branch) params.set('branch', newFilterValues.branch)
    if (newFilterValues.course) params.set('course', newFilterValues.course)
    if (newFilterValues.withCredits) params.set('withCredits', newFilterValues.withCredits)
    params.set('page', '1') // Reset to first page on filter change
    router.push(`?${params.toString()}`)
  }

  // Handle clear filters - reset all filters and URL
  const handleClearFilters = () => {
    setFilterValues({
      danceType: '',
      branch: '',
      course: '',
      withCredits: '',
    })
    
    const params = withStatus(new URLSearchParams())
    if (searchQuery) params.set('q', searchQuery)
    params.set('page', '1')
    router.push(`?${params.toString()}`)
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

  const statusOptions: { value: StudentStatusFilter; count?: number }[] = [
    { value: 'active', count: statusCounts?.active },
    { value: 'passive', count: statusCounts?.passive },
    { value: 'all', count: statusCounts ? statusCounts.active + statusCounts.passive : undefined },
  ]

  return (
    <>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={status}
        onValueChange={handleStatusChange}
        aria-label={t('studentStatus.filterLabel')}
        className="mb-4"
      >
        {statusOptions.map((o) => (
          <ToggleGroupItem key={o.value} value={o.value} className="px-3">
            {t(`studentStatus.${o.value}`)}
            {o.count !== undefined && <span className="tabular-nums text-muted-foreground">{o.count}</span>}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <DataTable<Student, unknown>
        columns={columns}
        data={students}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t('common.searchStudent')}
        enablePagination={true}
        enableFilters={true}
        currentPage={currentPage}
        totalItems={totalCount}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        emptyMessage={status === 'passive' ? t('studentStatus.noPassive') : t('students.noStudents')}
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
