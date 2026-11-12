import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentUserProfile } from '@/lib/auth/getCurrentUser'
import { SettingsHeader } from '@/components/settings/SettingsHeader'
import { AccountSettingsForm } from '@/components/settings/AccountSettingsForm'

export default async function AccountSettingsPage() {
  const [user, profile] = await Promise.all([getCurrentUser(), getCurrentUserProfile()])
  if (!user) redirect('/login')
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SettingsHeader section="account" />
      <AccountSettingsForm email={user.email || ''} fullName={(profile as { full_name?: string } | null)?.full_name || ''} />
    </div>
  )
}
