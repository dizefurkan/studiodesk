'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Package as PackageIcon } from 'lucide-react'
import { getPackages, deletePackage } from '@/lib/actions/packages.actions'
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal'
import { DataTable } from '@/components/table/data-table'
import { FilterConfig } from '@/components/table/data-table-filters'
import { getPackageColumns } from './columns'
import type { Database } from '@/lib/types/database.types'

type Package = Database['public']['Tables']['packages']['Row']

interface PackagesPageContentProps {
  currency: string
}

export function PackagesPageContent({ currency }: PackagesPageContentProps) {
  const t = useTranslations()
  const [packages, setPackages] = useState<Package[]>([])
  const [error, setError] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [filterValues, setFilterValues] = useState({ search: '' })

  useEffect(() => {
    loadPackages()
  }, [])

  async function loadPackages() {
    setError(null)
    const result = await getPackages()

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setPackages(result.data)
    }
  }

  const filters: FilterConfig[] = [
    {
      id: 'search',
      label: t('common.search'),
      type: 'text',
      placeholder: t('packages.searchPlaceholder') || 'Search packages...',
    },
  ]

  const filteredPackages = packages.filter((pkg) => {
    const searchLower = filterValues.search.toLowerCase()
    return pkg.name?.toLowerCase().includes(searchLower) || false
  })


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

      setPackages(packages.filter((p) => p.id !== selectedPackage.id))
      setDeleteModalOpen(false)
      setSelectedPackage(null)
    } catch (err) {
      throw err
    } finally {
      setIsDeleting(false)
    }
  }

  const columns = getPackageColumns({
    onDelete: handleDeleteClick,
    currency,
  })

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#111827]">{t('packages.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">{t('packages.description')}</p>
        </div>
        <Link href="/dashboard/packages/new" className="inline-block w-fit">
          <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2 text-sm md:text-base h-9 md:h-10">
            <Plus size={20} />
            {t('packages.addNew')}
          </Button>
        </Link>
      </div>

      {/* Content */}
      {error && (
        <Card className="border-red-200 bg-red-50 p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </Card>
      )}

      {filteredPackages.length === 0 ? (
        <Card className="border-[#E5E7EB] p-6 sm:p-8 md:p-12 text-center">
          <div className="text-gray-500">
            <PackageIcon size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">{t('packages.noPackages')}</p>
            <p className="text-sm mt-1">{t('packages.getStarted')}</p>
          </div>
        </Card>
      ) : (
        <Card className="border-[#E5E7EB] p-3 sm:p-4 md:p-6">
          <DataTable<Package, any>
            columns={columns}
            data={filteredPackages}
            filters={filters}
            filterValues={filterValues}
            onFilterChange={(filterId, value) =>
              setFilterValues((prev) => ({ ...prev, [filterId]: value }))
            }
            enablePagination={true}
            enableFilters={true}
            pageSize={10}
            emptyMessage={t('packages.noPackages')}
          />
        </Card>
      )}

      {/* Delete Confirmation Modal */}
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
