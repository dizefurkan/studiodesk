'use client'

import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteTransaction } from '@/lib/actions/cash-register.actions'

interface DeleteTransactionButtonProps {
  transactionId: string
}

export function DeleteTransactionButton({ transactionId }: DeleteTransactionButtonProps) {
  const handleDelete = async () => {
    if (confirm('Delete this transaction?')) {
      try {
        await deleteTransaction(transactionId)
        window.location.reload()
      } catch (error) {
        console.error('Error deleting transaction:', error)
        alert('Failed to delete transaction')
      }
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="border-red-200 text-red-600 hover:bg-red-50"
      onClick={handleDelete}
    >
      <Trash2 size={16} />
    </Button>
  )
}
