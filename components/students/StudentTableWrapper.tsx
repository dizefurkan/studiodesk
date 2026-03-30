'use client'

import { useState, useEffect } from 'react'
import { StudentFilters } from './StudentFilters'
import { StudentTable } from './StudentTable'
import { useStudentColumns } from '@/hooks/useStudentColumns'

interface Student {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  created_at: string
  totalRemainingCredits: number
  enrolledCoursesCount: number
  student_packages?: Array<{
    id: string
    remaining_credits: number
  }>
  course_students?: Array<{
    course_id: string
    course?: {
      id: string
      name: string
    }
  }>
  packageDetails?: Array<{
    id: string
    name: string
    danceType: string
    danceTypeId: string
    remaining: number
  }>
}

interface StudentTableWrapperProps {
  students: Student[]
  danceTypes: Array<{ id: string; name: string; studentCount?: number }>
  branches: Array<{ id: string; name: string; studentCount?: number }>
  courses: Array<{ id: string; name: string; branch_id?: string; dance_type_id?: string; studentCount?: number }>
  searchQuery?: string
  hasCredits?: boolean
  danceTypeId?: string
  branchId?: string
  courseId?: string
  filteredDanceTypeId?: string
}

export function StudentTableWrapper({
  students,
  danceTypes,
  branches,
  courses,
  searchQuery,
  hasCredits,
  danceTypeId,
  branchId,
  courseId,
  filteredDanceTypeId,
}: StudentTableWrapperProps) {
  const { columns, toggleColumn, resetColumns, isLoaded } = useStudentColumns()
  const [mobileViewMode, setMobileViewMode] = useState<'single' | 'expanded'>('expanded')

  // Load mobile view preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('studentTableMobileView')
    if (saved === 'single' || saved === 'expanded') {
      setMobileViewMode(saved)
    }
  }, [])

  // Save mobile view preference to localStorage
  const handleToggleMobileView = (mode: 'single' | 'expanded') => {
    setMobileViewMode(mode)
    localStorage.setItem('studentTableMobileView', mode)
  }

  if (!isLoaded) return <div>Loading...</div>

  return (
    <>
      <StudentFilters
        danceTypes={danceTypes}
        branches={branches}
        courses={courses}
        searchQuery={searchQuery}
        hasCredits={hasCredits}
        danceTypeId={danceTypeId}
        branchId={branchId}
        courseId={courseId}
        viewMode={mobileViewMode}
        onViewModeChange={handleToggleMobileView}
        columns={columns}
        onColumnsToggle={toggleColumn}
        onColumnsReset={resetColumns}
      />

      <div className="mt-6 border-t border-[#E5E7EB] pt-6">
        <StudentTable
          students={students}
          danceTypes={danceTypes}
          branches={branches}
          courses={courses}
          filteredDanceTypeId={filteredDanceTypeId}
          mobileViewMode={mobileViewMode}
        />
      </div>
    </>
  )
}
