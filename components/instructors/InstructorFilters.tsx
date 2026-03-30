'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RotateCcw, SlidersHorizontal, List, Maximize2 } from 'lucide-react'
import { SelectDropdown } from '@/components/ui/select-dropdown'
import { SearchInput } from '@/components/ui/search-input'
import { Drawer } from '@/components/ui/drawer'

interface InstructorFiltersProps {
  danceTypes: Array<{ id: string; name: string }>
  branches: Array<{ id: string; name: string }>
  searchQuery?: string
  danceTypeId?: string
  branchId?: string
  viewMode?: 'single' | 'expanded'
  onViewModeChange?: (mode: 'single' | 'expanded') => void
}

export function InstructorFilters({
  danceTypes,
  branches,
  searchQuery = '',
  danceTypeId,
  branchId,
  viewMode = 'expanded',
  onViewModeChange,
}: InstructorFiltersProps) {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(searchQuery || '')
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Extract locale from pathname (e.g., /tr/dashboard/instructors -> tr)
  const locale = pathname.split('/')[1]

  const buildUrl = (filters: Record<string, string | null | undefined>) => {
    const params = new URLSearchParams()
    if (filters.search && typeof filters.search === 'string') params.set('q', filters.search)
    if (filters.danceType && typeof filters.danceType === 'string') params.set('danceType', filters.danceType)
    if (filters.branch && typeof filters.branch === 'string') params.set('branch', filters.branch)
    return `/${locale}/dashboard/instructors?${params.toString()}`
  }

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch)
    router.push(
      buildUrl({
        search: newSearch,
        danceType: danceTypeId,
        branch: branchId,
      })
    )
  }

  const handleReset = () => {
    setSearch('')
    router.push('/dashboard/instructors')
  }

  const hasActiveFilters = danceTypeId || branchId || search

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:flex flex-col gap-3 items-stretch">
        <div className="flex gap-3 items-center flex-wrap md:flex-nowrap">
          {/* Search */}
          <SearchInput
            placeholder={t('common.search')}
            value={search}
            onChange={handleSearchChange}
            debounceMs={300}
            ariaLabel="Search instructors by name or email"
          />

          {/* Filters Container - Desktop */}
          <div className="flex gap-2 flex-wrap items-center">
            {/* Dance Type Filter */}
            <SelectDropdown
              placeholder={t('filters.danceType')}
              value={danceTypeId || ''}
              onChange={(value) => {
                router.push(
                  buildUrl({
                    search,
                    danceType: value || null,
                    branch: branchId,
                  })
                )
              }}
              ariaLabel="Filter by dance type"
              options={[
                { value: '', label: t('filters.danceType') },
                ...danceTypes.map((dt) => ({ value: dt.id, label: dt.name })),
              ]}
            />

            {/* Branch Filter */}
            <SelectDropdown
              placeholder={t('filters.branch')}
              value={branchId || ''}
              onChange={(value) => {
                router.push(
                  buildUrl({
                    search,
                    danceType: danceTypeId,
                    branch: value || null,
                  })
                )
              }}
              ariaLabel="Filter by branch"
              options={[
                { value: '', label: t('filters.branch') },
                ...branches.map((b) => ({ value: b.id, label: b.name })),
              ]}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 items-center ml-auto">
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
        {/* Top Row: Search + Filter Button */}
        <div className="flex gap-2 items-center mb-3">
          <SearchInput
            placeholder={t('common.search')}
            value={search}
            onChange={handleSearchChange}
            debounceMs={300}
            ariaLabel="Search instructors by name or email"
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

        {/* View Mode Toggle */}
        {onViewModeChange && (
          <div className="flex gap-2 items-center">
            <span className="text-[#6B7280] font-medium text-xs">View:</span>
            <div className="flex gap-1 bg-white p-1 rounded-lg border border-[#E5E7EB]">
              <Button
                variant={viewMode === 'single' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('single')}
                className={`h-7 px-2 ${
                  viewMode === 'single'
                    ? 'bg-[#4F46E5] text-white'
                    : 'text-[#6B7280] hover:bg-[#F3F4F6]'
                }`}
                title="Single row view"
              >
                <List size={14} />
              </Button>
              <Button
                variant={viewMode === 'expanded' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('expanded')}
                className={`h-7 px-2 ${
                  viewMode === 'expanded'
                    ? 'bg-[#4F46E5] text-white'
                    : 'text-[#6B7280] hover:bg-[#F3F4F6]'
                }`}
                title="Expanded view"
              >
                <Maximize2 size={14} />
              </Button>
            </div>
          </div>
        )}
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
            <select
              value={danceTypeId || ''}
              onChange={(e) => {
                const value = e.target.value
                router.push(
                  buildUrl({
                    search,
                    danceType: value || null,
                    branch: branchId,
                  })
                )
              }}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-0"
            >
              <option value="">{t('filters.danceType')}</option>
              {danceTypes.map((dt) => (
                <option key={dt.id} value={dt.id}>
                  {dt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Branch Filter */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-2">
              {t('filters.branch')}
            </label>
            <select
              value={branchId || ''}
              onChange={(e) => {
                const value = e.target.value
                router.push(
                  buildUrl({
                    search,
                    danceType: danceTypeId,
                    branch: value || null,
                  })
                )
              }}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-0"
            >
              <option value="">{t('filters.branch')}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Button */}
          {hasActiveFilters && (
            <Button
              onClick={() => {
                setSearch('')
                setDrawerOpen(false)
                handleReset()
              }}
              variant="outline"
              className="w-full border-[#E5E7EB] text-gray-600 hover:bg-gray-50 text-sm"
              aria-label="Clear all filters and search"
            >
              <RotateCcw size={16} />
              <span className="ml-2">Reset Filters</span>
            </Button>
          )}
        </div>
      </Drawer>
    </>
  )
}
