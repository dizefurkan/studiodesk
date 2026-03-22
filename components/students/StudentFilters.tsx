'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Search } from 'lucide-react'
import Link from 'next/link'

interface StudentFiltersProps {
  danceTypes: Array<{ id: string; name: string }>
  branches: Array<{ id: string; name: string }>
  courses: Array<{ id: string; name: string }>
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

  const clearUrl = () => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    return `/dashboard/students?${params.toString()}`
  }

  const hasActiveFilters = hasCredits || danceTypeId || courseId || branchId

  return (
    <Card className="border-[#E5E7EB] p-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-[#111827]">Search & Filters</h3>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
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
            }}
            className="w-full pl-10 pr-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-0"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Has Credits Filter */}
          <label className="flex items-center gap-2 cursor-pointer">
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
              className="rounded"
            />
            <span className="text-sm font-medium text-[#111827]">Has Credits</span>
          </label>

          {/* Dance Type Filter */}
          <select
            value={danceTypeId || ''}
            onChange={(e) => {
              router.push(
                buildUrl({
                  search,
                  hasCredits: hasCredits ? true : null,
                  danceType: e.target.value || null,
                  branch: branchId,
                  course: courseId,
                })
              )
            }}
            className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-0"
          >
            <option value="">All Dance Types</option>
            {danceTypes.map((dt) => (
              <option key={dt.id} value={dt.id}>
                {dt.name}
              </option>
            ))}
          </select>

          {/* Branch Filter */}
          <select
            value={branchId || ''}
            onChange={(e) => {
              router.push(
                buildUrl({
                  search,
                  hasCredits: hasCredits ? true : null,
                  danceType: danceTypeId,
                  branch: e.target.value || null,
                  course: courseId,
                })
              )
            }}
            className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-0"
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Course Filter */}
          <select
            value={courseId || ''}
            onChange={(e) => {
              router.push(
                buildUrl({
                  search,
                  hasCredits: hasCredits ? true : null,
                  danceType: danceTypeId,
                  branch: branchId,
                  course: e.target.value || null,
                })
              )
            }}
            className="px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-0"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Link href={clearUrl()}>
              <Button variant="outline" className="w-full border-[#E5E7EB] text-red-600 hover:bg-red-50">
                <X size={16} className="mr-1" />
                Clear Filters
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  )
}
