'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Search, RotateCcw } from 'lucide-react'
import { SelectDropdown } from '@/components/ui/select-dropdown'

interface StudentFiltersProps {
  danceTypes: Array<{ id: string; name: string; studentCount?: number }>
  branches: Array<{ id: string; name: string; studentCount?: number }>
  courses: Array<{ id: string; name: string; studentCount?: number }>
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
          placeholder="Search by name or email..."
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
        {/* Dance Type Filter */}
        <SelectDropdown
          placeholder="Dance Type"
          value={danceTypeId || ''}
          onChange={(value) => {
            router.push(
              buildUrl({
                search,
                hasCredits: hasCredits ? true : null,
                danceType: value || null,
                branch: branchId,
                course: courseId,
              })
            )
          }}
          ariaLabel="Filter by dance type"
          options={[
            { value: '', label: 'Dance Type' },
            ...danceTypes.map((dt) => ({ 
              value: dt.id, 
              label: `${dt.name} (${dt.studentCount || 0})` 
            })),
          ]}
        />

        {/* Branch Filter */}
        <SelectDropdown
          placeholder="Branch"
          value={branchId || ''}
          onChange={(value) => {
            router.push(
              buildUrl({
                search,
                hasCredits: hasCredits ? true : null,
                danceType: danceTypeId,
                branch: value || null,
                course: courseId,
              })
            )
          }}
          ariaLabel="Filter by branch"
          options={[
            { value: '', label: 'Branch' },
            ...branches.map((b) => ({ 
              value: b.id, 
              label: `${b.name} (${b.studentCount || 0})` 
            })),
          ]}
        />

        {/* Course Filter */}
        <SelectDropdown
          placeholder="Course"
          value={courseId || ''}
          onChange={(value) => {
            router.push(
              buildUrl({
                search,
                hasCredits: hasCredits ? true : null,
                danceType: danceTypeId,
                branch: branchId,
                course: value || null,
              })
            )
          }}
          ariaLabel="Filter by course"
          options={[
            { value: '', label: 'Course' },
            ...courses.map((c) => ({ 
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
