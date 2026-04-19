'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/components/table/data-table'
import { FilterConfig } from '@/components/table/data-table-filters'
import { getDanceTypeColumns, DanceType } from './columns'
import { useTranslations } from 'next-intl'
import { deleteDanceType } from '@/lib/actions/dance-types.actions'
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal'

interface DanceTypesPageClientProps {
  danceTypes: DanceType[]
  searchQuery?: string
  currentPage: number
  totalCount: number
  pageSize: number
}

export function DanceTypesPageClient({
  danceTypes,
  searchQuery,
  currentPage,
  totalCount,
  pageSize,
}: DanceTypesPageClientProps) {
  const t = useTranslations()
  const router = useRouter()
  const [searchValue, setSearchValue] = useState<string>(searchQuery || '')
  const [filterValues, setFilterValues] = useState<Record<string, any>>({})
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedDanceType, setSelectedDanceType] = useState<DanceType | null>(null)
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

  const handleDeleteClick = (danceType: DanceType) => {
    setSelectedDanceType(danceType)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async (reason?: string) => {
    if (!selectedDanceType) return

    setIsDeleting(true)
    try {
      const result = await deleteDanceType(selectedDanceType.id, reason)

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
  const filters: FilterConfig[] = []

  // Get columns with delete handler
  const columns = getDanceTypeColumns({
    onDelete: handleDeleteClick,
  })

  return (
    <>
      <DataTable<DanceType, any>
        columns={columns}
        data={danceTypes}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={(filterId, value) =>
          setFilterValues((prev) => ({ ...prev, [filterId]: value }))
        }
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t('common.search')}
        enablePagination={true}
        enableFilters={true}
        currentPage={currentPage}
        totalItems={totalCount}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        emptyMessage={t('danceTypes.noDanceTypes')}
      />

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title={t('danceTypes.deleteTitle')}
        description={t('danceTypes.deleteDescription')}
        itemName={selectedDanceType?.name || ''}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        withReason={true}
        isLoading={isDeleting}
      />
    </>
  )
}
