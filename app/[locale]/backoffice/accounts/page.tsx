import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { listAccounts } from '@/lib/actions/backoffice.actions'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { AccountsManager } from '@/components/backoffice/AccountsManager'
import { SearchForm } from '@/components/backoffice/SearchForm'

export default async function AccountsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const t = await getTranslations('backoffice')
  const { q } = await searchParams
  const [{ data: accounts = [], error }, me] = await Promise.all([listAccounts(q), getCurrentUser()])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('accounts.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('accounts.subtitle')}</p>
      </div>
      <SearchForm defaultValue={q} placeholder={t('accounts.search')} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Card className="border-border p-4">
        <AccountsManager accounts={accounts} currentUserId={me?.id ?? ''} />
      </Card>
    </div>
  )
}
