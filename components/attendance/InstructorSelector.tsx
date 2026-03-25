'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { X, Search } from 'lucide-react'

interface Instructor {
  id: string
  first_name: string
  last_name: string
}

interface InstructorRate {
  instructor_id: string
  dance_type_id: string
  ratio_per_class: number
}

interface InstructorSelectorProps {
  instructors: Instructor[]
  allInstructors?: Instructor[]
  instructorRates?: InstructorRate[]
  danceTypeId?: string
  editingInstructorId?: string
  selectedReplacementId?: string
  instructorOverrides?: Record<string, string>
  onSave: (replacementId: string) => void
  onClose: () => void
}

const ITEMS_PER_PAGE = 10

export function InstructorSelector({
  instructors,
  allInstructors,
  instructorRates,
  danceTypeId,
  editingInstructorId,
  selectedReplacementId,
  instructorOverrides = {},
  onSave,
  onClose,
}: InstructorSelectorProps) {
  const [tempSelectedId, setTempSelectedId] = useState<string>(selectedReplacementId || '')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  
  // Filter: Show only instructors NOT in the course and NOT already selected as overrides
  const courseInstructorIds = new Set(instructors.map((i) => i.id))
  const usedOverrideIds = new Set(
    Object.entries(instructorOverrides)
      .filter(([key]) => key !== editingInstructorId) // Exclude current override
      .map(([, value]) => value)
  )
  
  const availableInstructors = (allInstructors || []).filter(
    (instructor) => !courseInstructorIds.has(instructor.id) && !usedOverrideIds.has(instructor.id)
  )

  const editingInstructor = instructors.find((i) => i.id === editingInstructorId)

  // Filter by search query
  const filteredInstructors = useMemo(() => {
    return availableInstructors.filter((instructor) => {
      const fullName = `${instructor.first_name} ${instructor.last_name}`.toLowerCase()
      return fullName.includes(searchQuery.toLowerCase())
    })
  }, [availableInstructors, searchQuery])

  // Paginate
  const totalPages = Math.ceil(filteredInstructors.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedInstructors = filteredInstructors.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handleSave = () => {
    onSave(tempSelectedId)
  }

  // Check if instructor has rate for this dance type
  const hasRate = (instructorId: string) => {
    if (!instructorRates || !danceTypeId) return true
    return instructorRates.some(
      (rate) => rate.instructor_id === instructorId && rate.dance_type_id === danceTypeId
    )
  }

  // Get rate amount for this dance type
  const getRateAmount = (instructorId: string) => {
    if (!instructorRates || !danceTypeId) return null
    const rate = instructorRates.find(
      (rate) => rate.instructor_id === instructorId && rate.dance_type_id === danceTypeId
    )
    return rate?.ratio_per_class ?? null
  }

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl mx-4 my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#111827]">
            Replace Instructor: {editingInstructor?.first_name} {editingInstructor?.last_name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Select a different instructor to replace {editingInstructor?.first_name} for this session.
        </p>

        {/* Search Filter */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by instructor name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          />
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto mb-4 border border-[#E5E7EB] rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-[#E5E7EB]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#111827]">Select</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#111827]">Instructor Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#111827]">Rate Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {paginatedInstructors.length > 0 ? (
                paginatedInstructors.map((instructor) => {
                  const rateExists = hasRate(instructor.id)
                  const rateAmount = getRateAmount(instructor.id)

                  return (
                    <tr
                      key={instructor.id}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                        tempSelectedId === instructor.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setTempSelectedId(instructor.id)}
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="radio"
                          name="instructor"
                          value={instructor.id}
                          checked={tempSelectedId === instructor.id}
                          onChange={() => setTempSelectedId(instructor.id)}
                          className="w-4 h-4 text-[#4F46E5] cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-[#111827] font-medium">
                          {instructor.first_name} {instructor.last_name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {rateExists ? (
                          <span className="text-xs text-green-700 font-medium">
                            ✓ Has rate {rateAmount !== null && `(%${rateAmount})`}
                          </span>
                        ) : (
                          <span className="text-xs text-red-700 font-medium">🔴 No rate</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-600">
                    {availableInstructors.length === 0
                      ? 'No available instructors. Either all are assigned to this course or all have been selected as replacements.'
                      : 'No instructors matching your search'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredInstructors.length > 0 && (
          <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
            <span>
              Page {currentPage} of {totalPages} • Showing {paginatedInstructors.length} of {filteredInstructors.length} results
            </span>
            <div className="flex gap-2">
              <Button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="border-[#D1D5DB]"
              >
                Previous
              </Button>
              <Button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="border-[#D1D5DB]"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-[#D1D5DB] text-[#111827]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!tempSelectedId}
            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white disabled:bg-gray-400"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  )
}
