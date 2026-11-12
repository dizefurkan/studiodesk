import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { getStore, listAccountOptions } from '@/lib/actions/backoffice.actions'
import { StoreSettings } from '@/components/backoffice/StoreSettings'
import { StoreBranches } from '@/components/backoffice/StoreBranches'
import { StoreMembers } from '@/components/backoffice/StoreMembers'

export default async function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const t = await getTranslations('backoffice')
  const [{ data: store, error }, { data: accounts = [] }] = await Promise.all([getStore(id), listAccountOptions()])

  if (!store) {
    if (error === 'Store not found') notFound()
    return <p className="text-sm text-red-600">{error}</p>
  }

  return (
    <div className="space-y-5">
      <div>
        <Link href="/backoffice/stores" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} /> {t('nav.stores')}
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-foreground">{store.name}</h1>
        <p className="text-xs text-muted-foreground/70">
          {t('stores.createdAt')}: {new Date(store.created_at).toLocaleDateString()} · ID: {store.id}
        </p>
      </div>

      <Card className="border-border p-5">
        <StoreSettings store={store} />
      </Card>
      <Card className="border-border p-5">
        <StoreBranches organizationId={store.id} branches={store.branches} />
      </Card>
      <Card className="border-border p-5">
        <StoreMembers organizationId={store.id} members={store.members} accounts={accounts} />
      </Card>
    </div>
  )
}
