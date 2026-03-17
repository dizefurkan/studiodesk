'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Trash2, Save, AlertCircle } from 'lucide-react'
import { recordBatchAttendance, removeAttendance } from '@/lib/actions/attendance.actions'
import { useRouter } from 'next/navigation'

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

type AttendanceStatus = 'geldi' | 'gelmedi' | 'none'

interface AttendanceState {
  studentId: string
  status: AttendanceStatus
  existingAttendanceId?: string
  notes: string
}

export function StudentAttendanceList({
  sessionId,
  availableStudents,
  recordedAttendances,
  loading,
}: StudentAttendanceListProps) {
  const router = useRouter()
  const [attendanceState, setAttendanceState] = useState<AttendanceState[]>([])
  const [savingBatch, setSavingBatch] = useState(false)
  const [error, setError] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')

  // Create a map of recorded attendances for quick lookup
  const recordedMap = useMemo(
    () => new Map(recordedAttendances.map((a) => [a.student_id, a])),
    [recordedAttendances],
  )

  // Separate students: with credits vs needing renewal
  const studentsWithCredits = useMemo(
    () =>
      availableStudents.filter(
        (s) => s.student_packages && s.student_packages.some((sp) => sp.remaining_credits > 0),
      ),
    [availableStudents],
  )

  const studentsNeedingRenewal = useMemo(
    () =>
      availableStudents.filter(
        (s) => !s.student_packages || s.student_packages.every((sp) => sp.remaining_credits === 0),
      ),
    [availableStudents],
  )

  const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
    setAttendanceState((prev) => {
      const existing = prev.find((a) => a.studentId === studentId)
      if (existing) {
        if (newStatus === existing.status) {
          // Toggle off
          return prev.filter((a) => a.studentId !== studentId)
        } else {
          return prev.map((a) => (a.studentId === studentId ? { ...a, status: newStatus } : a))
        }
      } else {
        return [...prev, { studentId, status: newStatus, notes: '' }]
      }
    })
    setError('')
    setSuccessMessage('')
  }

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendanceState((prev) => {
      const existing = prev.find((a) => a.studentId === studentId)
      if (existing) {
        return prev.map((a) => (a.studentId === studentId ? { ...a, notes } : a))
      }
      return prev
    })
  }

  const handleSaveAttendance = async () => {
    setError('')
    setSuccessMessage('')

    const geldiRecords = attendanceState.filter((a) => a.status === 'geldi')

    if (geldiRecords.length === 0) {
      setError('Please mark at least one student as "Geldi" to save')
      return
    }

    setSavingBatch(true)

    try {
      const batchData = geldiRecords.map((record) => {
        const student = availableStudents.find((s) => s.id === record.studentId)
        const studentPackageId = student?.student_packages?.[0]?.id || ''

        return {
          studentId: record.studentId,
          studentPackageId,
          status: 'geldi' as const,
          notes: record.notes,
        }
      })

      const result = await recordBatchAttendance(sessionId, batchData)

      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        setSuccessMessage(
          `✅ Attendance saved! ${result.data.recordedCount} students marked present.`,
        )
        setAttendanceState([])
        setTimeout(() => {
          router.refresh()
        }, 1000)
      }
    } catch (err) {
      setError('Failed to save attendance')
      console.error(err)
    } finally {
      setSavingBatch(false)
    }
  }

  const handleRemoveAttendance = async (attendanceId: string, studentPackageId: string) => {
    if (!confirm('Remove this attendance record?')) return

    setError('')

    try {
      const result = await removeAttendance(attendanceId, studentPackageId)

      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    } catch (err) {
      setError('Failed to remove attendance')
    }
  }

  const totalStudents = availableStudents.length
  const markedCount = recordedAttendances.length
  
  // Count how many are marked Geldi in current state
  const pendingGeldi = attendanceState.filter((a) => a.status === 'geldi').length

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <Card className="border-[#E5E7EB] p-4 bg-linear-to-r from-blue-50 to-indigo-50">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Students</p>
            <p className="text-2xl font-bold text-[#111827]">{totalStudents}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Already Marked</p>
            <p className="text-2xl font-bold text-green-600">{markedCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Pending to Mark</p>
            <p className="text-2xl font-bold text-orange-600">{totalStudents - markedCount}</p>
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="text-red-600 mt-0.5" size={20} />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Students with Credits Section */}
      {studentsWithCredits.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-[#111827] mb-4">Mark Attendance ({studentsWithCredits.length})</h3>
          <div className="space-y-3">
            {studentsWithCredits.map((student) => {
              const creditsCount = student.student_packages?.[0]?.remaining_credits ?? 0
              const currentState = attendanceState.find((a) => a.studentId === student.id)
              const recordedAttendance = recordedMap.get(student.id)
              const isMarked = !!recordedAttendance

              return (
                <Card
                  key={student.id}
                  className={`border p-4 transition-colors ${
                    isMarked ? 'border-green-300 bg-green-50' : 'border-[#E5E7EB] hover:border-[#4F46E5]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[#111827]">
                            {student.first_name} {student.last_name}
                          </p>
                          {isMarked && <span className="text-xs font-semibold text-green-700">✓ Marked</span>}
                        </div>
                        <div className="flex gap-2 mt-1">
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                            {creditsCount} credits
                          </span>
                        </div>
                      </div>
                      {isMarked && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAttendance(recordedAttendance.id, recordedAttendance.student_package_id)}
                          className="text-red-600 hover:bg-red-100"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>

                    {/* Status Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusChange(student.id, 'geldi')}
                        className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-colors ${
                          currentState?.status === 'geldi' || (isMarked && !currentState)
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-green-100'
                        }`}
                      >
                        ✓ Geldi
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'gelmedi')}
                        className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-colors ${
                          currentState?.status === 'gelmedi'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-red-100'
                        }`}
                      >
                        ✗ Gelmedi
                      </button>
                    </div>

                    {/* Notes Input */}
                    {(currentState?.status === 'geldi' || currentState?.status === 'gelmedi') && (
                      <Input
                        placeholder="Not (optional)"
                        value={currentState?.notes || ''}
                        onChange={(e) => handleNotesChange(student.id, e.target.value)}
                        className="text-sm"
                      />
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Students Needing Package Renewal */}
      {studentsNeedingRenewal.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-[#111827] mb-4">⚠️ Package Renewal Needed ({studentsNeedingRenewal.length})</h3>
          <div className="space-y-2">
            {studentsNeedingRenewal.map((student) => (
              <Card key={student.id} className="border-orange-200 bg-orange-50 p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-orange-600" size={20} />
                  <div>
                    <p className="font-medium text-[#111827]">
                      {student.first_name} {student.last_name}
                    </p>
                    <p className="text-xs text-orange-700 font-medium">Credits: 0 - Package renewal required</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {availableStudents.length === 0 && recordedAttendances.length === 0 && (
        <Card className="border-[#E5E7EB] p-12 text-center">
          <p className="text-[#6B7280]">No students available for this session</p>
          <p className="text-sm text-gray-500 mt-1">Students must be enrolled in this course to attend sessions</p>
        </Card>
      )}

      {/* Save Button */}
      {studentsWithCredits.length > 0 && pendingGeldi > 0 && (
        <div className="flex gap-2">
          <Button
            onClick={handleSaveAttendance}
            disabled={savingBatch}
            className="flex-1 bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2 py-2.5"
            size="lg"
          >
            <Save size={18} />
            {savingBatch ? 'Saving...' : `Save Attendance (${pendingGeldi} students)`}
          </Button>
        </div>
      )}
    </div>
  )
}
