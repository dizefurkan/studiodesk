'use client'

import { useState } from 'react'
import { updateInstructorEarnings, deleteInstructorEarnings } from '@/lib/actions/instructor-earnings.actions'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2, X, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface EarningsEditButtonProps {
  earningsId: string
  currentAmount: number
  onUpdate?: () => void
}

export function EarningsEditButton({ earningsId, currentAmount, onUpdate }: EarningsEditButtonProps) {
  const t = useTranslations()
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
        console.log('[EarningsEditButton] Success, reloading...')
        setIsEditing(false)
        setIsLoading(false)
        onUpdate?.()
        // Add a small delay before reload to ensure all state is updated
        setTimeout(() => {
          window.location.reload()
        }, 500)
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

  const handleDelete = async () => {
    if (!window.confirm(t('common.deleteConfirm'))) {
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
        console.log('[EarningsEditButton] Delete success, reloading...')
        onUpdate?.()
        setTimeout(() => {
          window.location.reload()
        }, 500)
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
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-24 px-2 py-1 border border-gray-300 rounded text-right font-semibold"
          disabled={isLoading}
        />
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
          title="Kaydet"
        >
          <Check size={18} />
        </button>
        <button
          onClick={() => {
            setIsEditing(false)
            setAmount(currentAmount.toString())
            setError(null)
          }}
          disabled={isLoading}
          className="p-1 text-gray-400 hover:bg-gray-100 rounded disabled:opacity-50"
          title="İptal"
        >
          <X size={18} />
        </button>
        {error && <span className="text-red-600 text-sm">{error}</span>}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setIsEditing(true)}
        className="p-1 text-[#4F46E5] hover:bg-blue-50 rounded transition-colors"
        title="Düzenle"
      >
        <Edit2 size={18} />
      </button>
      <button
        onClick={handleDelete}
        disabled={isLoading}
        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
        title="Sil"
      >
        <Trash2 size={18} />
      </button>
    </div>
  )
}
