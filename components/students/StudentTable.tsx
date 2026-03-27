'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { StudentColumnSettings } from './StudentColumnSettings'
import { StudentPopover } from './StudentPopover'
import { useStudentColumns } from '@/hooks/useStudentColumns'
import { Edit2, Trash2 } from 'lucide-react'

interface Student {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  created_at: string
  totalRemainingCredits: number
  enrolledCoursesCount: number
  student_packages?: Array<{
    id: string
    remaining_credits: number
  }>
  course_students?: Array<{
    course_id: string
    course?: {
      id: string
      name: string
    }
  }>
  packageDetails?: Array<{
    id: string
    name: string
    danceType: string
    danceTypeId: string
    remaining: number
  }>
}

interface StudentTableProps {
  students: Student[]
  showPagination?: boolean
  danceTypes?: Array<{ id: string; name: string }>
  branches?: Array<{ id: string; name: string }>
  courses?: Array<{ id: string; name: string }>
  filteredDanceTypeId?: string
}

export function StudentTable({ 
  students, 
  showPagination = false,
  danceTypes = [],
  branches = [],
  courses = [],
  filteredDanceTypeId,
}: StudentTableProps) {
  const { columns, toggleColumn, resetColumns, isLoaded } = useStudentColumns()

  if (!isLoaded) return <div>Loading...</div>

  // Extract unique courses
  const getCoursesForStudent = (student: Student) => {
    const courses = new Map<string, string>()
    student.course_students?.forEach((cs) => {
      if (cs.course) {
        courses.set(cs.course.id, cs.course.name)
      }
    })
    return Array.from(courses).map(([id, name]) => ({ id, name }))
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Toolbar: Column Settings */}
      <div className="flex justify-end text-xs md:text-sm">
        <StudentColumnSettings
          columns={columns}
          onToggle={toggleColumn}
          onReset={resetColumns}
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
            <tr>
              {columns.name && (
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#111827]">
                  Name
                </th>
              )}
              {columns.email && (
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#111827]">
                  Email
                </th>
              )}
              {columns.phone && (
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#111827]">
                  Phone
                </th>
              )}
              {columns.credits && (
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#111827]">
                  Credits
                </th>
              )}
              {columns.courses && (
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#111827]">
                  Courses
                </th>
              )}
              {columns.joined && (
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#111827]">
                  Joined
                </th>
              )}
              {columns.actions && (
                <th className="px-6 py-4 text-right text-sm font-semibold text-[#111827]">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-[#F9FAFB] transition-colors">
                {columns.name && (
                  <td className="px-6 py-4">
                    <Link
                      href={`/dashboard/students/${student.id}`}
                      className="font-medium text-[#111827] hover:text-[#4F46E5]"
                    >
                      {student.first_name} {student.last_name}
                    </Link>
                  </td>
                )}
                {columns.email && (
                  <td className="px-6 py-4 text-gray-600">{student.email}</td>
                )}
                {columns.phone && (
                  <td className="px-6 py-4 text-gray-600">
                    {student.phone ? (
                      <a
                        href={`tel:${student.phone}`}
                        className="text-[#4F46E5] hover:underline cursor-pointer"
                      >
                        {student.phone}
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                )}
                {columns.credits && (
                  <td className="px-6 py-4">
                    <StudentPopover
                      type="credits"
                      credits={student.totalRemainingCredits}
                      packageDetails={student.packageDetails}
                      filteredDanceTypeId={filteredDanceTypeId}
                    />
                  </td>
                )}
                {columns.courses && (
                  <td className="px-6 py-4">
                    <StudentPopover
                      type="courses"
                      courses={getCoursesForStudent(student)}
                    />
                  </td>
                )}
                {columns.joined && (
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(student.created_at).toLocaleDateString()}
                  </td>
                )}
                {columns.actions && (
                  <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                    <Link href={`/dashboard/students/${student.id}/edit`}>
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
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden grid grid-cols-1 gap-3 sm:gap-4">
        {students.map((student) => (
          <div key={student.id} className="bg-white border border-[#E5E7EB] rounded-lg p-3 sm:p-4 hover:shadow transition-shadow">
            {/* Header with name and actions */}
            <div className="flex justify-between items-start mb-3 gap-2">
              <Link href={`/dashboard/students/${student.id}`}>
                <h3 className="font-semibold text-sm text-[#111827] hover:text-[#4F46E5]">
                  {student.first_name} {student.last_name}
                </h3>
              </Link>
              {columns.actions && (
                <div className="flex gap-1">
                  <Link href={`/dashboard/students/${student.id}/edit`}>
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
              )}
            </div>

            {/* Details Grid */}
            <div className="space-y-2 text-xs sm:text-sm">
              {columns.email && student.email && (
                <div>
                  <p className="text-[#9CA3AF] font-medium">Email</p>
                  <p className="text-[#111827]">{student.email}</p>
                </div>
              )}
              {columns.phone && student.phone && (
                <div>
                  <p className="text-[#9CA3AF] font-medium">Phone</p>
                  <a href={`tel:${student.phone}`} className="text-[#4F46E5] hover:underline">
                    {student.phone}
                  </a>
                </div>
              )}
              {columns.credits && (
                <div>
                  <p className="text-[#9CA3AF] font-medium">Credits</p>
                  <StudentPopover
                    type="credits"
                    credits={student.totalRemainingCredits}
                    packageDetails={student.packageDetails}
                    filteredDanceTypeId={filteredDanceTypeId}
                  />
                </div>
              )}
              {columns.courses && (
                <div>
                  <p className="text-[#9CA3AF] font-medium">Courses</p>
                  <StudentPopover
                    type="courses"
                    courses={getCoursesForStudent(student)}
                  />
                </div>
              )}
              {columns.joined && (
                <div>
                  <p className="text-[#9CA3AF] font-medium">Joined</p>
                  <p className="text-[#111827]">{new Date(student.created_at).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

