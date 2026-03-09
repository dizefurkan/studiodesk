'use client'

import { Button } from '@/components/ui/button'

interface RemoveAttendanceButtonProps {
  attendanceId: string
}

export function RemoveAttendanceButton({ attendanceId }: RemoveAttendanceButtonProps) {
  const handleRemove = () => {
    if (confirm('Remove this attendance record?')) {
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
      Remove
    </Button>
  )
}
