'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Trash2, Plus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { deleteInstructorRate } from '@/lib/actions/instructor-rates.actions'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

const ITEMS_PER_PAGE = 10

interface InstructorRate {
  id: string
  ratio_per_class: number
  instructors: {
    id: string
    first_name: string
    last_name: string
  }
  branches: {
    id: string
    name: string
  }
  dance_types: {
    id: string
    name: string
  }
}

interface InstructorRatesTableProps {
  rates: InstructorRate[]
  instructors: Array<{
    id: string
    first_name: string
    last_name: string
    instructor_rates?: Array<{
      id: string
      ratio_per_class: number
      branch_id: string
      dance_type_id: string
    }>
  }>
  onRatesChange?: () => void
  onOpenEdit?: (rateId: string) => void
  onOpenNewForInstructor?: (instructorId: string) => void
}

interface GroupedInstructor {
  id: string
  name: string
  rates: InstructorRate[]
}

export function InstructorRatesTable({
  rates,
  instructors,
  onRatesChange,
  onOpenEdit,
  onOpenNewForInstructor
}: InstructorRatesTableProps) {
  const router = useRouter()
  const t = useTranslations()
  const [loading, setLoading] = useState(false)
  const [expandedInstructors, setExpandedInstructors] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [searchValue, setSearchValue] = useState('')

  // Filter instructors based on search
  const filteredInstructors = (instructors || []).filter((instructor) => {
    const fullName = `${instructor.first_name} ${instructor.last_name}`.toLowerCase()
    return fullName.includes(searchValue.toLowerCase())
  })

  // Calculate pagination
  const totalPages = filteredInstructors ? Math.ceil(filteredInstructors.length / ITEMS_PER_PAGE) : 1
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedInstructors = filteredInstructors ? filteredInstructors.slice(startIndex, endIndex) : []

  const handleDelete = async (rateId: string) => {
    if (!confirm(t('common.confirm') + '?')) return

    setLoading(true)
    try {
      const result = await deleteInstructorRate(rateId)
      if (result.error) {
        alert(result.error)
      } else {
        // Refresh rates without router.refresh()
        if (onRatesChange) {
          await onRatesChange()
        }
      }
    } catch (err) {
      alert('Failed to delete rate')
    } finally {
      setLoading(false)
    }
  }

  const handleEditRate = (rateId: string) => {
    onOpenEdit?.(rateId)
  }

  const handleAddRateForInstructor = (instructorId: string) => {
    onOpenNewForInstructor?.(instructorId)
  }

  const toggleExpand = (instructorId: string) => {
    setExpandedInstructors((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(instructorId)) {
        newSet.delete(instructorId)
      } else {
        newSet.add(instructorId)
      }
      return newSet
    })
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div>
        <input
          type="text"
          placeholder={t('common.search') || 'Search instructors...'}
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value)
            setCurrentPage(1)
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
        />
      </div>

      {/* Datatable */}
      {(!filteredInstructors || filteredInstructors.length === 0) && rates.length === 0 ? (
        <Card className="border-[#E5E7EB] p-12 text-center">
          <p className="text-gray-500">{t('instructorRates.noRates')}</p>
          <p className="text-sm text-gray-400 mt-1">{t('instructorRates.description')}</p>
        </Card>
      ) : (
        <Card className="border-[#E5E7EB] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#111827]">
                    {t('instructorRates.tableHeaders.instructor')}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#111827]">
                    {t('instructorRates.tableHeaders.rates')}
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-[#111827]">
                    {t('instructorRates.tableHeaders.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {paginatedInstructors && paginatedInstructors.map((instructor) => {
                  const instructorRates = rates.filter((rate) => rate.instructors.id === instructor.id)
                  const rateCount = instructorRates.length
                  const isExpanded = expandedInstructors.has(instructor.id)

                  return (
                    <React.Fragment key={instructor.id}>
                      {/* Main row */}
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-[#111827]">
                          {instructor.first_name} {instructor.last_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {t('instructorRates.ratesConfigured', { count: rateCount })}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {rateCount > 0 && (
                            <button
                              onClick={() => toggleExpand(instructor.id)}
                              className="px-3 py-1 text-sm text-[#4F46E5] hover:bg-blue-50 rounded transition-colors inline-flex items-center gap-1"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp size={16} />
                                  {t('instructorRates.hide')}
                                </>
                              ) : (
                                <>
                                  <ChevronDown size={16} />
                                  {t('instructorRates.show')}
                                </>
                              )}
                            </button>
                          )}
                          <Button
                            onClick={() => handleAddRateForInstructor(instructor.id)}
                            size="sm"
                            variant="outline"
                            className="border-[#4F46E5] text-[#4F46E5] hover:bg-blue-50"
                          >
                            <Plus size={14} className="mr-1" />
                            {t('instructorRates.addNew')}
                          </Button>
                        </td>
                      </tr>

                      {/* Expanded Rates */}
                      {isExpanded && rateCount > 0 &&
                        instructorRates.map((rate) => (
                          <tr key={rate.id} className="bg-blue-50/30 hover:bg-blue-50/50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-600 pl-12">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-[#4F46E5] rounded-full"></div>
                                <span>{rate.branches.name} • {rate.dance_types.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-[#111827] font-semibold">
                              {Number(rate.ratio_per_class).toFixed(2)}%
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <button
                                onClick={() => handleEditRate(rate.id)}
                                disabled={loading}
                                className="px-3 py-1 text-sm text-[#4F46E5] hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                              >
                                {t('instructorRates.edit')}
                              </button>
                              <button
                                onClick={() => handleDelete(rate.id)}
                                disabled={loading}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 inline-flex"
                                title="Delete rate"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredInstructors && filteredInstructors.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between border-t border-[#E5E7EB] px-6 py-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
