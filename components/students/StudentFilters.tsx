'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Search, RotateCcw } from 'lucide-react'
import { SelectDropdown } from '@/components/ui/select-dropdown'

interface StudentFiltersProps {
  danceTypes: Array<{ id: string; name: string; studentCount?: number }>
  branches: Array<{ id: string; name: string; studentCount?: number }>
  courses: Array<{ id: string; name: string; branch_id?: string; dance_type_id?: string; studentCount?: number }>
  searchQuery?: string
  hasCredits?: boolean
  danceTypeId?: string
  branchId?: string
  courseId?: string
}

export function StudentFilters({
  danceTypes,
  branches,
  courses,
  searchQuery = '',
  hasCredits,
  danceTypeId,
  branchId,
  courseId,
}: StudentFiltersProps) {
  const t = useTranslations()
  const router = useRouter()
  const [search, setSearch] = useState(searchQuery)

  const buildUrl = (filters: Record<string, string | boolean | null | undefined>) => {
    const params = new URLSearchParams()
    if (filters.search && typeof filters.search === 'string') params.set('q', filters.search)
    if (filters.hasCredits && typeof filters.hasCredits === 'boolean') params.set('hasCredits', 'true')
    if (filters.danceType && typeof filters.danceType === 'string') params.set('danceType', filters.danceType)
    if (filters.branch && typeof filters.branch === 'string') params.set('branch', filters.branch)
    if (filters.course && typeof filters.course === 'string') params.set('course', filters.course)
    return `/dashboard/students?${params.toString()}`
  }

  const handleSearch = () => {
    router.push(
      buildUrl({
        search,
        hasCredits: hasCredits ? true : null,
        danceType: danceTypeId,
        branch: branchId,
        course: courseId,
      })
    )
  }

  const handleReset = () => {
    setSearch('')
    router.push('/dashboard/students')
  }

  const hasActiveFilters = hasCredits || danceTypeId || courseId || branchId || search

  // Compute filtered dance types based on selected branch
  const filteredDanceTypes = danceTypes.filter(dt => {
    // If course is already selected, show all dance types (but field will be disabled)
    // If branch is selected, only show dance types that have courses in that branch
    if (branchId) {
      const hasCoursesInBranch = courses.some(c => c.branch_id === branchId && c.dance_type_id === dt.id)
      // Only include if it has courses in selected branch and has students (if filters are active)
      return hasCoursesInBranch && (!hasActiveFilters || dt.studentCount! > 0)
    }
    // If no branch selected, only show dance types with students when filters are active, or show all otherwise
    return !hasActiveFilters || dt.studentCount! > 0
  })

  // Compute filtered branches based on selected dance type
  const filteredBranches = branches.filter(b => {
    // If dance type is selected, only show branches that have courses in that dance type
    if (danceTypeId) {
      const hasCoursesWithDanceType = courses.some(c => c.branch_id === b.id && c.dance_type_id === danceTypeId)
      // Only include if it has courses with selected dance type and has students (if filters are active)
      return hasCoursesWithDanceType && (!hasActiveFilters || b.studentCount! > 0)
    }
    // If no dance type selected, only show branches with students when filters are active, or show all otherwise
    return !hasActiveFilters || b.studentCount! > 0
  })

  // Compute filtered courses based on selected branch and/or dance type
  const filteredCourses = courses.filter(c => {
    // If branch is selected, only show courses from that branch
    if (branchId && c.branch_id !== branchId) return false
    
    // If dance type is selected, only show courses of that dance type
    if (danceTypeId && c.dance_type_id !== danceTypeId) return false
    
    // If any filter is active, hide courses with 0 students
    if (hasActiveFilters && (!c.studentCount || c.studentCount === 0)) return false
    
    return true
  })

  // Get the selected course's branch and dance type (for display when locked)
  const selectedCourse = courseId ? courses.find(c => c.id === courseId) : null
  const courseBranchId = selectedCourse?.branch_id
  const courseDanceTypeId = selectedCourse?.dance_type_id

  // Get locked branch and dance type names for display
  const lockedBranch = courseBranchId ? branches.find(b => b.id === courseBranchId)?.name : null
  const lockedDanceType = courseDanceTypeId ? danceTypes.find(dt => dt.id === courseDanceTypeId)?.name : null

  return (
    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
      <div className="relative flex-1 md:flex-initial md:w-64 h-10 flex items-center">
        <Search 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
          size={18}
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder={t('common.searchStudent')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch()
          }}
          aria-label="Search students by name or email"
          className="w-full h-10 pl-10 pr-3 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-0 transition-all"
        />
      </div>

      {/* Filters Container */}
      <div className="flex flex-1 md:flex-initial gap-2 md:gap-2 flex-wrap md:flex-nowrap items-center">
        {/* Dance Type Filter - Locked if course is selected */}
        {courseId && lockedDanceType ? (
          <div className="px-3 h-10 border border-[#E5E7EB] rounded-lg bg-gray-50 flex items-center text-sm text-gray-600 whitespace-nowrap">
            <span className="font-medium">{lockedDanceType}</span>
          </div>
        ) : (
          <SelectDropdown
            placeholder={t('filters.danceType')}
            value={danceTypeId || ''}
            onChange={(value) => {
              // When dance type changes, clear the course filter if selected course doesn't match new dance type
              const newDanceTypeId = value || null
              const shouldClearCourse = courseId && newDanceTypeId && 
                !courses.some(c => c.id === courseId && c.dance_type_id === newDanceTypeId)
              
              router.push(
                buildUrl({
                  search,
                  hasCredits: hasCredits ? true : null,
                  danceType: newDanceTypeId,
                  branch: branchId,
                  course: shouldClearCourse ? null : courseId,
                })
              )
            }}
            ariaLabel="Filter by dance type"
            options={[
              { value: '', label: t('filters.danceType') },
              ...filteredDanceTypes.map((dt) => ({ 
                value: dt.id, 
                label: `${dt.name} (${dt.studentCount || 0})` 
              })),
            ]}
          />
        )}

        {/* Branch Filter - Locked if course is selected */}
        {courseId && lockedBranch ? (
          <div className="px-3 h-10 border border-[#E5E7EB] rounded-lg bg-gray-50 flex items-center text-sm text-gray-600 whitespace-nowrap">
            <span className="font-medium">{lockedBranch}</span>
          </div>
        ) : (
          <SelectDropdown
            placeholder={t('filters.branch')}
            value={branchId || ''}
            onChange={(value) => {
              // When branch changes, clear the course filter if selected course doesn't match new branch
              const newBranchId = value || null
              const shouldClearCourse = courseId && newBranchId && 
                !courses.some(c => c.id === courseId && c.branch_id === newBranchId)
              
              router.push(
                buildUrl({
                  search,
                  hasCredits: hasCredits ? true : null,
                  danceType: danceTypeId,
                  branch: newBranchId,
                  course: shouldClearCourse ? null : courseId,
                })
              )
            }}
            ariaLabel="Filter by branch"
            options={[
              { value: '', label: t('filters.branch') },
              ...filteredBranches.map((b) => ({ 
                value: b.id, 
                label: `${b.name} (${b.studentCount || 0})` 
              })),
            ]}
          />
        )}

        {/* Course Filter */}
        <SelectDropdown
          placeholder={t('filters.course')}
          value={courseId || ''}
          onChange={(value) => {
            // When selecting a course, clear branch and danceType filters
            // because the course already defines them
            router.push(
              buildUrl({
                search,
                hasCredits: hasCredits ? true : null,
                danceType: null,
                branch: null,
                course: value || null,
              })
            )
          }}
          ariaLabel="Filter by course"
          options={[
            { value: '', label: t('filters.course') },
            ...filteredCourses.map((c) => ({ 
              value: c.id, 
              label: `${c.name} (${c.studentCount || 0})` 
            })),
          ]}
        />

        {/* Has Credits Filter */}
        <label className="flex items-center gap-2 cursor-pointer px-3 h-10 border border-[#E5E7EB] rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
          <input
            type="checkbox"
            checked={hasCredits || false}
            onChange={(e) => {
              router.push(
                buildUrl({
                  search,
                  hasCredits: e.target.checked ? true : null,
                  danceType: danceTypeId,
                  branch: branchId,
                  course: courseId,
                })
              )
            }}
            aria-label="Filter for students with credits"
            className="rounded cursor-pointer accent-[#4F46E5]"
          />
          <span className="text-sm font-medium text-[#111827]">Credits</span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 h-10">
        <Button
          onClick={handleSearch}
          className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm px-4"
          aria-label="Apply search and filter"
        >
          Search
        </Button>

        {hasActiveFilters && (
          <Button
            onClick={handleReset}
            variant="outline"
            className="border-[#E5E7EB] text-gray-600 hover:bg-gray-50 text-sm px-3"
            aria-label="Clear all filters and search"
            title="Clear all filters"
          >
            <RotateCcw size={16} />
            <span className="hidden sm:inline ml-1">Reset</span>
          </Button>
        )}
      </div>
    </div>
  )
}
