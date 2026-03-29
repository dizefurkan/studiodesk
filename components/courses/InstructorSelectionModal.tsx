'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Search } from 'lucide-react'

interface Instructor {
  id: string
  first_name: string
  last_name: string
  instructor_rates?: Array<{
    id: string
    ratio_per_class: number
    branch_id: string
    dance_type_id: string
  }>
}

interface InstructorSelectionModalProps {
  instructors: Instructor[]
  selectedIds: string[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (instructorIds: string[]) => void
  danceTypeName?: string
}

export function InstructorSelectionModal({
  instructors,
  selectedIds,
  isOpen,
  onOpenChange,
  onSelect,
  danceTypeName,
}: InstructorSelectionModalProps) {
  const t = useTranslations()
  const [searchQuery, setSearchQuery] = useState('')
  const [tempSelected, setTempSelected] = useState<string[]>(selectedIds)

  // Filter instructors by search query
  const filteredInstructors = useMemo(() => {
    if (!searchQuery.trim()) return instructors

    const query = searchQuery.toLowerCase()
    return instructors.filter((instructor) =>
      `${instructor.first_name} ${instructor.last_name}`.toLowerCase().includes(query)
    )
  }, [instructors, searchQuery])

  const handleToggle = (instructorId: string) => {
    setTempSelected((prev) =>
      prev.includes(instructorId) ? prev.filter((id) => id !== instructorId) : [...prev, instructorId]
    )
  }

  const handleConfirm = () => {
    onSelect(tempSelected)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setTempSelected(selectedIds)
    onOpenChange(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB]">
          <div>
            <h2 className="text-lg font-bold text-[#111827]">Select Instructors</h2>
            {danceTypeName && <p className="text-sm text-[#6B7280] mt-1">for {danceTypeName}</p>}
          </div>
          <button
            onClick={handleCancel}
            className="text-[#6B7280] hover:text-[#111827] transition-colors"
            title="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b border-[#E5E7EB]">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9CA3AF]" />
            <Input
              type="text"
              placeholder="Search instructors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Instructors List */}
        <div className="flex-1 overflow-y-auto p-6">
          {instructors.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 text-sm">No instructors available for this dance type</p>
            </div>
          ) : filteredInstructors.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 text-sm">No instructors found matching your search</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredInstructors.map((instructor) => {
                const pricePerClass = instructor.instructor_rates?.[0]?.ratio_per_class
                const isSelected = tempSelected.includes(instructor.id)

                return (
                  <label
                    key={instructor.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-[#E5E7EB] hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggle(instructor.id)}
                      className="w-4 h-4 rounded border-[#E5E7EB] cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-[#111827]">
                        {instructor.first_name} {instructor.last_name}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded whitespace-nowrap">
                      ₺{pricePerClass}/session
                    </span>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-6 border-t border-[#E5E7EB] justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="border-[#E5E7EB]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
          >
            Confirm ({tempSelected.length})
          </Button>
        </div>
      </div>
    </div>
  )
}
