'use client'

import { useTranslations } from 'next-intl'
import { Lock, LockOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FormattedDate } from '@/components/common/FormattedDate'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { useServerAction } from '@/hooks/useServerAction'
import { closePayPeriod, reopenPayPeriod } from '@/lib/actions/instructor-pay.actions'
import { useMonthLabel } from './MonthSwitcher'

/** Month status (open / closed) with the close and reopen actions. */
export function PeriodControls({
  month,
  isClosed,
  closedAt,
  canClose,
  canReopen,
}: {
  month: string
  isClosed: boolean
  closedAt: string | null
  canClose: boolean
  canReopen: boolean
}) {
  const t = useTranslations('instructorPay.period')
  const confirm = useConfirm()
  const label = useMonthLabel()
  const { pending, run } = useServerAction()

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isClosed ? (
        <Badge variant="secondary">
          <Lock /> {t('closed')}
          {closedAt && (
            <span className="font-normal text-muted-foreground">
              · <FormattedDate value={closedAt} />
            </span>
          )}
        </Badge>
      ) : (
        <Badge variant="outline">{t('open')}</Badge>
      )}
      {canClose && (
        <Button
          variant="outline"
          disabled={pending}
          onClick={async () => {
            if (
              !(await confirm({
                title: t('closeConfirmTitle', { month: label(month) }),
                description: t('closeConfirmDescription'),
                confirmLabel: t('close'),
              }))
            )
              return
            run(() => closePayPeriod(month), { success: t('closedSuccess') })
          }}
        >
          <Lock /> {t('close')}
        </Button>
      )}
      {canReopen && (
        <Button
          variant="outline"
          disabled={pending}
          onClick={async () => {
            if (
              !(await confirm({
                title: t('reopenConfirmTitle', { month: label(month) }),
                description: t('reopenConfirmDescription'),
                confirmLabel: t('reopen'),
                destructive: true,
              }))
            )
              return
            run(() => reopenPayPeriod(month), { success: t('reopenedSuccess') })
          }}
        >
          <LockOpen /> {t('reopen')}
        </Button>
      )}
    </div>
  )
}
