'use client'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useTranslations } from 'next-intl'
import type { Database } from '@/lib/types/database.types'

type Branch = Database['public']['Tables']['branches']['Row']
type DanceType = Database['public']['Tables']['dance_types']['Row']

interface BranchFilterProps {
  branchId?: string
  branches: Branch[]
  searchQuery?: string
  danceTypeId?: string
  danceTypes: DanceType[]
}

export function BranchFilter({ branchId, branches, searchQuery, danceTypeId, danceTypes }: BranchFilterProps) {
  const t = useTranslations()

  const handleFilterChange = (newSearch?: string, newBranch?: string, newDanceType?: string) => {
    const params = new URLSearchParams()
    const search = newSearch !== undefined ? newSearch : searchQuery
    const branch = newBranch !== undefined ? newBranch : branchId
    const danceType = newDanceType !== undefined ? newDanceType : danceTypeId

    if (search) params.set('q', search)
    if (branch) params.set('branch', branch)
    if (danceType) params.set('danceType', danceType)
    
    window.location.href = `/dashboard/courses?${params.toString()}`
  }

  return (
    <Card className="border-[#E5E7EB] p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* Search Input */}
        <div>
          <label className="text-sm font-medium text-[#111827] block mb-2">{t('common.search')}</label>
          <Input
            type="text"
            placeholder={t('courses.searchCourse')}
            defaultValue={searchQuery || ''}
            onChange={(e) => handleFilterChange(e.target.value, branchId, danceTypeId)}
          />
        </div>

        {/* Branch Select */}
        <div>
          <label className="text-sm font-medium text-[#111827] block mb-2">{t('courses.branch')}</label>
          <select
            defaultValue={branchId || ''}
            onChange={(e) => handleFilterChange(searchQuery, e.target.value, danceTypeId)}
            className="w-full h-10 px-3 py-2 border border-[#E5E7EB] rounded-lg text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          >
            <option value="" className="text-[#6B7280]">{t('common.selectOption')}</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id} className="text-[#111827]">
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        {/* Dance Type Select */}
        <div>
          <label className="text-sm font-medium text-[#111827] block mb-2">{t('courses.danceType')}</label>
          <select
            defaultValue={danceTypeId || ''}
            onChange={(e) => handleFilterChange(searchQuery, branchId, e.target.value)}
            className="w-full h-10 px-3 py-2 border border-[#E5E7EB] rounded-lg text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          >
            <option value="" className="text-[#6B7280]">{t('common.selectOption')}</option>
            {danceTypes.map((danceType) => (
              <option key={danceType.id} value={danceType.id} className="text-[#111827]">
                {danceType.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Card>
  )
}
