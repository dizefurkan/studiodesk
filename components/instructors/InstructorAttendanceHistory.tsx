'use client'

import { Link } from '@/i18n/navigation'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import {
  getInstructorAttendanceHistory,
  type InstructorSessionHistory as Session,
} from '@/lib/actions/instructor-detail.actions'
import { useLocale, useTranslations } from 'next-intl'

interface InstructorAttendanceHistoryProps {
  instructorId: string
  showCourseInfo?: boolean
  showInstructors?: boolean
}

export function InstructorAttendanceHistory({ 
  instructorId, 
  showCourseInfo = false,
  showInstructors = false 
}: InstructorAttendanceHistoryProps) {
  const tx = useTranslations('instructorAttendance')
  const locale = useLocale()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const result = await getInstructorAttendanceHistory(instructorId)
        if (result.data) {
          setSessions(result.data)
        }
      } catch (error) {
        console.error('Error loading instructor attendance history:', error)
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [instructorId])

  if (loading) {
    return (
      <div className="border-t border-border pt-8">
        <h2 className="text-2xl font-bold text-foreground mb-4">{tx('title')}</h2>
        <Card className="border-border p-6 text-center text-muted-foreground">
          {tx('loading')}
        </Card>
      </div>
    )
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="border-t border-border pt-8">
        <h2 className="text-2xl font-bold text-foreground mb-4">{tx('title')}</h2>
        <Card className="border-border p-6 text-center text-muted-foreground">
          {tx('empty')}
        </Card>
      </div>
    )
  }

  return (
    <div className="border-t border-border pt-8">
      <h2 className="text-2xl font-bold text-foreground mb-4">{tx('title')}</h2>

      <div className="space-y-2">
        {sessions.map((session) => {
          const presentCount = session.attendance.filter((r) => r.is_present).length
          
          return (
            <details key={session.sessionId} className="border border-border rounded-lg hover:border-primary transition-colors group">
              <summary className="p-4 cursor-pointer hover:bg-muted/50 transition-colors flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex flex-col gap-1">
                    <p className="font-medium text-foreground">
                      {new Date(session.session_date).toLocaleDateString(locale, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long',
                      })}
                    </p>
                    {showCourseInfo && (
                      <>
                        <p className="text-sm text-foreground/80 font-semibold">📚 {session.course_name}</p>
                        {session.dance_type && (
                          <p className="text-sm text-muted-foreground">💃 {session.dance_type}</p>
                        )}
                      </>
                    )}
                    {showInstructors && session.instructors && session.instructors.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        👥 {session.instructors.map((inst) => inst.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {tx('presentSummary', { present: presentCount, total: session.attendance.length })}
                  </p>
                </div>
                <div className="flex items-center gap-3 self-start md:self-center md:ml-4">
                  <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    {presentCount}/{session.attendance.length}
                  </span>
                  <Link href={`/dashboard/attendance/${session.sessionId}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline">
                    {tx('viewDetails')}
                  </Link>
                </div>
              </summary>
              <div className="px-4 pb-4 border-t border-border pt-4 bg-muted/50">
                <p className="text-sm font-semibold text-foreground mb-3">{tx('attendanceLabel')}</p>
                <div className="space-y-2">
                  {session.attendance.map((att, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 text-sm">
                      <span className={`font-bold ${att.is_present ? 'text-green-600' : 'text-red-600'}`}>
                        {att.is_present ? '✓' : '✗'}
                      </span>
                      <Link href={`/dashboard/students/${att.students?.id}`} className="text-primary hover:underline font-medium flex-1">
                        {att.students?.first_name} {att.students?.last_name}
                      </Link>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        att.is_present
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {att.is_present ? tx('present') : tx('absent')}
                      </span>
                      {att.notes && <span className="text-muted-foreground">/{att.notes}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </details>
          )
        })}
      </div>
    </div>
  )
}
