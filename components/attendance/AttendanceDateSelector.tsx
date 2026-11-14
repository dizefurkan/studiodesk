'use client'

import { AttendanceDatePicker } from './AttendanceDatePickerNew'

interface AttendanceHistoryRecord {
  id: string
  session_date: string
  attendance_count: number
}

interface AttendanceDateSelectorProps {
  selectedDate: string
  onDateChange: (date: string) => void
  attendanceHistory?: AttendanceHistoryRecord[]
}

export function AttendanceDateSelector({
  selectedDate,
  onDateChange,
  attendanceHistory = [],
}: AttendanceDateSelectorProps) {
  // Convert attendance history to marked dates for visual highlighting
  const markedDates = attendanceHistory.map((record) => record.session_date)

  return (
    <AttendanceDatePicker
      value={selectedDate}
      onDateChange={onDateChange}
      markedDates={markedDates}
    />
  )
}
