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
      console.log('[EarningsEditButton] Saving earnings:', { earningsId, amount: parseFloat(amount) })
      const result = await updateInstructorEarnings(earningsId, parseFloat(amount))
      console.log('[EarningsEditButton] Result:', result)

      if (!result) {
        setError('No response from server')
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
        setError('Unexpected response format')
        setIsLoading(false)
      }
    } catch (err) {
      console.error('[EarningsEditButton] Exception:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
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
      console.log('[EarningsEditButton] Deleting earnings:', { earningsId })
      const result = await deleteInstructorEarnings(earningsId)
      console.log('[EarningsEditButton] Delete result:', result)

      if (!result) {
        setError('No response from server')
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
        setError('Unexpected response format')
        setIsLoading(false)
      }
    } catch (err) {
      console.error('[EarningsEditButton] Delete exception:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
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
        <Button variant="ghost" size="icon-sm" className="text-green-600" aria-label="Kaydet"
          onClick={handleSave}
          disabled={isLoading}
          title="Kaydet"
        >
          <Check size={18} />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="İptal"
          onClick={() => {
            setIsEditing(false)
            setAmount(currentAmount.toString())
            setError(null)
          }}
          disabled={isLoading}
          title="İptal"
        >
          <X size={18} />
        </Button>
        {error && <span className="text-red-600 text-sm">{error}</span>}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon-sm" className="text-primary" aria-label="Düzenle"
        onClick={() => setIsEditing(true)}
        title="Düzenle"
      >
        <Edit2 size={18} />
      </Button>
      <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label="Sil"
        onClick={handleDelete}
        disabled={isLoading}
        title="Sil"
      >
        <Trash2 size={18} />
      </Button>
    </div>
  )
}
