import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { listStores } from '@/lib/actions/backoffice.actions'
import { SearchForm } from '@/components/backoffice/SearchForm'
import { StoresTable } from '@/components/backoffice/StoresTable'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'

export default async function StoresPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const t = await getTranslations('backoffice')
  const { q } = await searchParams
  const { data: stores = [], error } = await listStores(q)
  const hasRecords = stores.length > 0 || !!q
  const createAction = (
    <Button asChild>
      <Link href="/backoffice/stores/new">
        <Plus /> {t('stores.new')}
      </Link>
    </Button>
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('stores.title')}
        description={t('stores.subtitle')}
        action={hasRecords ? createAction : undefined}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {hasRecords ? (
        <>
          <SearchForm defaultValue={q} placeholder={t('stores.search')} />
          <Card className="p-3 sm:p-4">
            <StoresTable stores={stores} />
          </Card>
        </>
      ) : (
        <EmptyState title={t('stores.empty')} description={t('stores.newSubtitle')} action={createAction} />
      )}
    </div>
  )
}
