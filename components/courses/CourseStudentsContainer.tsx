'use client'

import { useRef, useState } from 'react'
import { CourseStudentsSection } from './CourseStudentsSection'
import { AddStudentDialog } from './AddStudentDialog'
import { Users } from 'lucide-react'

interface CourseStudentsContainerProps {
  courseId: string
  danceTypeId: string
}

export function CourseStudentsContainer({ courseId, danceTypeId }: CourseStudentsContainerProps) {
  const refreshKey = useRef(0)
  const [studentCount, setStudentCount] = useState(0)

  const handleStudentsAdded = () => {
    // Trigger a re-render of CourseStudentsSection by changing the ref
    // In practice, router.refresh() in AddStudentDialog should handle this
    // But we'll keep this for potential future use
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-[#4F46E5]" />
          <h2 className="text-2xl font-bold text-[#111827]">
            Enrolled Students
            {studentCount > 0 && <span className="text-lg font-normal text-gray-600 ml-2">({studentCount})</span>}
          </h2>
        </div>
        <AddStudentDialog
          courseId={courseId}
          danceTypeId={danceTypeId}
          enrolledStudentIds={[]}
          onStudentsAdded={handleStudentsAdded}
        />
      </div>
      <CourseStudentsSection 
        key={`students-${refreshKey.current}`} 
        courseId={courseId} 
        danceTypeId={danceTypeId}
        onStudentsLoaded={(count) => setStudentCount(count)}
      />
    </div>
  )
}
