import { getTranslations } from 'next-intl/server'
import { Home } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'

export default async function NotFound() {
  const t = await getTranslations()

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <Empty className="max-w-md">
        <EmptyHeader>
          <p className="text-7xl font-bold text-primary">404</p>
          <EmptyTitle>{t('errors.notFoundPage.title')}</EmptyTitle>
          <EmptyDescription>{t('errors.notFoundPage.description')}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/dashboard">
              <Home />
              {t('errors.notFoundPage.back')}
            </Link>
          </Button>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
            <Link href="/dashboard/students" className="text-primary hover:underline">
              {t('dashboard.students')}
            </Link>
            <Link href="/dashboard/courses" className="text-primary hover:underline">
              {t('dashboard.courses')}
            </Link>
            <Link href="/dashboard/instructor-rates" className="text-primary hover:underline">
              {t('dashboard.instructorRates')}
            </Link>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  )
}
