'use client'

import { Link, useRouter } from '@/i18n/navigation'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { deletePackage } from '@/lib/actions/packages.actions'
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal'
import { DataTable } from '@/components/table/data-table'
import { FilterConfig, type FilterValues } from '@/components/table/data-table-filters'
import { getPackageColumns } from './columns'
import type { Database } from '@/lib/types/database.types'

type Package = Database['public']['Tables']['packages']['Row']

interface PackagesPageContentProps {
  currency: string
  packages: Package[]
  searchQuery?: string
  currentPage: number
  totalCount: number
  pageSize: number
}

export function PackagesPageContent({
  currency,
  packages,
  searchQuery,
  currentPage,
 totalCount,
  pageSize,
}: PackagesPageContentProps) {
  const t = useTranslations()
  const router = useRouter()
  const [searchValue, setSearchValue] = useState<string>(searchQuery || '')
  const [filterValues, setFilterValues] = useState<FilterValues>({})
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
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

  const filters: FilterConfig[] = []

  const handleDeleteClick = (pkg: Package) => {
    setSelectedPackage(pkg)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async (reason?: string) => {
    if (!selectedPackage) return

    setIsDeleting(true)
    try {
      const result = await deletePackage(selectedPackage.id, reason)

      if (result.error) {
        throw new Error(result.error)
      }

      setDeleteModalOpen(false)
      setSelectedPackage(null)
      router.refresh()
    } catch (err) {
      throw err
    } finally {
      setIsDeleting(false)
    }
  }

  const hasRecords = totalCount > 0 || !!searchQuery
  const createAction = (
    <Button asChild>
      <Link href="/dashboard/packages/new">
        <Plus /> {t('packages.addNew')}
      </Link>
    </Button>
  )

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title={t('packages.title')}
        description={t('packages.description')}
        action={hasRecords ? createAction : undefined}
      />

      {hasRecords ? (
        <Card className="p-3 sm:p-4 md:p-6">
          <DataTable<Package, unknown>
            columns={getPackageColumns({
              onDelete: handleDeleteClick,
              currency,
            })}
            data={packages}
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
            emptyMessage={t('packages.noPackages')}
          />
        </Card>
      ) : (
        <EmptyState
          title={t('emptyStates.packages.title')}
          description={t('emptyStates.packages.description')}
          action={createAction}
        />
      )}

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setSelectedPackage(null)
        }}
        onConfirm={handleDeleteConfirm}
        title={t('packages.deleteTitle')}
        description={t('packages.deleteDescription')}
        itemName={selectedPackage?.name}
        withReason={true}
        isLoading={isDeleting}
      />
    </div>
  )
}
