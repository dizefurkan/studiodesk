'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { RotateCcw } from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { undoSessionAttendance } from '@/lib/actions/attendance.actions'

/** Removes a whole attendance sheet (credits are given back) and reopens it for that day. */
export function UndoAttendanceButton({ sessionId }: { sessionId: string }) {
  const tx = useTranslations('attendanceSheet')
  const confirm = useConfirm()
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const undo = async () => {
    const ok = await confirm({
      title: tx('undoTitle'),
      description: tx('undoDescription'),
      confirmLabel: tx('undo'),
      destructive: true,
    })
    if (!ok) return
    setBusy(true)
    const result = await undoSessionAttendance(sessionId)
    setBusy(false)
    if (result.error || !result.data) {
      toast.error(result.error ?? tx('undoFailed'))
      return
    }
    toast.success(tx('undone'))
    router.push(`/dashboard/attendance?course=${result.data.courseId}&date=${result.data.date}`)
  }

  return (
    <Button variant="outline" size="sm" onClick={undo} disabled={busy}>
      <RotateCcw /> {tx('undo')}
    </Button>
  )
}
