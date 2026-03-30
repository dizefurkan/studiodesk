'use client'

import { useState, useEffect } from 'react'
import { InstructorFilters } from './InstructorFilters'
import { InstructorTable } from './InstructorTable'

interface Instructor {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  created_at: string
  branchCount: number
  courseCount: number
  danceTypeCount: number
  branches?: Array<{ id: string; name: string }>
  courses?: Array<{ id: string; name: string }>
  danceTypes?: Array<{ id: string; name: string }>
  branch_instructors?: Array<{ branch_id: string; branches?: { id: string; name: string } }>
  course_instructors?: Array<{ course_id: string }>
  instructor_rates?: Array<{ dance_type_id: string; branch_id: string; dance_types?: { id: string; name: string } }>
}

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
  const [mobileViewMode, setMobileViewMode] = useState<'single' | 'expanded'>('expanded')
  const [isLoaded, setIsLoaded] = useState(false)

  // Load mobile view preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('instructorTableMobileView')
    if (saved === 'single' || saved === 'expanded') {
      setMobileViewMode(saved)
    }
    setIsLoaded(true)
  }, [])

  // Save mobile view preference to localStorage
  const handleToggleMobileView = (mode: 'single' | 'expanded') => {
    setMobileViewMode(mode)
    localStorage.setItem('instructorTableMobileView', mode)
  }

  if (!isLoaded) return <div>Loading...</div>

  return (
    <>
      <InstructorFilters
        danceTypes={danceTypes}
        branches={branches}
        searchQuery={searchQuery}
        danceTypeId={danceTypeId}
        branchId={branchId}
        viewMode={mobileViewMode}
        onViewModeChange={handleToggleMobileView}
      />

      <div className="mt-6 border-t border-[#E5E7EB] pt-6">
        <InstructorTable
          instructors={instructors}
          danceTypes={danceTypes}
          branches={branches}
          mobileViewMode={mobileViewMode}
        />
      </div>
    </>
  )
}
