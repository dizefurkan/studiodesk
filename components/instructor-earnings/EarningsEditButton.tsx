'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Pencil, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { useServerAction } from '@/hooks/useServerAction'
import { resetInstructorEarnings, updateInstructorEarnings } from '@/lib/actions/instructor-earnings.actions'

/**
 * Set an earning's amount by hand (it then survives recalculation) or go back to the
 * calculated amount.
 */
export function EarningsEditButton({
  earningsId,
  currentAmount,
  isManual,
}: {
  earningsId: string
  currentAmount: number
  isManual: boolean
}) {
  const t = useTranslations('instructorEarnings')
  const tc = useTranslations('common')
  const confirm = useConfirm()
  const { pending, run } = useServerAction()
  const [isEditing, setIsEditing] = useState(false)
  const [amount, setAmount] = useState(currentAmount.toString())

  if (isEditing) {
    return (
      <form
        className="flex items-center gap-1"
        onSubmit={(e) => {
          e.preventDefault()
          run(() => updateInstructorEarnings(earningsId, Number(amount)), {
            success: t('amountSaved'),
            onSuccess: () => setIsEditing(false),
          })
        }}
      >
        <Input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-28 text-right"
          aria-label={t('editAmount')}
          disabled={pending}
          autoFocus
        />
        <Button type="submit" variant="ghost" size="icon-sm" aria-label={tc('save')} disabled={pending}>
          <Check />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={tc('cancel')}
          disabled={pending}
          onClick={() => {
            setIsEditing(false)
            setAmount(currentAmount.toString())
          }}
        >
          <X />
        </Button>
      </form>
    )
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={t('editAmount')} onClick={() => setIsEditing(true)}>
            <Pencil />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('editAmount')}</TooltipContent>
      </Tooltip>
      {isManual && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t('resetToCalculated')}
              disabled={pending}
              onClick={async () => {
                if (!(await confirm({ title: t('resetConfirm'), confirmLabel: t('resetToCalculated') }))) return
                run(() => resetInstructorEarnings(earningsId), { success: t('amountSaved') })
              }}
            >
              <RotateCcw />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('resetToCalculated')}</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
