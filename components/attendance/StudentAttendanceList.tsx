'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Trash2, Save, AlertCircle, Calendar } from 'lucide-react'
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
  is_present?: boolean
  notes?: string | null
  students?: {
    first_name: string
    last_name: string
  }
  student_packages?: {
    remaining_credits: number
  }
}

interface AttendanceHistoryRecord {
  id: string
  session_date: string
  attendance_count: number
}

interface Studio {
  id: string
  name: string
  capacity?: number
}

interface StudentAttendanceListProps {
  sessionId: string
  courseId: string
  availableStudents: StudentForAttendance[]
  recordedAttendances: AttendanceRecord[]
  attendanceHistory?: AttendanceHistoryRecord[]
  loading?: boolean
  studios?: Studio[]
  instructors?: Array<{ id: string; first_name: string; last_name: string }>
  selectedDate?: string
  onDateChange?: (date: string) => void
}

type AttendanceStatus = 'geldi' | 'gelmedi' | 'none'

interface AttendanceState {
  studentId: string
  status: AttendanceStatus
  existingAttendanceId?: string
  notes: string
  deductCredits: boolean  // New: Controls whether to deduct credits
}

export function StudentAttendanceList({
  sessionId,
  courseId,
  availableStudents,
  recordedAttendances,
  attendanceHistory = [],
  loading,
  studios = [],
  instructors = [],
  selectedDate: propSelectedDate,
  onDateChange,
}: StudentAttendanceListProps) {
  const router = useRouter()
  const [attendanceState, setAttendanceState] = useState<AttendanceState[]>([])
  const [savingBatch, setSavingBatch] = useState(false)
  const [error, setError] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [selectedStudioId, setSelectedStudioId] = useState<string | null>(null)
  const [selectedInstructorIds, setSelectedInstructorIds] = useState<string[]>([])
  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState<string>(
    propSelectedDate || today
  )

  // Helper: format date display (Today or X days after DATE DAYNAME)
  const formatDateDisplay = (date: string) => {
    if (date === today) return 'Today'
    
    const selected = new Date(date)
    const todayDate = new Date(today)
    const diffTime = Math.abs(selected.getTime() - todayDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const dayName = selected.toLocaleString('en-US', { weekday: 'long' })
    const formattedDate = selected.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    
    return `${diffDays} days after ${formattedDate} ${dayName}`
  }

  // Filter attendance history to last 30 days
  const lastMonthAttendances = useMemo(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]
    
    return (attendanceHistory || []).filter(
      (a) => a.session_date >= thirtyDaysAgoStr
    )
  }, [attendanceHistory])

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
    console.log(`[StudentAttendanceList] handleStatusChange: ${studentId} -> ${newStatus}`)
    setAttendanceState((prev) => {
      const existing = prev.find((a) => a.studentId === studentId)
      if (existing && existing.status === newStatus) {
        // Already selected - do nothing (keep it selected)
        console.log(`[StudentAttendanceList] Already ${newStatus}, keeping`)
        return prev
      } else if (existing) {
        // Change status
        const newState = prev.map((a) => (a.studentId === studentId ? { ...a, status: newStatus } : a))
        console.log(`[StudentAttendanceList] Updated state:`, newState)
        return newState
      } else {
        // Add new status
        const newState = [...prev, { studentId, status: newStatus, notes: '', deductCredits: true }]
        console.log(`[StudentAttendanceList] Added new state:`, newState)
        return newState
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

  const handleDeductCreditsChange = (studentId: string, deductCredits: boolean) => {
    setAttendanceState((prev) => {
      const existing = prev.find((a) => a.studentId === studentId)
      if (existing) {
        return prev.map((a) => (a.studentId === studentId ? { ...a, deductCredits } : a))
      }
      return prev
    })
  }

  const handleSaveAttendance = async () => {
    console.log('[StudentAttendanceList] Save button clicked, attendanceState:', attendanceState)
    setError('')
    setSuccessMessage('')

    const presentRecords = attendanceState.filter((a) => a.status === 'geldi')
    const absentWithNotesRecords = attendanceState.filter((a) => a.status === 'gelmedi' && a.notes)
    const allRecordsToSave = [...presentRecords, ...absentWithNotesRecords]
    
    console.log('[StudentAttendanceList] Present records:', presentRecords)
    console.log('[StudentAttendanceList] Absent with notes records:', absentWithNotesRecords)

    if (allRecordsToSave.length === 0) {
      console.log('[StudentAttendanceList] No records to save')
      setError('Please mark at least one student as "Geldi" or add notes for absent students to save')
      return
    }

    setSavingBatch(true)
    console.log('[StudentAttendanceList] Starting batch save...')

    try {
      const batchData = allRecordsToSave.map((record) => {
        const student = availableStudents.find((s) => s.id === record.studentId)
        const studentPackageId = student?.student_packages?.[0]?.id || ''
        const deductCredits = record.deductCredits !== false  // Default to true
        console.log(`[StudentAttendanceList] Preparing batch for ${record.studentId}, packageId: ${studentPackageId}, status: ${record.status}, deductCredits: ${deductCredits}`)

        return {
          studentId: record.studentId,
          studentPackageId,
          status: record.status,
          notes: record.notes || undefined,
          deductCredits,  // Pass this to server action
        }
      })

      console.log('[StudentAttendanceList] Calling recordBatchAttendance with:', { courseId, sessionId, batchData, studioId: selectedStudioId, instructorIds: selectedInstructorIds, date: selectedDate })
      const result = await recordBatchAttendance(courseId, sessionId, batchData, selectedStudioId, selectedInstructorIds, selectedDate)
      console.log('[StudentAttendanceList] recordBatchAttendance result:', result)

      if (result.error) {
        console.log('[StudentAttendanceList] Error from recordBatchAttendance:', result.error)
        setError(result.error)
      } else if (result.success) {
        console.log('[StudentAttendanceList] Success! Recorded:', result.data.recordedCount)
        const markedCount = presentRecords.length
        const notesCount = absentWithNotesRecords.length
        let message = '✅ Attendance saved! '
        if (markedCount > 0) {
          message += `${markedCount} student${markedCount !== 1 ? 's' : ''} marked present. `
        }
        if (notesCount > 0) {
          message += `${notesCount} absence note${notesCount !== 1 ? 's' : ''} recorded.`
        }
        setSuccessMessage(message)
        setAttendanceState([])
        // Force hard page refresh to reload today's attendance from database
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }
    } catch (err) {
      console.error('[StudentAttendanceList] Unexpected error:', err)
      setError('Failed to save attendance')
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
  
  // Count how many are marked present in current state
  const pendingPresent = attendanceState.filter((a) => a.status === 'geldi').length
  const pendingAbsentWithNotes = attendanceState.filter((a) => a.status === 'gelmedi' && a.notes).length
  const totalPendingRecords = pendingPresent + pendingAbsentWithNotes
  
  // Debug render
  console.log('[StudentAttendanceList] Render state:', {
    studentsWithCredits: studentsWithCredits.length,
    pendingPresent,
    pendingAbsentWithNotes,
    attendanceState,
    availableStudents: availableStudents.length,
    recordedAttendances: recordedAttendances.length,
  })

  return (
    <div className="space-y-6">
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

      {/* Students with Credits Section - Table Format */}
      {studentsWithCredits.length > 0 && (
        <div className="space-y-4">
          {/* Calendar Heat Map - Last 30 days */}
          {lastMonthAttendances.length > 0 && (
            <Card className="border-[#E5E7EB] p-4 bg-blue-50">
              <div className="flex items-start gap-3 mb-3">
                <Calendar className="text-[#4F46E5] mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-medium text-[#111827]">Attendance History (Last 30 days)</p>
                  <p className="text-xs text-gray-600 mt-1">{lastMonthAttendances.length} session(s) recorded</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {lastMonthAttendances.map((record) => (
                  <button
                    key={record.session_date}
                    onClick={() => {
                      setSelectedDate(record.session_date)
                      onDateChange?.(record.session_date)
                    }}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      selectedDate === record.session_date
                        ? 'bg-[#4F46E5] text-white'
                        : 'bg-white border border-[#E5E7EB] text-[#111827] hover:border-[#4F46E5]'
                    }`}
                    title={`${record.attendance_count} students`}
                  >
                    {new Date(record.session_date).toLocaleDateString('tr-TR', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </button>
                ))}
              </div>
            </Card>
          )}

          <h3 className="text-lg font-semibold text-[#111827]">Mark Attendance ({studentsWithCredits.length} students)</h3>
          <div className="overflow-x-auto border border-[#E5E7EB] rounded-lg">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 sticky top-0 border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#111827]">Student Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#111827]">Credits</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#111827]">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#111827]">Deduct Credits</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#111827]">Notes</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-[#111827]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
              {studentsWithCredits.map((student) => {
                const creditsCount = student.student_packages?.[0]?.remaining_credits ?? 0
                const currentState = attendanceState.find((a) => a.studentId === student.id)
                const recordedAttendance = recordedMap.get(student.id)
                const isMarked = !!recordedAttendance

                return (
                  <tr
                    key={student.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      isMarked ? 'bg-green-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-[#111827]">
                      {student.first_name} {student.last_name}
                      {isMarked && <span className="ml-2 text-xs font-semibold text-green-700">✓</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        {creditsCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusChange(student.id, 'geldi')}
                          className={`px-3 py-1 rounded-lg font-medium text-xs transition-colors ${
                            currentState?.status === 'geldi' || (isMarked && !currentState && recordedAttendance?.is_present)
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-green-100'
                          }`}
                        >
                          ✓ Geldi
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.id, 'gelmedi')}
                          className={`px-3 py-1 rounded-lg font-medium text-xs transition-colors ${
                            currentState?.status === 'gelmedi' || (isMarked && !currentState && !recordedAttendance?.is_present)
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-red-100'
                          }`}
                        >
                          ✗ Gelmedi
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {((currentState?.status === 'geldi' || currentState?.status === 'gelmedi') || (isMarked && recordedAttendance?.notes)) && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentState?.deductCredits ?? true}
                            onChange={(e) => handleDeductCreditsChange(student.id, e.target.checked)}
                            className="rounded cursor-pointer accent-[#4F46E5]"
                            title="Kredi düşsün mü?"
                          />
                          <span className="text-xs text-gray-600">Evet</span>
                        </label>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {((currentState?.status === 'geldi' || currentState?.status === 'gelmedi') || (isMarked && recordedAttendance?.notes)) && (
                        <Input
                          placeholder="Note"
                          value={currentState?.notes || recordedAttendance?.notes || ''}
                          onChange={(e) => handleNotesChange(student.id, e.target.value)}
                          className="text-xs py-1 px-2"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {isMarked && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAttendance(recordedAttendance.id, recordedAttendance.student_package_id)}
                          className="text-red-600 hover:bg-red-100"
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
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

      {/* Studio Selection, Instructor Selection & Save Button */}
      {studentsWithCredits.length > 0 && totalPendingRecords > 0 && (
        <div className="space-y-4">
          {/* Selections Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studios && studios.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  Studio (Optional)
                </label>
                <select
                  value={selectedStudioId || ''}
                  onChange={(e) => setSelectedStudioId(e.target.value || null)}
                  className="w-full border border-[#D1D5DB] rounded px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                >
                  <option value="">No specific studio</option>
                  {studios.map((studio: any) => (
                    <option key={studio.id} value={studio.id}>
                      {studio.name} {studio.capacity ? `(${studio.capacity})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {instructors && instructors.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  Instructors (Optional)
                </label>
                <div className="space-y-2 border border-[#D1D5DB] rounded px-3 py-2">
                  {instructors.map((instructor) => (
                    <label key={instructor.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedInstructorIds.includes(instructor.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedInstructorIds([...selectedInstructorIds, instructor.id])
                          } else {
                            setSelectedInstructorIds(selectedInstructorIds.filter(id => id !== instructor.id))
                          }
                        }}
                        className="w-4 h-4 text-[#4F46E5] rounded focus:ring-2 focus:ring-[#4F46E5]"
                      />
                      <span className="text-sm text-[#111827]">
                        {instructor.first_name} {instructor.last_name}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedInstructorIds.length > 0 
                    ? `${selectedInstructorIds.length} instructor${selectedInstructorIds.length !== 1 ? 's' : ''} selected`
                    : 'Leave unchecked to use course instructors'}
                </p>
              </div>
            )}
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSaveAttendance}
            disabled={savingBatch}
            className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2 py-2.5"
            size="lg"
          >
            <Save size={18} />
            {savingBatch ? 'Saving...' : `Save Attendance (${totalPendingRecords} record${totalPendingRecords !== 1 ? 's' : ''})`}
          </Button>
        </div>
      )}
    </div>
  )
}
