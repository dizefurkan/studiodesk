import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Building2, CalendarCheck, ChevronRight, Coins, ShieldCheck, UserRound, Users, type LucideIcon } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getSettingsContext } from '@/lib/actions/settings.actions'

type Section = { key: string; href: string; icon: LucideIcon; ownerOnly?: boolean }

const SECTIONS: Section[] = [
  { key: 'general', href: '/dashboard/settings/general', icon: Building2 },
  { key: 'account', href: '/dashboard/settings/account', icon: UserRound },
  { key: 'team', href: '/dashboard/settings/team', icon: Users },
  { key: 'permissions', href: '/dashboard/settings/permissions', icon: ShieldCheck, ownerOnly: true },
  { key: 'currency', href: '/dashboard/settings/currency', icon: Coins },
  { key: 'attendance', href: '/dashboard/settings/attendance', icon: CalendarCheck },
]

export default async function SettingsPage() {
  const ctx = await getSettingsContext()
  if (!ctx) redirect('/login')
  const t = await getTranslations('settings')
  const sections = SECTIONS.filter((s) => !s.ownerOnly || ctx.isOwner)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sections.map(({ key, href, icon: Icon }) => (
          <Link
            key={key}
            href={href}
            className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Card className="h-full transition-colors group-hover:border-primary/40 group-hover:bg-accent/40">
              <CardHeader className="grid-cols-[auto_1fr_auto] items-center gap-x-4">
                <div className="row-span-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <CardTitle>{t(`sections.${key}.title`)}</CardTitle>
                <ChevronRight className="row-span-2 size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                <CardDescription>{t(`sections.${key}.description`)}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
