'use client'

import { Card } from '@/components/ui/card'
import type { Database } from '@/lib/types/database.types'

type Branch = Database['public']['Tables']['branches']['Row']

interface BranchFilterProps {
  branchId?: string
  branches: Branch[]
  searchQuery?: string
}

export function BranchFilter({ branchId, branches, searchQuery }: BranchFilterProps) {
  return (
    <Card className="border-[#E5E7EB] p-6">
      <div className="flex gap-4 items-end flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium text-[#111827] block mb-2">Branch</label>
          <select
            defaultValue={branchId || ''}
            onChange={(e) => {
              const params = new URLSearchParams()
              if (e.target.value) params.set('branch', e.target.value)
              if (searchQuery) params.set('q', searchQuery)
              window.location.href = `/dashboard/courses?${params.toString()}`
            }}
            className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          >
            <option value="">All Branches</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Card>
  )
}
