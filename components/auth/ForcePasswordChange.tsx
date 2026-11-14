'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { ChangePasswordCard } from '@/components/settings/ChangePasswordCard'
import { logout } from '@/lib/actions/auth.actions'

export function ForcePasswordChange({ email }: { email: string }) {
  const t = useTranslations('auth.forcePasswordChange')
  const router = useRouter()

  return (
    <div className="space-y-4">
      <ChangePasswordCard
        title={t('title')}
        description={t('description', { email })}
        onChanged={() => router.replace('/dashboard')}
      />
      <form action={logout} className="text-center">
        <Button type="submit" variant="ghost" size="sm">
          {t('logout')}
        </Button>
      </form>
    </div>
  )
}
