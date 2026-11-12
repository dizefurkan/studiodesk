import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { LayoutDashboard, LogOut } from 'lucide-react'
import { requirePlatformAdminPage } from '@/lib/auth/platformAdmin'
import { createAdminClient } from '@/lib/supabase/admin'
import { logout } from '@/lib/actions/auth.actions'
import { BackofficeNav } from '@/components/backoffice/BackofficeNav'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/brand/Logo'

export const dynamic = 'force-dynamic'

export default async function BackofficeLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePlatformAdminPage()
  const t = await getTranslations('backoffice')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- hand-written DB types lack is_active / nested selects
  const { count } = await (createAdminClient() as any)
    .from('organization_users')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
  const hasStore = (count || 0) > 0

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-4">
            <Link href="/backoffice/stores" className="flex items-center gap-2">
              <Logo />
              <Badge>{t('badge')}</Badge>
            </Link>
            <BackofficeNav />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden text-muted-foreground md:inline">{user.email}</span>
            {hasStore && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">
                  <LayoutDashboard />
                  <span className="hidden sm:inline">{t('nav.dashboard')}</span>
                </Link>
              </Button>
            )}
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm">
                <LogOut />
                <span className="hidden sm:inline">{t('nav.logout')}</span>
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}
