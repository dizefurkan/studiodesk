'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CircleAlert, TriangleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason?: string) => Promise<void>
  title: string
  description?: string
  itemName?: string
  withReason?: boolean
  isLoading?: boolean
}

/** Delete confirmation with an optional reason (soft delete audit trail). */
export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  withReason = true,
  isLoading = false,
}: DeleteConfirmModalProps) {
  const t = useTranslations('confirmDialog')
  const tErrors = useTranslations('errors')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const close = () => {
    setReason('')
    setError(null)
    onClose()
  }

  const handleConfirm = async () => {
    try {
      setError(null)
      await onConfirm(reason || undefined)
      setReason('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : tErrors('unknown'))
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && !isLoading && close()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>

        {itemName && (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>{t('careful')}</AlertTitle>
            <AlertDescription>{t('willRemove', { name: itemName })}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {withReason && (
          <Field>
            <FieldLabel htmlFor="delete-reason">
              {t('reason')} <span className="font-normal text-muted-foreground">({t('optional')})</span>
            </FieldLabel>
            <Textarea
              id="delete-reason"
              placeholder={t('reasonPlaceholder')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-20 resize-none"
              disabled={isLoading}
            />
          </Field>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{t('cancel')}</AlertDialogCancel>
          {/* plain Button (not AlertDialogAction) so the dialog stays open while deleting / on error */}
          <Button variant="destructive" onClick={handleConfirm} disabled={isLoading}>
            {isLoading && <Spinner />}
            {isLoading ? t('deleting') : t('delete')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
