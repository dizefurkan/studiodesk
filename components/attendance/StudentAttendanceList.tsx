'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react'
import { recordAttendance, removeAttendance } from '@/lib/actions/attendance.actions'
import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'

interface StudentForAttendance {
  id: string
  first_name: string
  last_name: string
  student_packages?: Array<{
    id: string
    remaining_credits: number
  }>
}

interface AttendanceRecord {
  id: string
  student_id: string
  student_package_id: string
  students?: {
    first_name: string
    last_name: string
  }
  student_packages?: {
    remaining_credits: number
  }
}

interface StudentAttendanceListProps {
  sessionId: string
  availableStudents: StudentForAttendance[]
  recordedAttendances: AttendanceRecord[]
  loading?: boolean
}

export function StudentAttendanceList({
  sessionId,
  availableStudents,
  recordedAttendances,
  loading,
}: StudentAttendanceListProps) {
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string>('')
  const router = useRouter()

  const recordedStudentIds = new Set(recordedAttendances.map((a) => a.student_id))

  const handleMarkPresent = useCallback(
    async (student: StudentForAttendance) => {
      if (!student.student_packages || student.student_packages.length === 0) {
        setError('Student has no active packages')
        return
      }

      setProcessing(student.id)
      setError('')

      try {
        const studentPackageId = student.student_packages[0].id
        const result = await recordAttendance(sessionId, student.id, studentPackageId)

        if (result.error) {
          setError(result.error)
        } else {
          router.refresh()
        }
      } catch (err) {
        setError('Failed to record attendance')
      } finally {
        setProcessing(null)
      }
    },
    [sessionId, router],
  )

  const handleRemoveAttendance = useCallback(
    async (attendanceId: string) => {
      const recordedStudent = recordedAttendances.find((a) => a.id === attendanceId)
      if (!recordedStudent) return

      setProcessing(attendanceId)
      setError('')

      try {
        const result = await removeAttendance(attendanceId, recordedStudent.student_package_id)

        if (result.error) {
          setError(result.error)
        } else {
          router.refresh()
        }
      } catch (err) {
        setError('Failed to remove attendance')
      } finally {
        setProcessing(null)
      }
    },
    [recordedAttendances, router],
  )

  const unrecordedStudents = availableStudents.filter((s) => !recordedStudentIds.has(s.id))

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="text-red-600 mt-0.5" size={20} />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Recorded Attendance */}
      {recordedAttendances.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-[#111827] mb-4">✅ Marked Present ({recordedAttendances.length})</h3>
          <div className="space-y-2">
            {recordedAttendances.map((record) => (
              <Card key={record.id} className="border-green-200 bg-green-50 p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-green-600" size={20} />
                    <div>
                      <p className="font-medium text-[#111827]">
                        {record.students?.first_name} {record.students?.last_name}
                      </p>
                      <p className="text-xs text-green-700">
                        Credits left: {record.student_packages?.remaining_credits}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAttendance(record.id)}
                    disabled={processing === record.id}
                    className="text-red-600 hover:bg-red-100"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available Students */}
      {unrecordedStudents.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-[#111827] mb-4">⭕ Not Yet Marked ({unrecordedStudents.length})</h3>
          <div className="space-y-2">
            {unrecordedStudents.map((student) => {
              const hasCredits = student.student_packages && student.student_packages.length > 0
              const creditsCount = hasCredits ? (student.student_packages?.[0]?.remaining_credits ?? 0) : 0

              return (
                <Card
                  key={student.id}
                  className={`p-4 ${
                    hasCredits ? 'border-[#E5E7EB] hover:border-[#4F46E5]' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Circle className="text-gray-400" size={20} />
                      <div>
                        <p className="font-medium text-[#111827]">
                          {student.first_name} {student.last_name}
                        </p>
                        {hasCredits ? (
                          <div className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 mt-1">
                            {creditsCount} credits
                          </div>
                        ) : (
                          <p className="text-xs text-red-700 font-medium">No active packages</p>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleMarkPresent(student)}
                      disabled={!hasCredits || processing === student.id || loading}
                      className="bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2"
                      size="sm"
                    >
                      <Plus size={16} />
                      Mark Present
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {availableStudents.length === 0 && recordedAttendances.length === 0 && (
        <Card className="border-[#E5E7EB] p-12 text-center">
          <p className="text-[#6B7280]">No students available for this session</p>
          <p className="text-sm text-gray-500 mt-1">Students must have active packages to attend sessions</p>
        </Card>
      )}
    </div>
  )
}
