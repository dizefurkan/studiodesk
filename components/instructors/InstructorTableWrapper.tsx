'use client'

import { useState } from 'react'
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
}

export function InstructorTableWrapper({
  instructors,
  danceTypes,
  branches,
  searchQuery,
  danceTypeId,
  branchId,
}: InstructorTableWrapperProps) {
  const t = useTranslations()
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    search: searchQuery || '',
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
        enablePagination={true}
        enableFilters={true}
        pageSize={10}
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
