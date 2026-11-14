import { getLocale } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { mustChangePassword } from '@/lib/auth/passwordPolicy'
import { Logo } from '@/components/brand/Logo'
import { ForcePasswordChange } from '@/components/auth/ForcePasswordChange'

/** Shown after sign-in while the password is still one somebody else chose. */
export default async function ChangePasswordPage() {
  const user = await getCurrentUser()
  if (!user) redirect({ href: '/login', locale: await getLocale() })
  if (!mustChangePassword(user)) redirect({ href: '/dashboard', locale: await getLocale() })

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Logo markClassName="size-9" />
        </div>
        <ForcePasswordChange email={user.email ?? ''} />
      </div>
    </div>
  )
}
