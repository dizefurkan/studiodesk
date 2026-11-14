'use client'

import { useRouter } from '@/i18n/navigation'
import { useState } from 'react'
import { DataTable } from '@/components/table/data-table'
import { FilterConfig, type FilterValues } from '@/components/table/data-table-filters'
import { getBranchColumns, Branch } from './columns'
import { useTranslations } from 'next-intl'
import { deleteBranch } from '@/lib/actions/branches.actions'
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal'

interface BranchesPageClientProps {
  branches: Branch[]
  searchQuery?: string
  currentPage: number
  totalCount: number
  pageSize: number
}

export function BranchesPageClient({
  branches,
  searchQuery,
  currentPage,
  totalCount,
  pageSize,
}: BranchesPageClientProps) {
  const t = useTranslations()
  const router = useRouter()
  const [searchValue, setSearchValue] = useState<string>(searchQuery || '')
  const [filterValues, setFilterValues] = useState<FilterValues>({})
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
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

  const handleDeleteClick = (branch: Branch) => {
    setSelectedBranch(branch)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async (reason?: string) => {
    if (!selectedBranch) return

    setIsDeleting(true)
    try {
      const result = await deleteBranch(selectedBranch.id, reason)

      if (result.error) {
        throw new Error(result.error)
      }

      // Reload page to reflect deletion
      setDeleteModalOpen(false)
      router.refresh()
    } catch (err) {
      throw err
    } finally {
      setIsDeleting(false)
    }
  }

  // Define filters
  const filters: FilterConfig[] = []

  // Get columns with delete handler
  const columns = getBranchColumns({
    onDelete: handleDeleteClick,
  })

  return (
    <>
      <DataTable<Branch, unknown>
        columns={columns}
        data={branches}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={(filterId, value) =>
          setFilterValues((prev) => ({ ...prev, [filterId]: value }))
        }
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t('common.searchBranch')}
        enablePagination={true}
        enableFilters={true}
        currentPage={currentPage}
        totalItems={totalCount}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        emptyMessage={t('branches.noBranches')}
      />

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title={t('branches.deleteTitle')}
        description={t('branches.deleteDescription')}
        itemName={selectedBranch?.name || ''}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        withReason={true}
        isLoading={isDeleting}
      />
    </>
  )
}
