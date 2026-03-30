'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RotateCcw, SlidersHorizontal, List, Maximize2 } from 'lucide-react'
import { SelectDropdown } from '@/components/ui/select-dropdown'
import { SearchInput } from '@/components/ui/search-input'
import { Drawer } from '@/components/ui/drawer'
import { StudentColumnSettings } from './StudentColumnSettings'
import type { StudentColumns } from '@/hooks/useStudentColumns'

interface StudentFiltersProps {
  danceTypes: Array<{ id: string; name: string; studentCount?: number }>
  branches: Array<{ id: string; name: string; studentCount?: number }>
  courses: Array<{ id: string; name: string; branch_id?: string; dance_type_id?: string; studentCount?: number }>
  searchQuery?: string
  hasCredits?: boolean
  danceTypeId?: string
  branchId?: string
  courseId?: string
  viewMode?: 'single' | 'expanded'
  onViewModeChange?: (mode: 'single' | 'expanded') => void
  columns?: StudentColumns
  onColumnsToggle?: (column: keyof StudentColumns) => void
  onColumnsReset?: () => void
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
  viewMode = 'expanded',
  onViewModeChange,
  columns,
  onColumnsToggle,
  onColumnsReset,
}: StudentFiltersProps) {
  const t = useTranslations()
  const router = useRouter()
  const [search, setSearch] = useState(searchQuery || '')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const buildUrl = (filters: Record<string, string | boolean | null | undefined>) => {
    const params = new URLSearchParams()
    if (filters.search && typeof filters.search === 'string') params.set('q', filters.search)
    if (filters.hasCredits && typeof filters.hasCredits === 'boolean') params.set('hasCredits', 'true')
    if (filters.danceType && typeof filters.danceType === 'string') params.set('danceType', filters.danceType)
    if (filters.branch && typeof filters.branch === 'string') params.set('branch', filters.branch)
    if (filters.course && typeof filters.course === 'string') params.set('course', filters.course)
    return `/dashboard/students?${params.toString()}`
  }

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch)
    router.push(
      buildUrl({
        search: newSearch,
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
    <>
      {/* Desktop Layout */}
      <div className="hidden md:flex flex-col gap-3 items-stretch">
        <div className="flex gap-3 items-center flex-wrap md:flex-nowrap">
        {/* Search */}
        <SearchInput
          placeholder={t('common.searchStudent')}
          value={search}
          onChange={handleSearchChange}
          debounceMs={300}
          ariaLabel="Search students by name or email"
        />

          {/* Filters Container - Desktop */}
          <div className="flex gap-2 flex-wrap items-center">
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
          <div className="flex gap-2 items-center ml-auto">
            {/* Columns Button */}
            {columns && onColumnsToggle && onColumnsReset && (
              <StudentColumnSettings
                columns={columns}
                onToggle={onColumnsToggle}
                onReset={onColumnsReset}
              />
            )}
            
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
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Search + Filter Button */}
        <div className="flex gap-2 items-center">
          <SearchInput
            placeholder={t('common.searchStudent')}
            value={search}
            onChange={handleSearchChange}
            debounceMs={300}
            ariaLabel="Search students by name or email"
          />

          {/* Filter Button - Icon Only */}
          <Button
            onClick={() => setDrawerOpen(true)}
            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white h-10 w-10 p-0 flex-shrink-0"
            aria-label="Open filters drawer"
            title="Open filters"
          >
            <SlidersHorizontal size={18} />
          </Button>
        </div>
      </div>

      {/* Filters Drawer - Mobile */}
      <Drawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={t('filters.title') || 'Filters'}
        description={t('filters.description') || 'Refine your search'}
      >
        <div className="space-y-4">
          {/* Dance Type Filter */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-2">
              {t('filters.danceType')}
            </label>
            {courseId && lockedDanceType ? (
              <div className="px-3 py-2 border border-[#E5E7EB] rounded-lg bg-gray-50 text-sm text-gray-600">
                {lockedDanceType}
              </div>
            ) : (
              <select
                value={danceTypeId || ''}
                onChange={(e) => {
                  const value = e.target.value
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
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-0"
              >
                <option value="">{t('filters.danceType')}</option>
                {filteredDanceTypes.map((dt) => (
                  <option key={dt.id} value={dt.id}>
                    {dt.name} ({dt.studentCount || 0})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Branch Filter */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-2">
              {t('filters.branch')}
            </label>
            {courseId && lockedBranch ? (
              <div className="px-3 py-2 border border-[#E5E7EB] rounded-lg bg-gray-50 text-sm text-gray-600">
                {lockedBranch}
              </div>
            ) : (
              <select
                value={branchId || ''}
                onChange={(e) => {
                  const value = e.target.value
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
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-0"
              >
                <option value="">{t('filters.branch')}</option>
                {filteredBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.studentCount || 0})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Course Filter */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-2">
              {t('filters.course')}
            </label>
            <select
              value={courseId || ''}
              onChange={(e) => {
                const value = e.target.value
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
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-0"
            >
              <option value="">{t('filters.course')}</option>
              {filteredCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.studentCount || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Has Credits Filter */}
          <label className="flex items-center gap-3 cursor-pointer">
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
              className="rounded cursor-pointer accent-[#4F46E5] w-4 h-4"
            />
            <span className="text-sm font-medium text-[#111827]">Credits</span>
          </label>

          {/* Divider */}
          <div className="border-t border-[#E5E7EB] pt-4"></div>

          {/* View Toggle */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-2">View</label>
            <div className="flex gap-1 bg-[#F3F4F6] p-1 rounded-lg">
              <Button
                variant={viewMode === 'single' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange?.('single')}
                className={`flex-1 h-8 text-xs ${
                  viewMode === 'single'
                    ? 'bg-[#4F46E5] text-white'
                    : 'text-[#6B7280] hover:bg-white'
                }`}
                title="Single row view"
                aria-label="Single row view"
              >
                <List size={14} className="mr-1" />
                Single
              </Button>
              <Button
                variant={viewMode === 'expanded' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange?.('expanded')}
                className={`flex-1 h-8 text-xs ${
                  viewMode === 'expanded'
                    ? 'bg-[#4F46E5] text-white'
                    : 'text-[#6B7280] hover:bg-white'
                }`}
                title="Expanded view"
                aria-label="Expanded view"
              >
                <Maximize2 size={14} className="mr-1" />
                Expanded
              </Button>
            </div>
          </div>

          {/* Reset Button */}
          {hasActiveFilters && (
            <div>
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full border-[#E5E7EB] text-gray-600 hover:bg-gray-50 text-sm"
                aria-label="Clear all filters"
                title="Clear all filters"
              >
                <RotateCcw size={16} className="mr-2" />
                Reset All
              </Button>
            </div>
          )}
        </div>
      </Drawer>
    </>
  )
}

