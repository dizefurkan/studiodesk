'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Trash2, Users, List, Maximize2, ChevronDown } from 'lucide-react'
import { getCourseStudents, removeStudentFromCourse } from '@/lib/actions/course-students.actions'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

interface CourseStudent {
  id: string
  student_id: string
  joined_at: string
  courses?: {
    dance_type_id: string
  }
  students: {
    id: string
    first_name: string
    last_name: string
    phone?: string
    student_packages?: Array<{
      id: string
      remaining_credits: number
      packages?: {
        id: string
        dance_type_id: string
      }
    }>
  }
}

interface CourseStudentsSectionProps {
  courseId: string
  danceTypeId: string
  onStudentsLoaded?: (count: number) => void
}

export function CourseStudentsSection({ courseId, danceTypeId, onStudentsLoaded }: CourseStudentsSectionProps) {
  const t = useTranslations()
  const [students, setStudents] = useState<CourseStudent[]>([])
  const [loading, setLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [mobileViewMode, setMobileViewMode] = useState<'single' | 'expanded'>('expanded')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Load mobile view preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('courseStudentsTableMobileView')
    if (saved === 'single' || saved === 'expanded') {
      setMobileViewMode(saved)
    }
  }, [])

  const handleToggleMobileView = (mode: 'single' | 'expanded') => {
    setMobileViewMode(mode)
    localStorage.setItem('courseStudentsTableMobileView', mode)
  }

  const handleToggleRow = (studentId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(studentId)) {
        newSet.delete(studentId)
      } else {
        newSet.add(studentId)
      }
      return newSet
    })
  }

  // Load students on mount
  const loadStudents = async () => {
    setIsLoading(true)
    try {
      const result = await getCourseStudents(courseId)
      if (result.data) {
        setStudents(result.data)
        onStudentsLoaded?.(result.data.length)
      }
    } catch (error) {
      console.error('Error loading students:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [courseId])

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm(t('common.deleteStudentConfirm'))) return

    setLoading(true)
    try {
      const result = await removeStudentFromCourse(courseId, studentId)
      if (result.success) {
        await loadStudents()
      } else {
        alert(result.error || 'Failed to remove student')
      }
    } catch (error) {
      console.error('Error removing student:', error)
      alert('Failed to remove student')
    } finally {
      setLoading(false)
    }
  }

  // Get remaining credits for a student for this dance type
  const getStudentCredits = (studentPackages?: CourseStudent['students']['student_packages']) => {
    if (!studentPackages) return '-'
    
    const packageForDanceType = studentPackages.find(
      (pkg) => pkg.packages?.dance_type_id === danceTypeId
    )
    
    return packageForDanceType ? packageForDanceType.remaining_credits : '-'
  }

  if (isLoading) {
    return (
      <Card className="border-[#E5E7EB] p-6">
        <div className="text-center text-gray-500">Loading students...</div>
      </Card>
    )
  }

  return (
    <Card className="border-[#E5E7EB] overflow-hidden">
      {/* Mobile View Toggle */}
      {students.length > 0 && (
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
      )}

      {/* Students Table/Cards */}
      {students.length === 0 ? (
        <div className="text-center py-12 text-gray-500 p-6">
          <Users size={32} className="mx-auto mb-2 opacity-50" />
          <p>No students enrolled yet</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#111827]">Student Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#111827]">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#111827]">Credits</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#111827]">Joined</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-[#111827]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {students.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-[#111827]">
                      <Link
                        href={`/dashboard/students/${enrollment.students.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#4F46E5] hover:underline cursor-pointer"
                      >
                        {enrollment.students.first_name} {enrollment.students.last_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{enrollment.students.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {getStudentCredits(enrollment.students.student_packages)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(enrollment.joined_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRemoveStudent(enrollment.student_id)}
                        disabled={loading}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Remove student"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden grid grid-cols-1 gap-3 sm:gap-4 p-3 sm:p-4">
            {students.map((enrollment) => {
              const isExpanded = expandedRows.has(enrollment.id)

              if (mobileViewMode === 'single') {
                // Single Row Mode
                return (
                  <div
                    key={enrollment.id}
                    className="bg-white border border-[#E5E7EB] rounded-lg p-3 sm:p-4 hover:shadow transition-shadow"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/dashboard/students/${enrollment.students.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-sm text-[#111827] hover:text-[#4F46E5] block truncate"
                        >
                          {enrollment.students.first_name} {enrollment.students.last_name}
                        </Link>
                        <p className="text-xs text-[#9CA3AF] truncate">{enrollment.students.phone || '-'}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => handleRemoveStudent(enrollment.student_id)}
                          disabled={loading}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 h-8 w-8 px-0"
                          title="Remove student"
                        >
                          <Trash2 size={14} />
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#6B7280] hover:bg-[#F3F4F6] h-8 w-8 px-0"
                          onClick={() => handleToggleRow(enrollment.id)}
                          title="View details"
                        >
                          <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Details on Toggle */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-[#E5E7EB] space-y-2 text-xs sm:text-sm">
                        <div>
                          <p className="text-[#9CA3AF] font-medium">Credits</p>
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {getStudentCredits(enrollment.students.student_packages)}
                          </span>
                        </div>
                        <div>
                          <p className="text-[#9CA3AF] font-medium">Joined</p>
                          <p className="text-[#111827]">{new Date(enrollment.joined_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              } else {
                // Expanded Row Mode
                return (
                  <div
                    key={enrollment.id}
                    className="bg-white border border-[#E5E7EB] rounded-lg p-3 sm:p-4 hover:shadow transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <Link
                        href={`/dashboard/students/${enrollment.students.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-sm text-[#111827] hover:text-[#4F46E5]"
                      >
                        {enrollment.students.first_name} {enrollment.students.last_name}
                      </Link>
                      <button
                        onClick={() => handleRemoveStudent(enrollment.student_id)}
                        disabled={loading}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 h-8 w-8"
                        title="Remove student"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="space-y-2 text-xs sm:text-sm">
                      <div>
                        <p className="text-[#9CA3AF] font-medium">Phone</p>
                        <p className="text-[#111827]">{enrollment.students.phone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[#9CA3AF] font-medium">Credits</p>
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          {getStudentCredits(enrollment.students.student_packages)}
                        </span>
                      </div>
                      <div>
                        <p className="text-[#9CA3AF] font-medium">Joined</p>
                        <p className="text-[#111827]">{new Date(enrollment.joined_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                )
              }
            })}
          </div>
        </>
      )}
    </Card>
  )
}
