import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { listDemoRequests } from '@/lib/actions/demo-requests.actions'
import { DemoRequestsList } from '@/components/backoffice/DemoRequestsList'

export default async function DemoRequestsPage() {
  const t = await getTranslations('backoffice.demoRequests')
  const { data = [], error } = await listDemoRequests()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Card className="gap-0 p-0">
        <DemoRequestsList requests={data} />
      </Card>
    </div>
  )
}
