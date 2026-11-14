'use client'

import { useState } from 'react'
import { updateInstructorEarnings, deleteInstructorEarnings } from '@/lib/actions/instructor-earnings.actions'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2, X, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { Input } from '@/components/ui/input'
import { useRouter } from '@/i18n/navigation'

interface EarningsEditButtonProps {
  earningsId: string
  currentAmount: number
  onUpdate?: () => void
}

export function EarningsEditButton({ earningsId, currentAmount, onUpdate }: EarningsEditButtonProps) {
  const t = useTranslations()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [amount, setAmount] = useState(currentAmount.toString())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await updateInstructorEarnings(earningsId, parseFloat(amount))

      if (!result) {
        setError(t('errors.noResponse'))
        setIsLoading(false)
        return
      }

      if (result.error) {
        console.error('[EarningsEditButton] Error:', result.error)
        setError(result.error)
        setIsLoading(false)
      } else if (result.success) {
                setIsEditing(false)
        setIsLoading(false)
        onUpdate?.()
        router.refresh()
      } else {
        setError(t('errors.unexpectedResponse'))
        setIsLoading(false)
      }
    } catch (err) {
      console.error('[EarningsEditButton] Exception:', err)
      setError(err instanceof Error ? err.message : t('errors.unexpected'))
      setIsLoading(false)
    }
  }

  const confirm = useConfirm()

  const handleDelete = async () => {
    if (!(await confirm({ title: t('common.deleteConfirm'), destructive: true }))) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await deleteInstructorEarnings(earningsId)

      if (!result) {
        setError(t('errors.noResponse'))
        setIsLoading(false)
        return
      }

      if (result.error) {
        console.error('[EarningsEditButton] Delete error:', result.error)
        setError(result.error)
        setIsLoading(false)
      } else if (result.success) {
                onUpdate?.()
        setIsLoading(false)
        router.refresh()
      } else {
        setError(t('errors.unexpectedResponse'))
        setIsLoading(false)
      }
    } catch (err) {
      console.error('[EarningsEditButton] Delete exception:', err)
      setError(err instanceof Error ? err.message : t('errors.unexpected'))
      setIsLoading(false)
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-24 text-right"
          disabled={isLoading}
        />
        <Button variant="ghost" size="icon-sm" className="text-green-600" aria-label={t('common.save')}
          onClick={handleSave}
          disabled={isLoading}
          title={t('common.save')}
        >
          <Check size={18} />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label={t('common.cancel')}
          onClick={() => {
            setIsEditing(false)
            setAmount(currentAmount.toString())
            setError(null)
          }}
          disabled={isLoading}
          title={t('common.cancel')}
        >
          <X size={18} />
        </Button>
        {error && <span className="text-red-600 text-sm">{error}</span>}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon-sm" className="text-primary" aria-label={t('common.edit')}
        onClick={() => setIsEditing(true)}
        title={t('common.edit')}
      >
        <Edit2 size={18} />
      </Button>
      <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label={t('common.delete')}
        onClick={handleDelete}
        disabled={isLoading}
        title={t('common.delete')}
      >
        <Trash2 size={18} />
      </Button>
    </div>
  )
}
