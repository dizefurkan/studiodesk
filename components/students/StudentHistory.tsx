'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Zap, BookOpen, History } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { parseDateOnly } from '@/lib/i18n/dates'

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
  /** Show just one list, without the section title and the inner tab switch */
  view?: 'attendance' | 'credits'
}

export function StudentHistory({
  attendanceHistory,
  packageHistory,
  view,
}: StudentHistoryProps) {
  const tx = useTranslations('studentHistory')
  const locale = useLocale()
  const [selectedTab, setActiveTab] = useState<'attendance' | 'credits'>(
    'attendance'
  )
  const activeTab = view ?? selectedTab

  return (
    <div className="space-y-6">
      {!view && (<>
      <div>
        <div className="flex items-center gap-2 mb-2">
          <History size={24} className="text-primary" />
          <h2 className="text-2xl font-bold text-foreground">{tx('title')}</h2>
        </div>
        <p className="text-muted-foreground">{tx('description')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <Button
          onClick={() => setActiveTab('attendance')}
          variant="ghost"
          className={`px-4 py-2 font-medium ${
            activeTab === 'attendance'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground'
          }`}
        >
          <Calendar size={16} className="mr-2" />
          {tx('attendanceTab')}
        </Button>
        <Button
          onClick={() => setActiveTab('credits')}
          variant="ghost"
          className={`px-4 py-2 font-medium ${
            activeTab === 'credits'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground'
          }`}
        >
          <Zap size={16} className="mr-2" />
          {tx('creditTab')}
        </Button>
      </div>

      </>)}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          {attendanceHistory.length === 0 ? (
            <Card className="border-border p-8 text-center">
              <Calendar size={32} className="mx-auto text-muted-foreground/70 mb-2" />
              <p className="text-muted-foreground">{tx('noAttendance')}</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {attendanceHistory.map((record) => {
                const sessionDate = record.course_sessions?.session_date
                  ? parseDateOnly(record.course_sessions.session_date)
                  : null
                const course = record.course_sessions?.course

                return (
                  <Card
                    key={record.id}
                    className="border-green-200 bg-green-50 p-4 hover:border-green-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-foreground">
                          {course?.name || tx('unknownCourse')}
                        </h4>
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          {course?.dance_types?.name && (
                            <p>
                              {tx('danceTypeLabel')}{' '}
                              <span className="text-foreground">
                                {course.dance_types.name}
                              </span>
                            </p>
                          )}
                          {course?.branches?.name && (
                            <p>
                              {tx('branchLabel')}{' '}
                              <span className="text-foreground">
                                {course.branches.name}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-700 mb-1">
                          {tx('attended')}
                        </p>
                        {sessionDate && (
                          <p className="text-xs text-muted-foreground">
                            {tx('dateAt', {
                              date: sessionDate.toLocaleDateString(locale),
                              time: sessionDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
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
            <Card className="border-border p-8 text-center">
              <Zap size={32} className="mx-auto text-muted-foreground/70 mb-2" />
              <p className="text-muted-foreground">{tx('noPurchases')}</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {packageHistory.map((pkg) => {
                const purchaseDate = new Date(pkg.created_at)
                const totalCredits = pkg.package?.total_credits || 0
                const creditsRemaining = pkg.remaining_credits || 0
                const creditsUsed = totalCredits - creditsRemaining

                return (
                  <Card key={pkg.id} className="border-border p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {pkg.package?.name || tx('unknownPackage')}
                          </h4>
                          {pkg.package?.dance_types?.name && (
                            <p className="text-sm text-muted-foreground">
                              {pkg.package.dance_types.name}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm">
                          <p className="text-muted-foreground">
                            {tx('purchased', { date: purchaseDate.toLocaleDateString(locale) })}
                          </p>
                        </div>
                      </div>

                      {/* Credit Stats */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">{tx('total')}</p>
                          <p className="text-lg font-bold text-foreground">
                            {totalCredits}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">{tx('used')}</p>
                          <p className="text-lg font-bold text-amber-600">
                            {creditsUsed}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">
                            {tx('remaining')}
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
                        <div className="flex items-center gap-1 text-sm text-muted-foreground pt-2 border-t border-border">
                          <BookOpen size={14} />
                          <span>
                            {tx('classesAttended', { count: pkg.attendanceCount })}
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
