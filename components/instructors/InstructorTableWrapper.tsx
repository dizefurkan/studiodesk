'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/components/table/data-table'
import { FilterConfig } from '@/components/table/data-table-filters'
import { getInstructorColumns, Instructor } from '@/app/[locale]/dashboard/instructors/columns'
import { useTranslations } from 'next-intl'
import { deleteInstructor } from '@/lib/actions/instructors.actions'
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal'

interface InstructorTableWrapperProps {
  instructors: Instructor[]
  danceTypes: Array<{ id: string; name: string }>
  branches: Array<{ id: string; name: string }>
  searchQuery?: string
  danceTypeId?: string
  branchId?: string
  currentPage?: number
  totalCount?: number
  pageSize?: number
}

export function InstructorTableWrapper({
  instructors,
  danceTypes,
  branches,
  searchQuery,
  danceTypeId,
  branchId,
  currentPage = 1,
  totalCount = 0,
  pageSize = 10,
}: InstructorTableWrapperProps) {
  const t = useTranslations()
  const router = useRouter()
  const [searchValue, setSearchValue] = useState<string>(searchQuery || '')
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    danceType: danceTypeId || '',
    branch: branchId || '',
  })
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = (instructor: Instructor) => {
    setSelectedInstructor(instructor)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async (reason?: string) => {
    if (!selectedInstructor) return

    setIsDeleting(true)
    try {
      const result = await deleteInstructor(selectedInstructor.id, reason)

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

  // Define filters
  const filters: FilterConfig[] = [
    {
      id: 'danceType',
      label: t('instructors.danceType'),
      type: 'select',
      options: danceTypes.map((dt) => ({ label: dt.name, value: dt.id })),
    },
    {
      id: 'branch',
      label: t('instructors.branch'),
      type: 'select',
      options: branches.map((b) => ({ label: b.name, value: b.id })),
    },
  ]

  // Get columns with delete handler
  const columns = getInstructorColumns({
    onDelete: handleDeleteClick,
  })

  return (
    <>
      <DataTable<Instructor, any>
        columns={columns}
        data={instructors}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={(filterId, value) =>
          setFilterValues((prev) => ({ ...prev, [filterId]: value }))
        }
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t('common.searchInstructor')}
        enablePagination={true}
        enableFilters={true}
        currentPage={currentPage}
        totalItems={totalCount}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        emptyMessage={t('instructors.noInstructors')}
      />

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title={t('instructors.deleteTitle')}
        description={t('instructors.deleteDescription')}
        itemName={selectedInstructor ? `${selectedInstructor.first_name} ${selectedInstructor.last_name}` : ''}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        withReason={true}
        isLoading={isDeleting}
      />
    </>
  )
}
