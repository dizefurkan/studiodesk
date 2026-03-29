'use client'

import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

interface RemoveAttendanceButtonProps {
  attendanceId: string
}

export function RemoveAttendanceButton({ attendanceId }: RemoveAttendanceButtonProps) {
  const t = useTranslations()

  const handleRemove = () => {
    if (confirm(t('common.deleteConfirm'))) {
      // Remove attendance functionality
      window.location.reload()
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="border-red-200 text-red-600 hover:bg-red-50"
      onClick={handleRemove}
    >
      {t('common.delete')}
    </Button>
  )
}
