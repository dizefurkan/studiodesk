import { getTranslations } from 'next-intl/server'
import { getHistoryLogs } from '@/lib/actions/history.actions'
import { HistoryComponent } from '@/components/history/HistoryComponent'

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations()
  
  // Fetch all history logs
  const historyLogs = await getHistoryLogs(100)

  return (
    <div className="space-y-4 md:space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
          {t('dashboard.recentActivity')}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          All activities and changes in your studio
        </p>
      </div>

      {/* History Component */}
      <HistoryComponent 
        logs={historyLogs} 
        title={t('dashboard.recentActivity')}
        description="Complete activity log"
        showFullPage={true}
      />
    </div>
  )
}
