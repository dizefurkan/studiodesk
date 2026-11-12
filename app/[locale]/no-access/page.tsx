import { getTranslations } from 'next-intl/server'
import { Lock } from 'lucide-react'
import { logout } from '@/lib/actions/auth.actions'
import { Button } from '@/components/ui/button'

export default async function NoAccessPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const t = await getTranslations('backoffice.noAccess')
  const { reason } = await searchParams
  const suspended = reason === 'suspended'

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Lock className="text-primary" size={22} />
        </div>
        <h1 className="mb-2 text-xl font-bold text-foreground">{suspended ? t('suspendedTitle') : t('title')}</h1>
        <p className="mb-6 text-sm text-muted-foreground">{suspended ? t('suspendedText') : t('text')}</p>
        <form action={logout}>
          <Button type="submit" variant="outline">
            {t('logout')}
          </Button>
        </form>
      </div>
    </div>
  )
}
