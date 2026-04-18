'use client'

import { useState } from 'react'
import { DataTable } from '@/components/table/data-table'
import { FilterConfig } from '@/components/table/data-table-filters'
import { getBranchColumns, Branch } from './columns'
import { useTranslations } from 'next-intl'
import { deleteBranch } from '@/lib/actions/branches.actions'
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal'

interface BranchesPageClientProps {
  branches: Branch[]
  searchQuery?: string
}

export function BranchesPageClient({ branches, searchQuery }: BranchesPageClientProps) {
  const t = useTranslations()
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    search: searchQuery || '',
  })
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
  const columns = getBranchColumns({
    onDelete: handleDeleteClick,
  })

  return (
    <>
      <DataTable<Branch, any>
        columns={columns}
        data={branches}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={(filterId, value) =>
          setFilterValues((prev) => ({ ...prev, [filterId]: value }))
        }
        enablePagination={true}
        enableFilters={true}
        pageSize={10}
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
