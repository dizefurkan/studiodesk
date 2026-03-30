'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import Link from 'next/link'
import { Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react'

interface Instructor {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  created_at: string
  branchCount: number
  courseCount: number
  danceTypeCount: number
  branches?: Array<{ id: string; name: string }>
  courses?: Array<{ id: string; name: string }>
  danceTypes?: Array<{ id: string; name: string }>
}

interface InstructorTableProps {
  instructors: Instructor[]
  danceTypes?: Array<{ id: string; name: string }>
  branches?: Array<{ id: string; name: string }>
  mobileViewMode?: 'single' | 'expanded'
}

export function InstructorTable({ 
  instructors, 
  danceTypes = [],
  branches = [],
  mobileViewMode = 'expanded',
}: InstructorTableProps) {
  const t = useTranslations()
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

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
    <div className="space-y-3 md:space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-[#111827]">
                {t('table.name')}
              </th>
              <th className="hidden sm:table-cell px-6 py-4 text-left text-sm font-semibold text-[#111827]">
                {t('table.email')}
              </th>
              <th className="hidden md:table-cell px-6 py-4 text-left text-sm font-semibold text-[#111827]">
                {t('table.phone')}
              </th>
              <th className="hidden lg:table-cell px-6 py-4 text-left text-sm font-semibold text-[#111827]">
                {t('instructors.coursesAssigned')}
              </th>
              <th className="hidden lg:table-cell px-6 py-4 text-left text-sm font-semibold text-[#111827]">
                {t('instructors.danceTypesAssigned')}
              </th>
              <th className="hidden lg:table-cell px-6 py-4 text-left text-sm font-semibold text-[#111827]">
                {t('instructors.branchesAssigned')}
              </th>
              <th className="hidden lg:table-cell px-6 py-4 text-left text-sm font-semibold text-[#111827]">
                {t('table.joined')}
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-[#111827]">
                {t('table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {instructors.map((instructor) => (
              <tr key={instructor.id} className="hover:bg-[#F9FAFB] transition-colors">
                <td className="px-6 py-4">
                  <Link
                    href={`/dashboard/instructors/${instructor.id}`}
                    className="font-medium text-[#111827] hover:text-[#4F46E5]"
                  >
                    {instructor.first_name} {instructor.last_name}
                  </Link>
                </td>
                <td className="hidden sm:table-cell px-6 py-4 text-gray-600 truncate">
                  {instructor.email}
                </td>
                <td className="hidden md:table-cell px-6 py-4 text-gray-600">
                  {instructor.phone ? (
                    <a
                      href={`tel:${instructor.phone}`}
                      className="text-[#4F46E5] hover:underline cursor-pointer"
                    >
                      {instructor.phone}
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="hidden lg:table-cell px-6 py-4 text-gray-600">
                  <span className="inline-block bg-[#EEF2FF] text-[#4F46E5] px-2 py-1 rounded text-sm font-medium">
                    {t('instructors.courseCount', { count: instructor.courseCount })}
                  </span>
                </td>
                <td className="hidden lg:table-cell px-6 py-4 text-gray-600">
                  <span className="inline-block bg-[#F3F4F6] text-[#111827] px-2 py-1 rounded text-sm font-medium">
                    {t('instructors.danceTypeCount', { count: instructor.danceTypeCount })}
                  </span>
                </td>
                <td className="hidden lg:table-cell px-6 py-4 text-gray-600">
                  {instructor.branches && instructor.branches.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {instructor.branches.slice(0, 2).map((branch) => (
                        <span key={branch.id} className="inline-block bg-[#F0F9FF] text-[#0369A1] px-2 py-1 rounded text-xs font-medium">
                          {branch.name}
                        </span>
                      ))}
                      {instructor.branches.length > 2 && (
                        <span className="inline-block text-xs text-gray-500">
                          +{instructor.branches.length - 2}
                        </span>
                      )}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="hidden lg:table-cell px-6 py-4 text-gray-600">
                  {new Date(instructor.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right space-x-2 flex justify-end">
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
      <div className="md:hidden grid grid-cols-1 gap-3 sm:gap-4">
        {instructors.map((instructor) => {
          const isExpanded = expandedRows.has(instructor.id)

          if (mobileViewMode === 'single') {
            // Single Row Mode - Compact view
            return (
              <div
                key={instructor.id}
                className="bg-white border border-[#E5E7EB] rounded-lg p-3 sm:p-4 hover:shadow transition-shadow"
              >
                {/* Single Row - Compact */}
                <div className="flex justify-between items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <Link href={`/dashboard/instructors/${instructor.id}`}>
                      <h3 className="font-semibold text-sm text-[#111827] hover:text-[#4F46E5] truncate">
                        {instructor.first_name} {instructor.last_name}
                      </h3>
                    </Link>
                    <p className="text-xs text-[#9CA3AF] truncate">
                      {instructor.courses && instructor.courses.length > 0
                        ? instructor.courses.slice(0, 2).map(c => c.name).join(', ') + (instructor.courses.length > 2 ? ` +${instructor.courses.length - 2}` : '')
                        : '-'}
                    </p>
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
                        <p className="text-[#9CA3AF] font-medium">{t('table.phone')}</p>
                        <p className="text-[#111827]">{instructor.phone}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[#9CA3AF] font-medium">{t('instructors.coursesAssigned')}</p>
                      {instructor.courses && instructor.courses.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {instructor.courses.length <= 2 ? (
                            instructor.courses.map((course) => (
                              <span key={course.id} className="inline-block bg-[#EEF2FF] text-[#4F46E5] px-2 py-1 rounded text-xs font-medium">
                                {course.name}
                              </span>
                            ))
                          ) : (
                            <>
                              {instructor.courses.slice(0, 2).map((course) => (
                                <span key={course.id} className="inline-block bg-[#EEF2FF] text-[#4F46E5] px-2 py-1 rounded text-xs font-medium">
                                  {course.name}
                                </span>
                              ))}
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="inline-block bg-[#F3F4F6] text-[#111827] px-2 py-1 rounded text-xs font-medium hover:bg-[#E5E7EB] transition-colors cursor-pointer">
                                    +{instructor.courses.length - 2} more
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48">
                                  <div className="space-y-1">
                                    {instructor.courses.slice(2).map((course) => (
                                      <div key={course.id} className="text-xs text-[#111827] py-1 px-2 hover:bg-gray-100 rounded">
                                        {course.name}
                                      </div>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </>
                          )}
                        </div>
                      ) : (
                        <p className="text-[#111827] text-xs">-</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[#9CA3AF] font-medium">{t('instructors.danceTypesAssigned')}</p>
                      {instructor.danceTypes && instructor.danceTypes.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {instructor.danceTypes.length <= 2 ? (
                            instructor.danceTypes.map((danceType) => (
                              <span key={danceType.id} className="inline-block bg-[#F3F4F6] text-[#111827] px-2 py-1 rounded text-xs font-medium">
                                {danceType.name}
                              </span>
                            ))
                          ) : (
                            <>
                              {instructor.danceTypes.slice(0, 2).map((danceType) => (
                                <span key={danceType.id} className="inline-block bg-[#F3F4F6] text-[#111827] px-2 py-1 rounded text-xs font-medium">
                                  {danceType.name}
                                </span>
                              ))}
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="inline-block bg-[#FEF3C7] text-[#92400E] px-2 py-1 rounded text-xs font-medium hover:bg-[#FCD34D] transition-colors cursor-pointer">
                                    +{instructor.danceTypes.length - 2} more
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48">
                                  <div className="space-y-1">
                                    {instructor.danceTypes.slice(2).map((danceType) => (
                                      <div key={danceType.id} className="text-xs text-[#111827] py-1 px-2 hover:bg-gray-100 rounded">
                                        {danceType.name}
                                      </div>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </>
                          )}
                        </div>
                      ) : (
                        <p className="text-[#111827] text-xs">-</p>
                      )}
                    </div>
                    {instructor.branches && instructor.branches.length > 0 && (
                      <div>
                        <p className="text-[#9CA3AF] font-medium">{t('instructors.branchesAssigned')}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {instructor.branches.map((branch) => (
                            <span key={branch.id} className="inline-block bg-[#F0F9FF] text-[#0369A1] px-2 py-1 rounded text-xs font-medium">
                              {branch.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-[#9CA3AF] font-medium">{t('table.joined')}</p>
                      <p className="text-[#111827]">
                        {new Date(instructor.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          } else {
            // Expanded Mode
            return (
              <div key={instructor.id} className="bg-white border border-[#E5E7EB] rounded-lg p-3 sm:p-4 hover:shadow transition-shadow">
                <div className="flex justify-between items-start mb-3 gap-2">
                  <Link href={`/dashboard/instructors/${instructor.id}`}>
                    <h3 className="font-semibold text-sm text-[#111827] hover:text-[#4F46E5]">
                      {instructor.first_name} {instructor.last_name}
                    </h3>
                  </Link>
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
                  </div>
                </div>

                <p className="text-xs text-[#9CA3AF] mb-3 truncate">{instructor.email}</p>

                <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                  {instructor.phone && (
                    <div>
                      <p className="text-[#9CA3AF] font-medium">{t('table.phone')}</p>
                      <p className="text-[#111827] truncate">{instructor.phone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[#9CA3AF] font-medium">{t('instructors.coursesAssigned')}</p>
                    {instructor.courses && instructor.courses.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {instructor.courses.length <= 2 ? (
                          instructor.courses.map((course) => (
                            <span key={course.id} className="inline-block bg-[#EEF2FF] text-[#4F46E5] px-2 py-1 rounded text-xs font-medium">
                              {course.name}
                            </span>
                          ))
                        ) : (
                          <>
                            {instructor.courses.slice(0, 2).map((course) => (
                              <span key={course.id} className="inline-block bg-[#EEF2FF] text-[#4F46E5] px-2 py-1 rounded text-xs font-medium">
                                {course.name}
                              </span>
                            ))}
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="inline-block bg-[#F3F4F6] text-[#111827] px-2 py-1 rounded text-xs font-medium hover:bg-[#E5E7EB] transition-colors cursor-pointer">
                                  +{instructor.courses.length - 2}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-48">
                                <div className="space-y-1">
                                  {instructor.courses.slice(2).map((course) => (
                                    <div key={course.id} className="text-xs text-[#111827] py-1 px-2 hover:bg-gray-100 rounded">
                                      {course.name}
                                    </div>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </>
                        )}
                      </div>
                    ) : (
                      <p className="text-[#111827] text-xs">-</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[#9CA3AF] font-medium">{t('instructors.danceTypesAssigned')}</p>
                    {instructor.danceTypes && instructor.danceTypes.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {instructor.danceTypes.length <= 2 ? (
                          instructor.danceTypes.map((danceType) => (
                            <span key={danceType.id} className="inline-block bg-[#F3F4F6] text-[#111827] px-2 py-1 rounded text-xs font-medium">
                              {danceType.name}
                            </span>
                          ))
                        ) : (
                          <>
                            {instructor.danceTypes.slice(0, 2).map((danceType) => (
                              <span key={danceType.id} className="inline-block bg-[#F3F4F6] text-[#111827] px-2 py-1 rounded text-xs font-medium">
                                {danceType.name}
                              </span>
                            ))}
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="inline-block bg-[#FEF3C7] text-[#92400E] px-2 py-1 rounded text-xs font-medium hover:bg-[#FCD34D] transition-colors cursor-pointer">
                                  +{instructor.danceTypes.length - 2}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-48">
                                <div className="space-y-1">
                                  {instructor.danceTypes.slice(2).map((danceType) => (
                                    <div key={danceType.id} className="text-xs text-[#111827] py-1 px-2 hover:bg-gray-100 rounded">
                                      {danceType.name}
                                    </div>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </>
                        )}
                      </div>
                    ) : (
                      <p className="text-[#111827] text-xs">-</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[#9CA3AF] font-medium">{t('table.joined')}</p>
                    <p className="text-[#111827]">
                      {new Date(instructor.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {instructor.branches && instructor.branches.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#E5E7EB]">
                    <p className="text-[#9CA3AF] font-medium text-xs mb-2">{t('instructors.branchesAssigned')}</p>
                    <div className="flex flex-wrap gap-1">
                      {instructor.branches.map((branch) => (
                        <span key={branch.id} className="inline-block bg-[#F0F9FF] text-[#0369A1] px-2 py-1 rounded text-xs font-medium">
                          {branch.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          }
        })}
      </div>
    </div>
  )
}
