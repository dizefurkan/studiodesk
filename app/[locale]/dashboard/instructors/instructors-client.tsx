'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Edit2, Trash2, List, Maximize2, ChevronDown } from 'lucide-react'
import type { Database } from '@/lib/types/database.types'

type Instructor = Database['public']['Tables']['instructors']['Row']

interface InstructorsPageClientProps {
  instructors: Instructor[]
}

export function InstructorsPageClient({ instructors }: InstructorsPageClientProps) {
  const [mobileViewMode, setMobileViewMode] = useState<'single' | 'expanded'>('expanded')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Load mobile view preference
  useEffect(() => {
    const saved = localStorage.getItem('instructorsTableMobileView')
    if (saved === 'single' || saved === 'expanded') {
      setMobileViewMode(saved)
    }
  }, [])

  const handleToggleMobileView = (mode: 'single' | 'expanded') => {
    setMobileViewMode(mode)
    localStorage.setItem('instructorsTableMobileView', mode)
  }

  const handleToggleRow = (instructorId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(instructorId)) {
        newSet.delete(instructorId)
      } else {
        newSet.add(instructorId)
      }
      return newSet
    })
  }

  return (
    <Card className="border-[#E5E7EB] overflow-hidden">
      {/* Mobile View Toggle */}
      <div className="md:hidden flex gap-2 items-center p-3 sm:p-4 border-b border-[#E5E7EB] bg-[#F9FAFB]">
        <span className="text-[#6B7280] font-medium text-xs">View:</span>
        <div className="flex gap-1 bg-white p-1 rounded-lg border border-[#E5E7EB]">
          <Button
            variant={mobileViewMode === 'single' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleToggleMobileView('single')}
            className={`h-7 px-2 ${
              mobileViewMode === 'single'
                ? 'bg-[#4F46E5] text-white'
                : 'text-[#6B7280] hover:bg-[#F3F4F6]'
            }`}
            title="Single row view"
          >
            <List size={14} />
          </Button>
          <Button
            variant={mobileViewMode === 'expanded' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleToggleMobileView('expanded')}
            className={`h-7 px-2 ${
              mobileViewMode === 'expanded'
                ? 'bg-[#4F46E5] text-white'
                : 'text-[#6B7280] hover:bg-[#F3F4F6]'
            }`}
            title="Expanded view"
          >
            <Maximize2 size={14} />
          </Button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
            <tr>
              <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left font-semibold text-[#111827]">Name</th>
              <th className="hidden sm:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left font-semibold text-[#111827]">Email</th>
              <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left font-semibold text-[#111827]">Phone</th>
              <th className="hidden lg:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left font-semibold text-[#111827]">Joined</th>
              <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right font-semibold text-[#111827]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {instructors.map((instructor) => (
              <tr key={instructor.id} className="hover:bg-[#F9FAFB] transition-colors">
                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                  <Link
                    href={`/dashboard/instructors/${instructor.id}`}
                    className="font-medium text-[#111827] hover:text-[#4F46E5]"
                  >
                    {instructor.first_name} {instructor.last_name}
                  </Link>
                </td>
                <td className="hidden sm:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-gray-600 truncate">{instructor.email}</td>
                <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-gray-600">{instructor.phone || '-'}</td>
                <td className="hidden lg:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-gray-600">
                  {new Date(instructor.created_at!).toLocaleDateString()}
                </td>
                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right space-x-2 flex justify-end">
                  <Link href={`/dashboard/instructors/${instructor.id}/edit`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#4F46E5] hover:bg-[#EEF2FF]"
                    >
                      <Edit2 size={16} />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden grid grid-cols-1 gap-3 sm:gap-4 p-3 sm:p-4">
        {instructors.map((instructor) => {
          const isExpanded = expandedRows.has(instructor.id)

          if (mobileViewMode === 'single') {
            return (
              <div key={instructor.id} className="bg-white border border-[#E5E7EB] rounded-lg p-3 sm:p-4 hover:shadow transition-shadow">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <Link href={`/dashboard/instructors/${instructor.id}`}>
                      <h3 className="font-semibold text-sm text-[#111827] hover:text-[#4F46E5] truncate">
                        {instructor.first_name} {instructor.last_name}
                      </h3>
                    </Link>
                    <p className="text-xs text-[#9CA3AF] truncate">{instructor.email}</p>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <Link href={`/dashboard/instructors/${instructor.id}/edit`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#4F46E5] hover:bg-[#EEF2FF] h-8 w-8 px-0"
                      >
                        <Edit2 size={14} />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 h-8 w-8 px-0"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#6B7280] hover:bg-[#F3F4F6] h-8 w-8 px-0"
                      onClick={() => handleToggleRow(instructor.id)}
                    >
                      <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-[#E5E7EB] space-y-2 text-xs sm:text-sm">
                    {instructor.phone && (
                      <div>
                        <p className="text-[#9CA3AF] font-medium">Phone</p>
                        <p className="text-[#111827]">{instructor.phone}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[#9CA3AF] font-medium">Joined</p>
                      <p className="text-[#111827]">{new Date(instructor.created_at!).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          } else {
            return (
              <div key={instructor.id} className="bg-white border border-[#E5E7EB] rounded-lg p-3 sm:p-4 hover:shadow transition-shadow">
                <div className="flex justify-between items-start mb-3 gap-2">
                  <Link href={`/dashboard/instructors/${instructor.id}`}>
                    <h3 className="font-semibold text-sm text-[#111827] hover:text-[#4F46E5]">
                      {instructor.first_name} {instructor.last_name}
                    </h3>
                  </Link>
                  <div className="flex gap-1">
                    <Link href={`/dashboard/instructors/${instructor.id}/edit`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#4F46E5] hover:bg-[#EEF2FF] h-8 w-8"
                      >
                        <Edit2 size={14} />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 h-8 w-8"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-xs sm:text-sm">
                  <div>
                    <p className="text-[#9CA3AF] font-medium">Email</p>
                    <p className="text-[#111827]">{instructor.email}</p>
                  </div>
                  {instructor.phone && (
                    <div>
                      <p className="text-[#9CA3AF] font-medium">Phone</p>
                      <p className="text-[#111827]">{instructor.phone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[#9CA3AF] font-medium">Joined</p>
                    <p className="text-[#111827]">{new Date(instructor.created_at!).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )
          }
        })}
      </div>
    </Card>
  )
}
