'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Zap, BookOpen, History } from 'lucide-react'

interface AttendanceHistoryItem {
  id: string
  created_at: string
  course_sessions?: {
    session_date: string
    course?: {
      id: string
      name: string
      dance_types?: { name: string }
      branches?: { name: string }
    }
  }
}

interface PackageHistoryItem {
  id: string
  created_at: string
  remaining_credits: number
  creditsUsed: number
  attendanceCount: number
  package?: {
    id: string
    name: string
    total_credits: number
    dance_types?: { name: string }
  }
}

interface StudentHistoryProps {
  attendanceHistory: AttendanceHistoryItem[]
  packageHistory: PackageHistoryItem[]
}

export function StudentHistory({
  attendanceHistory,
  packageHistory,
}: StudentHistoryProps) {
  const [activeTab, setActiveTab] = useState<'attendance' | 'credits'>(
    'attendance'
  )

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <History size={24} className="text-[#4F46E5]" />
          <h2 className="text-2xl font-bold text-[#111827]">History</h2>
        </div>
        <p className="text-gray-600">View your attendance records and credit usage</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#E5E7EB]">
        <Button
          onClick={() => setActiveTab('attendance')}
          variant="ghost"
          className={`px-4 py-2 font-medium ${
            activeTab === 'attendance'
              ? 'text-[#4F46E5] border-b-2 border-[#4F46E5]'
              : 'text-gray-600'
          }`}
        >
          <Calendar size={16} className="mr-2" />
          Attendance History
        </Button>
        <Button
          onClick={() => setActiveTab('credits')}
          variant="ghost"
          className={`px-4 py-2 font-medium ${
            activeTab === 'credits'
              ? 'text-[#4F46E5] border-b-2 border-[#4F46E5]'
              : 'text-gray-600'
          }`}
        >
          <Zap size={16} className="mr-2" />
          Credit History
        </Button>
      </div>

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          {attendanceHistory.length === 0 ? (
            <Card className="border-[#E5E7EB] p-8 text-center">
              <Calendar size={32} className="mx-auto text-[#9CA3AF] mb-2" />
              <p className="text-[#6B7280]">No attendance records yet</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {attendanceHistory.map((record) => {
                const sessionDate = record.course_sessions?.session_date
                  ? new Date(record.course_sessions.session_date)
                  : null
                const course = record.course_sessions?.course

                return (
                  <Card
                    key={record.id}
                    className="border-green-200 bg-green-50 p-4 hover:border-green-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-[#111827]">
                          {course?.name || 'Unknown Course'}
                        </h4>
                        <div className="text-sm text-gray-600 space-y-0.5">
                          {course?.dance_types?.name && (
                            <p>
                              Dance Type:{' '}
                              <span className="text-[#111827]">
                                {course.dance_types.name}
                              </span>
                            </p>
                          )}
                          {course?.branches?.name && (
                            <p>
                              Branch:{' '}
                              <span className="text-[#111827]">
                                {course.branches.name}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-700 mb-1">
                          ✓ Attended
                        </p>
                        {sessionDate && (
                          <p className="text-xs text-gray-600">
                            {sessionDate.toLocaleDateString()} at{' '}
                            {sessionDate.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Credits Tab */}
      {activeTab === 'credits' && (
        <div className="space-y-4">
          {packageHistory.length === 0 ? (
            <Card className="border-[#E5E7EB] p-8 text-center">
              <Zap size={32} className="mx-auto text-[#9CA3AF] mb-2" />
              <p className="text-[#6B7280]">No credit purchases yet</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {packageHistory.map((pkg) => {
                const purchaseDate = new Date(pkg.created_at)
                const totalCredits = pkg.package?.total_credits || 0
                const creditsRemaining = pkg.remaining_credits || 0
                const creditsUsed = totalCredits - creditsRemaining

                return (
                  <Card key={pkg.id} className="border-[#E5E7EB] p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-[#111827]">
                            {pkg.package?.name || 'Unknown Package'}
                          </h4>
                          {pkg.package?.dance_types?.name && (
                            <p className="text-sm text-gray-600">
                              {pkg.package.dance_types.name}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm">
                          <p className="text-gray-600">
                            Purchased:{' '}
                            {purchaseDate.toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Credit Stats */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E5E7EB]">
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-1">Total</p>
                          <p className="text-lg font-bold text-[#111827]">
                            {totalCredits}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-1">Used</p>
                          <p className="text-lg font-bold text-amber-600">
                            {creditsUsed}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 mb-1">
                            Remaining
                          </p>
                          <p
                            className={`text-lg font-bold ${
                              creditsRemaining === 0
                                ? 'text-red-600'
                                : 'text-green-600'
                            }`}
                          >
                            {creditsRemaining}
                          </p>
                        </div>
                      </div>

                      {/* Attendance count */}
                      {pkg.attendanceCount > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 pt-2 border-t border-[#E5E7EB]">
                          <BookOpen size={14} />
                          <span>
                            {pkg.attendanceCount} class{' '}
                            {pkg.attendanceCount === 1 ? 'attended' : 'attendances'}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
