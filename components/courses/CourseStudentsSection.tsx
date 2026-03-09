'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Trash2, Users } from 'lucide-react'
import { getCourseStudents, getAvailableStudentsForCourse, addStudentToCourse, removeStudentFromCourse } from '@/lib/actions/course-students.actions'

interface CourseStudent {
  id: string
  student_id: string
  joined_at: string
  students: {
    first_name: string
    last_name: string
    email: string
  }
}

interface AvailableStudent {
  id: string
  first_name: string
  last_name: string
}

interface CourseStudentsSectionProps {
  courseId: string
  danceTypeId: string
}

export function CourseStudentsSection({ courseId, danceTypeId }: CourseStudentsSectionProps) {
  const [students, setStudents] = useState<CourseStudent[]>([])
  const [availableStudents, setAvailableStudents] = useState<AvailableStudent[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load students on mount
  useEffect(() => {
    const loadStudents = async () => {
      setIsLoading(true)
      try {
        const [studentsResult, availableResult] = await Promise.all([
          getCourseStudents(courseId),
          getAvailableStudentsForCourse(courseId, danceTypeId),
        ])

        if (studentsResult.data) setStudents(studentsResult.data)
        if (availableResult.data) setAvailableStudents(availableResult.data)
      } catch (error) {
        console.error('Error loading students:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStudents()
  }, [courseId, danceTypeId])

  const handleAddStudent = async (studentId: string) => {
    setLoading(true)
    try {
      const result = await addStudentToCourse(courseId, studentId)
      if (result.success) {
        // Reload students
        const [studentsResult, availableResult] = await Promise.all([
          getCourseStudents(courseId),
          getAvailableStudentsForCourse(courseId, danceTypeId),
        ])
        if (studentsResult.data) setStudents(studentsResult.data)
        if (availableResult.data) setAvailableStudents(availableResult.data)
        setShowAddForm(false)
      } else {
        alert(result.error || 'Failed to add student')
      }
    } catch (error) {
      console.error('Error adding student:', error)
      alert('Failed to add student')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('Remove this student from the course?')) return

    setLoading(true)
    try {
      const result = await removeStudentFromCourse(courseId, studentId)
      if (result.success) {
        // Reload students
        const [studentsResult, availableResult] = await Promise.all([
          getCourseStudents(courseId),
          getAvailableStudentsForCourse(courseId, danceTypeId),
        ])
        if (studentsResult.data) setStudents(studentsResult.data)
        if (availableResult.data) setAvailableStudents(availableResult.data)
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

  if (isLoading) {
    return (
      <Card className="border-[#E5E7EB] p-6">
        <div className="text-center text-gray-500">Loading students...</div>
      </Card>
    )
  }

  return (
    <Card className="border-[#E5E7EB] p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-[#4F46E5]" />
          <h3 className="text-lg font-semibold text-[#111827]">Enrolled Students</h3>
          <span className="text-sm font-medium text-gray-600">({students.length})</span>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2"
          disabled={loading}
        >
          <Plus size={16} />
          Add Student
        </Button>
      </div>

      {/* Add Student Form */}
      {showAddForm && (
        <div className="mb-6 p-4 border border-[#E5E7EB] rounded-lg bg-gray-50">
          {availableStudents.length === 0 ? (
            <p className="text-gray-600 text-sm">
              No students with active packages for this dance type are available to add.
            </p>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#111827] block mb-2">
                Select Student to Add
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                {availableStudents.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => handleAddStudent(student.id)}
                    disabled={loading}
                    className="text-left p-3 border border-[#E5E7EB] rounded-lg hover:bg-[#4F46E5] hover:text-white hover:border-[#4F46E5] transition-colors disabled:opacity-50"
                  >
                    <div className="font-medium">
                      {student.first_name} {student.last_name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Students List */}
      {students.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Users size={32} className="mx-auto mb-2 opacity-50" />
          <p>No students enrolled yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {students.map((enrollment) => (
            <div
              key={enrollment.id}
              className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div>
                <div className="font-medium text-[#111827]">
                  {enrollment.students.first_name} {enrollment.students.last_name}
                </div>
                <div className="text-sm text-gray-600">{enrollment.students.email}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Joined {new Date(enrollment.joined_at).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => handleRemoveStudent(enrollment.student_id)}
                disabled={loading}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Remove student"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
