import { getCurrentUser, getUserRoleInOrganization } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { getCurrentUserProfile } from '@/lib/auth/getCurrentUser'
import { getInitials } from '@/lib/utils/format'
import { getTranslations } from 'next-intl/server'
import { UserMenu } from './UserMenu'
import { TopBarClient } from './TopBarClient'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'

export async function TopBar() {
  const t = await getTranslations()
  const user = await getCurrentUser()
  const userProfile = await getCurrentUserProfile()
  const organization = await getOrganization()
  const userRoleData = organization ? await getUserRoleInOrganization(organization.id) : null
  const userRole = userRoleData?.role || 'staff'

  const userName = userProfile?.full_name || user?.email || 'User'
  const userInitials = getInitials(userName)

  const content = (
    <>
      {/* Right Section - Notifications & User Menu */}
      <div className="flex items-center gap-2 md:gap-4 ml-auto">
        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Organization Name - Hide on mobile and tablet */}
        {organization && (
          <div className="hidden lg:block text-sm">
            <p className="text-muted-foreground/70 text-xs uppercase tracking-wider">{t('settings.organization')}</p>
            <p className="font-semibold text-foreground truncate">{organization.name}</p>
          </div>
        )}

        {/* Divider */}
        <div className="w-px h-6 md:h-8 bg-border hidden lg:block" />

        {/* User Profile Menu */}
        <UserMenu
          userName={userName}
          userEmail={user?.email || ''}
          userRole={userRole}
          initials={userInitials}
        />
      </div>
    </>
  )

  return (
    <div className="flex h-full items-center gap-2 px-3 sm:px-4 md:gap-4 md:px-6 lg:px-8">
      <TopBarClient>{content}</TopBarClient>
    </div>
  )
}
