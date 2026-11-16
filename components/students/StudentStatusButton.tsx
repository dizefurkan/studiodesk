'use client'

import { useTranslations } from 'next-intl'
import { UserCheck, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { useServerAction } from '@/hooks/useServerAction'
import { setStudentActive } from '@/lib/actions/students.actions'

/** "Make passive" / "Make active" with a confirmation that says what changes. */
export function StudentStatusButton({ studentId, name, isActive }: { studentId: string; name: string; isActive: boolean }) {
  const t = useTranslations('studentStatus')
  const confirm = useConfirm()
  const { pending, run } = useServerAction()

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={async () => {
        const ok = await confirm(
          isActive
            ? {
                title: t('deactivateConfirmTitle', { name }),
                description: t('deactivateConfirmDescription'),
                confirmLabel: t('deactivate'),
              }
            : {
                title: t('activateConfirmTitle', { name }),
                description: t('activateConfirmDescription'),
                confirmLabel: t('activate'),
              }
        )
        if (!ok) return
        run(() => setStudentActive(studentId, !isActive), { success: isActive ? t('deactivated') : t('activated') })
      }}
    >
      {pending ? <Spinner /> : isActive ? <UserX /> : <UserCheck />}
      {isActive ? t('deactivate') : t('activate')}
    </Button>
  )
}
