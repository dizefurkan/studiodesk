'use client'

import { Card } from '@/components/ui/card'
import { BookOpen, AlertCircle } from 'lucide-react'

interface StudentCreditsProps {
  packages: Array<{
    id: string
    remaining_credits: number
    packages?: {
      name: string
      total_credits: number
      dance_types?: { name: string } | null
    } | null
  }>
  loading?: boolean
}

export function StudentCredits({ packages, loading }: StudentCreditsProps) {
  if (loading) {
    return (
      <Card className="border-[#E5E7EB] p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </Card>
    )
  }

  if (!packages || packages.length === 0) {
    return (
      <Card className="border-[#E5E7EB] p-6">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="text-[#4F46E5]" size={20} />
          <h2 className="text-lg font-semibold text-[#111827]">Credits</h2>
        </div>
        <div className="text-center py-8">
          <AlertCircle className="mx-auto text-[#D1D5DB] mb-2" size={32} />
          <p className="text-[#6B7280]">No active packages</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="border-[#E5E7EB]">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="text-[#4F46E5]" size={20} />
          <h2 className="text-lg font-semibold text-[#111827]">Credits</h2>
        </div>

        <div className="space-y-4">
          {packages.map((pkg, idx) => {
            const danceType = pkg.packages?.dance_types?.name || 'Unknown'
            const name = pkg.packages?.name || 'Package'
            const total = pkg.packages?.total_credits || 0
            const remaining = pkg.remaining_credits || 0
            const used = Math.max(0, total - remaining)
            const percentage = total > 0 ? (remaining / total) * 100 : 0

            const statusColor =
              percentage > 50 ? 'bg-green-50' : percentage > 25 ? 'bg-yellow-50' : 'bg-red-50'
            const badgeColor =
              percentage > 50 ? 'bg-green-100 text-green-800' : percentage > 25 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'

            return (
              <div key={idx} className={`p-4 rounded-lg border border-[#E5E7EB] ${statusColor}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-[#111827]">{name}</p>
                    <p className="text-sm text-[#6B7280]">{danceType}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${badgeColor}`}>
                    {remaining} / {total}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#4F46E5] h-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <p className="text-xs text-[#6B7280] mt-2">{used} used • {remaining} left</p>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
