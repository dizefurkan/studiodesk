'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Calendar } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'

interface RecentActivityCardProps {
  activities: Array<{
    type: string
    title: string
    date: string
    icon: string
  }>
}

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
  const t = useTranslations()

  const getActivityIcon = (iconName: string) => {
    switch (iconName) {
      case 'calendar':
        return <Calendar className="w-4 h-4 text-blue-600" />
      default:
        return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <Card className="border-[#E5E7EB] h-full">
      <CardHeader className="pb-3 md:pb-6">
        <CardTitle className="text-lg sm:text-xl">{t('dashboard.recentActivity')}</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Latest actions in your studio
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.slice(0, 4).map((activity, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-2 md:p-3 rounded-lg border border-[#E5E7EB] hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  {getActivityIcon(activity.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm text-[#111827] break-words">{activity.title}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {format(new Date(activity.date), 'MMM dd, HH:mm')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs md:text-sm text-gray-600">{t('dashboard.noRecentActivity')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
