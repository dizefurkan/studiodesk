import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

/** Breadcrumb + title for a settings sub-page. */
export async function SettingsHeader({ section }: { section: string }) {
  const t = await getTranslations('settings')
  return (
    <div className="space-y-2">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/settings">{t('title')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t(`sections.${section}.title`)}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t(`sections.${section}.title`)}</h1>
        <p className="text-sm text-muted-foreground">{t(`sections.${section}.description`)}</p>
      </div>
    </div>
  )
}
