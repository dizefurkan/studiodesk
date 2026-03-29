'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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

interface InstructorSelectionDrawerProps {
  instructors: Instructor[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function InstructorSelectionDrawer({
  instructors,
  isOpen,
  onOpenChange,
}: InstructorSelectionDrawerProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [isClosing, setIsClosing] = useState(false)

  // Filter instructors by search query
  const filteredInstructors = useMemo(() => {
    if (!searchQuery.trim()) return instructors

    const query = searchQuery.toLowerCase()
    return instructors.filter((instructor) =>
      `${instructor.first_name} ${instructor.last_name}`.toLowerCase().includes(query)
    )
  }, [instructors, searchQuery])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onOpenChange(false)
      setIsClosing(false)
      setSearchQuery('')
    }, 300)
  }

  const handleSelectInstructor = (instructorId: string) => {
    // Navigate to edit mode with selected instructor
    router.push(`/dashboard/instructor-rates?modal=edit&instructor=${instructorId}`)
  }

  const handleAddNewRate = (instructorId: string) => {
    router.push(`/dashboard/instructor-rates?modal=new&instructor=${instructorId}`)
  }

  if (!isOpen && !isClosing) return null

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ease-out ${
          isClosing ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-2/3 lg:w-1/2 bg-white shadow-xl z-50 transition-transform duration-300 ease-out ${
          isClosing ? 'translate-x-full' : 'translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB]">
          <h2 className="text-xl font-bold text-[#111827]">Select Instructor</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-[#E5E7EB]">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search instructors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
        </div>

        {/* Instructors List */}
        <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
          {filteredInstructors.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {instructors.length === 0
                ? 'No instructors available'
                : 'No instructors match your search'}
            </div>
          ) : (
            <div className="divide-y divide-[#E5E7EB]">
              {filteredInstructors.map((instructor) => {
                const ratesCount = instructor.instructor_rates?.length || 0
                return (
                  <div
                    key={instructor.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#111827]">
                          {instructor.first_name} {instructor.last_name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {ratesCount === 0
                            ? 'No rates configured'
                            : `${ratesCount} rate${ratesCount > 1 ? 's' : ''} configured`}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleAddNewRate(instructor.id)}
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap"
                      >
                        {ratesCount === 0 ? 'Add Rate' : 'Edit Rates'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
