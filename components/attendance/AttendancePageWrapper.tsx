'use client'

import { useState } from 'react'
import { AttendanceDateSelector } from './AttendanceDateSelector'
import { StudentAttendanceList } from './StudentAttendanceList'

interface AttendancePageWrapperProps {
  sessionId: string
  courseId: string
  danceTypeId: string
  availableStudents: any[]
  recordedAttendances: any[]
  attendanceHistory?: any[]
  studios?: any[]
  instructors?: any[]
}

export function AttendancePageWrapper({
  sessionId,
  courseId,
  danceTypeId,
  availableStudents,
  recordedAttendances,
  attendanceHistory = [],
  studios = [],
  instructors = [],
}: AttendancePageWrapperProps) {
  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(today)

  return (
    <div className="space-y-6">
      {/* Date Selector at Page Level */}
      <AttendanceDateSelector 
        selectedDate={selectedDate} 
        onDateChange={setSelectedDate}
        attendanceHistory={attendanceHistory}
      />

      {/* Student Attendance List */}
      <StudentAttendanceList
        sessionId={sessionId}
        courseId={courseId}
        danceTypeId={danceTypeId}
        availableStudents={availableStudents}
        recordedAttendances={recordedAttendances}
        attendanceHistory={attendanceHistory}
        studios={studios}
        instructors={instructors}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />
    </div>
  )
}
