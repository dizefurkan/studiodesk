import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { listAccountOptions } from '@/lib/actions/backoffice.actions'
import { CreateStoreForm } from '@/components/backoffice/CreateStoreForm'

export default async function NewStorePage() {
  const t = await getTranslations('backoffice')
  const { data: accounts = [] } = await listAccountOptions()

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('stores.new')}</h1>
        <p className="text-sm text-muted-foreground">{t('stores.newSubtitle')}</p>
      </div>
      <Card className="border-border p-5">
        <CreateStoreForm accounts={accounts} />
      </Card>
    </div>
  )
}
