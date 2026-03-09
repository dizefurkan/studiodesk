'use client'

import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteCourse } from '@/lib/actions/courses.actions'

interface DeleteCourseButtonProps {
  courseId: string
}

export function DeleteCourseButton({ courseId }: DeleteCourseButtonProps) {
  const handleDelete = async () => {
    if (confirm('Delete this course?')) {
      try {
        await deleteCourse(courseId)
        window.location.reload()
      } catch (error) {
        console.error('Error deleting course:', error)
        alert('Failed to delete course')
      }
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="border-red-200 text-red-600 hover:bg-red-50"
      title="Delete"
      onClick={handleDelete}
    >
      <Trash2 size={16} />
    </Button>
  )
}
