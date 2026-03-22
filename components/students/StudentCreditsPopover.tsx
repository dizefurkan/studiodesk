'use client'

import { useState } from 'react'
import { Zap, X } from 'lucide-react'

interface StudentCreditsPopoverProps {
  totalCredits: number
  packageDetails: Array<{
    name: string
    danceType: string
    remaining: number
  }>
}

export function StudentCreditsPopover({ totalCredits, packageDetails }: StudentCreditsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity"
      >
        <Zap size={14} className="text-amber-500" />
        <span className={totalCredits === 0 ? 'text-red-600 font-medium' : 'text-[#111827] font-semibold'}>
          {totalCredits}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-[#E5E7EB] rounded-lg shadow-lg p-4 min-w-max z-50">
          <div className="flex items-center justify-between gap-4 mb-3">
            <h4 className="font-semibold text-[#111827]">Credits Breakdown</h4>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-2 text-sm">
            {packageDetails && packageDetails.length > 0 ? (
              packageDetails.map((pkg, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[#111827]">
                  <Zap size={12} className="text-amber-500" />
                  <span className="font-medium">{pkg.danceType}:</span>
                  <span className="font-semibold">{pkg.remaining}</span>
                  <span className="text-gray-500 text-xs">credit{pkg.remaining !== 1 ? 's' : ''}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No credits</p>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-[#E5E7EB] text-sm font-semibold">
            Total: {totalCredits} credit{totalCredits !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
