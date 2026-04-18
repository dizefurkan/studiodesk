'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteCourse } from '@/lib/actions/courses.actions'
import { useTranslations } from 'next-intl'
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal'

interface DeleteCourseButtonProps {
  courseId: string
  courseName?: string
}

export function DeleteCourseButton({ courseId, courseName = 'Course' }: DeleteCourseButtonProps) {
  const t = useTranslations()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async (reason?: string) => {
    setIsLoading(true)
    try {
      await deleteCourse(courseId, reason)
      window.location.reload()
    } catch (error) {
      console.error('Error deleting course:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="border-red-200 text-red-600 hover:bg-red-50"
        title="Delete"
        onClick={() => setIsOpen(true)}
      >
        <Trash2 size={16} />
      </Button>

      <DeleteConfirmModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleDelete}
        title="Delete Course"
        description={t('common.deleteConfirm')}
        itemName={courseName}
        withReason={true}
        isLoading={isLoading}
      />
    </>
  )
}
