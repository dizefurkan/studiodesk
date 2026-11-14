'use client'

import { useState } from 'react'
import { AttendanceHeader } from './AttendanceHeader'
import { StudentAttendanceList } from './StudentAttendanceList'

type ListProps = React.ComponentProps<typeof StudentAttendanceList>

interface AttendancePageWrapperProps {
  sessionId: string
  courseId: string
  courseName: string
  danceTypeId: string
  availableStudents: ListProps['availableStudents']
  recordedAttendances: ListProps['recordedAttendances']
  attendanceHistory?: ListProps['attendanceHistory']
  studios?: ListProps['studios']
  instructors?: ListProps['instructors']
  allInstructors?: ListProps['allInstructors']
  instructorRates?: ListProps['instructorRates']
  totalEnrolled?: number
  presentCount?: number
  absentCount?: number
}

export function AttendancePageWrapper({
  sessionId,
  courseId,
  courseName,
  danceTypeId,
  availableStudents,
  recordedAttendances,
  attendanceHistory = [],
  studios = [],
  instructors = [],
  allInstructors = [],
  instructorRates = [],
  totalEnrolled = 0,
  presentCount = 0,
  absentCount = 0,
}: AttendancePageWrapperProps) {
  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(today)

  return (
    <div className="space-y-6">
      {/* Header with Title and Date Selector */}
      <AttendanceHeader
        courseName={courseName}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        attendanceHistory={attendanceHistory}
        totalEnrolled={totalEnrolled}
        presentCount={presentCount}
        absentCount={absentCount}
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
        allInstructors={allInstructors}
        instructorRates={instructorRates}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />
    </div>
  )
}
