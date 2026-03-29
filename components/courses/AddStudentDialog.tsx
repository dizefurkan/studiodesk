'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {  Plus, X, Check } from 'lucide-react'
import { getStudentsWithPackages } from '@/lib/actions/students.actions'
import { addStudentToCourse } from '@/lib/actions/course-students.actions'
import { useRouter } from 'next/navigation'

interface Student {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  student_packages?: Array<{
    id: string
    remaining_credits: number
    package?: {
      dance_type_id: string
    }
  }>
}

interface AddStudentDialogProps {
  courseId: string
  danceTypeId: string
  enrolledStudentIds?: string[]
  onStudentsAdded?: () => void
}

export function AddStudentDialog({ courseId, danceTypeId, enrolledStudentIds = [], onStudentsAdded }: AddStudentDialogProps) {
  const t = useTranslations()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [filterHasPackage, setFilterHasPackage] = useState(true)
  const [loading, setLoading] = useState(false)
  const [addingStudents, setAddingStudents] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load students when dialog opens
  useEffect(() => {
    if (!isOpen) return

    const loadStudents = async () => {
      setLoading(true)
      setError(null)

      const result = await getStudentsWithPackages()

      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        setStudents(result.data as any)
      }

      setLoading(false)
    }

    loadStudents()
  }, [isOpen])

  // Filter students based on search and package filter
  useEffect(() => {
    let filtered = students

    // Exclude already enrolled students
    filtered = filtered.filter((s) => !enrolledStudentIds.includes(s.id))

    // Handle search query
    if (searchQuery) {
      filtered = filtered.filter(
        (s) =>
          s.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.email.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Handle package filter
    if (filterHasPackage) {
      filtered = filtered.filter((s) =>
        s.student_packages?.some(
          (sp) =>
            sp.package?.dance_type_id === danceTypeId && sp.remaining_credits > 0,
        ),
      )
    }

    setFilteredStudents(filtered)
  }, [students, searchQuery, filterHasPackage, danceTypeId, enrolledStudentIds])

  const handleStudentSelect = (studentId: string) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const handleAddStudents = async () => {
    if (selectedStudents.size === 0) {
      setError('Please select at least one student')
      return
    }

    setAddingStudents(true)
    setError(null)

    try {
      let successCount = 0
      let failureCount = 0

      for (const studentId of selectedStudents) {
        const result = await addStudentToCourse(courseId, studentId)
        if (result.success) {
          successCount++
        } else {
          failureCount++
        }
      }

      if (failureCount === 0) {
        setIsOpen(false)
        setSelectedStudents(new Set())
        onStudentsAdded?.()
        router.refresh()
      } else {
        setError(
          `Added ${successCount} student${successCount !== 1 ? 's' : ''}. ${failureCount} failed.`,
        )
      }
    } catch (err) {
      setError('Failed to add students')
      console.error(err)
    } finally {
      setAddingStudents(false)
    }
  }

  const hasPackageCount = students.filter((s) =>
    s.student_packages?.some(
      (sp) =>
        sp.package?.dance_type_id === danceTypeId && sp.remaining_credits > 0,
    ),
  ).length

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2"
      >
        <Plus size={16} />
        {t('courses.addStudents')}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="border-[#E5E7EB] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-[#E5E7EB] flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-[#111827]">{t('courses.addStudentsTitle')}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {hasPackageCount} student{hasPackageCount !== 1 ? 's' : ''} with active packages for this dance type
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 border-t border-b border-red-200 bg-red-50">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Search & Filter Bar */}
            <div className="p-4 border-b border-[#E5E7EB] space-y-4 bg-gray-50">
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-[#E5E7EB]"
              />

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterHasPackage}
                  onChange={(e) => setFilterHasPackage(e.target.checked)}
                  className="w-4 h-4 rounded border-[#E5E7EB]"
                />
                <span className="text-sm text-[#111827] font-medium">
                  Show only students with active packages for this dance type
                </span>
              </label>
            </div>

            {/* Student List - Table Format */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading students...</div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {filterHasPackage && students.filter(s => !enrolledStudentIds.includes(s.id)).length === 0
                    ? 'No available students (all may already be enrolled)'
                    : 'No students found'}
                </div>
              ) : (
                <table className="w-full divide-y divide-[#E5E7EB]">
                  <thead className="bg-gray-50 sticky top-0 border-b border-[#E5E7EB]">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={filteredStudents.length > 0 && filteredStudents.every(s => selectedStudents.has(s.id))}
                          onChange={() => {
                            if (filteredStudents.every(s => selectedStudents.has(s.id))) {
                              filteredStudents.forEach(s => selectedStudents.delete(s.id))
                              setSelectedStudents(new Set(selectedStudents))
                            } else {
                              const newSelected = new Set(selectedStudents)
                              filteredStudents.forEach(s => newSelected.add(s.id))
                              setSelectedStudents(newSelected)
                            }
                          }}
                          className="w-4 h-4 rounded border-[#E5E7EB]"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#111827]">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#111827]">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#111827]">Credits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => {
                      const hasPackage = student.student_packages?.some(
                        (sp) =>
                          sp.package?.dance_type_id === danceTypeId && sp.remaining_credits > 0,
                      )
                      const remainingCredits = student.student_packages?.find(
                        (sp) =>
                          sp.package?.dance_type_id === danceTypeId && sp.remaining_credits > 0,
                      )?.remaining_credits

                      return (
                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedStudents.has(student.id)}
                              onChange={() => handleStudentSelect(student.id)}
                              className="w-4 h-4 rounded border-[#E5E7EB]"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <p className="font-medium text-[#111827]">
                              {student.first_name} {student.last_name}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{student.email}</td>
                          <td className="px-4 py-3 text-sm">
                            {hasPackage ? (
                              <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                {remainingCredits}
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#E5E7EB] bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''} selected
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={addingStudents}
                  className="border-[#E5E7EB]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddStudents}
                  disabled={selectedStudents.size === 0 || addingStudents}
                  className="bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2"
                >
                  <Check size={16} />
                  {addingStudents ? 'Adding...' : `Add ${selectedStudents.size} Student${selectedStudents.size !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
