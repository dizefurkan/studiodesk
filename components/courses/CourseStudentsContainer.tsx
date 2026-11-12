'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CourseStudentsSection } from './CourseStudentsSection'
import { AddStudentDialog } from './AddStudentDialog'
import { Users } from 'lucide-react'

interface CourseStudentsContainerProps {
  courseId: string
  danceTypeId: string
}

export function CourseStudentsContainer({ courseId, danceTypeId }: CourseStudentsContainerProps) {
  const t = useTranslations()
  const [refreshKey, setRefreshKey] = useState(0)
  const [studentCount, setStudentCount] = useState(0)

  const handleStudentsAdded = () => {
    // Trigger a re-render of CourseStudentsSection by changing the key
    // This will cause the component to unmount and remount, reloading the student list
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-primary" />
          <h2 className="text-2xl font-bold text-foreground">
            {t('courses.enrolledStudents')}
            {studentCount > 0 && <span className="text-lg font-normal text-muted-foreground ml-2">({studentCount})</span>}
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
        key={`students-${refreshKey}`} 
        courseId={courseId} 
        danceTypeId={danceTypeId}
        onStudentsLoaded={(count) => setStudentCount(count)}
      />
    </div>
  )
}
