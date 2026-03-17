'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Trash2, Users } from 'lucide-react'
import { getCourseStudents, removeStudentFromCourse } from '@/lib/actions/course-students.actions'
import { AddStudentDialog } from './AddStudentDialog'

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
  const [loading, setLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load students on mount
  const loadStudents = async () => {
    setIsLoading(true)
    try {
      const result = await getCourseStudents(courseId)
      if (result.data) setStudents(result.data)
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
    if (!confirm('Remove this student from the course?')) return

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

  const handleStudentsAdded = () => {
    loadStudents()
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
        <AddStudentDialog
          courseId={courseId}
          danceTypeId={danceTypeId}
          onStudentsAdded={handleStudentsAdded}
        />
      </div>

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
