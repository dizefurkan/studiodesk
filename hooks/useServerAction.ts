'use client'

import { useRouter } from '@/i18n/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'

/** Runs a server action, toasts its error/success and refreshes server data. */
export function useServerAction() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function run(
    action: () => Promise<{ error?: string } | undefined>,
    { success, onSuccess }: { success?: string; onSuccess?: () => void } = {}
  ) {
    startTransition(async () => {
      const res = await action()
      if (res?.error) {
        toast.error(res.error)
        return
      }
      if (success) toast.success(success)
      onSuccess?.()
      router.refresh()
    })
  }

  return { pending, run }
}
