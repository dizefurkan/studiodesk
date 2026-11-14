'use client'

import { Link } from '@/i18n/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'

export type UpcomingSession = {
  id: string
  session_date: string
  course_id: string
  course_name: string
  instructors: string[]
}

interface UpcomingCoursesCardProps {
  upcomingCourses: UpcomingSession[]
}

export function UpcomingCoursesCard({ upcomingCourses }: UpcomingCoursesCardProps) {
  const t = useTranslations()

  return (
    <Card className="border-border">
      <CardHeader className="pb-3 md:pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
        <div>
          <CardTitle className="text-lg sm:text-xl">{t('dashboard.upcomingCourses')}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {t('dashboard.coursesScheduled', { count: upcomingCourses.length })}
          </CardDescription>
        </div>
        <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
          <Link href="/dashboard/calendar">
            {t('common.viewDetails')}
            <ArrowRight />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {upcomingCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingCourses.slice(0, 6).map((session) => (
              <div
                key={session.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-input hover:bg-muted/50 transition-colors"
              >
                <div className="p-2 bg-highlight/20 rounded-lg flex-shrink-0">
                  <Calendar className="w-4 h-4 text-highlight-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate text-sm">
                    {session.course_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(session.session_date), 'MMM dd, yyyy')}
                  </p>
                  {session.instructors.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate">
                      {session.instructors.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-8 h-8 text-muted-foreground/70 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t('dashboard.noUpcomingCourses')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
