import { useTranslations } from 'next-intl'
import { Lock } from 'lucide-react'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'

/** Shown instead of pay pages to users who may not see them (server or client). */
export function NoPayAccess() {
  const t = useTranslations('instructorPay.noAccess')
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Lock />
        </EmptyMedia>
        <EmptyTitle>{t('title')}</EmptyTitle>
        <EmptyDescription>{t('description')}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
