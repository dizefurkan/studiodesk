import { Link } from '@/i18n/navigation'
import { getCourse, getCourseSessions } from '@/lib/actions/courses.actions'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, BookOpen } from 'lucide-react'
import { formatTime } from '@/lib/utils/formatTime'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface SessionsPageProps {
  params: {
    id: string
  }
}

export default async function SessionsPage({ params }: SessionsPageProps) {
  const { id } = await params
  const courseResult = await getCourse(id)

  if (courseResult.error || !courseResult.data) {
    notFound()
  }

  const course = courseResult.data

  // Get next 12 weeks of sessions
  const today = new Date()
  const in12Weeks = new Date(today.getTime() + 12 * 7 * 24 * 60 * 60 * 1000)
  const sessionsResult = await getCourseSessions(
    course.id,
    today.toISOString().split('T')[0],
    in12Weeks.toISOString().split('T')[0],
  )

  const sessions = sessionsResult.data || []

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/dashboard/courses/${course.id}`} className="text-primary hover:underline mb-4 inline-block">
          ← Back to Course
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Sessions</h1>
        <p className="text-muted-foreground mt-1">
          {course.name} • {course.branches?.name}
        </p>
      </div>

      {/* Course Info */}
      <Card className="border-border p-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Schedule</p>
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              <span className="font-medium text-foreground">
                {DAYS[course.day_of_week]} {formatTime(course.start_time)} - {formatTime(course.end_time)}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Total Sessions</p>
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              <span className="font-medium text-foreground">{sessions.length} sessions</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <Card className="border-border p-12 text-center">
          <div className="text-muted-foreground">
            <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No sessions scheduled</p>
            <p className="text-sm mt-1">Sessions will be auto-generated on the schedule day</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Card key={session.id} className="border-border p-4 hover:border-primary hover:shadow-sm transition-all">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <Calendar className="text-primary" size={20} />
                    <div>
                      <p className="font-medium text-foreground">{session.session_date}</p>
                      <p className="text-sm text-muted-foreground">
                        {DAYS[new Date(session.session_date).getDay()]} • {formatTime(course.start_time)}
                      </p>
                    </div>
                  </div>
                </div>

                <Link href={`/dashboard/attendance?session=${session.id}`}>
                  <Button size="sm" >
                    Mark Attendance
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
