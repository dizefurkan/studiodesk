import { getCurrentUser, getUserRoleInOrganization } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { getOrganizationIdFromCookie } from '@/lib/auth/getCurrentUser'
import { getCurrentUserProfile } from '@/lib/auth/getCurrentUser'
import { getInitials } from '@/lib/utils/format'
import { getTranslations } from 'next-intl/server'
import { UserMenu } from './UserMenu'
import { TopBarClient } from './TopBarClient'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

export async function TopBar() {
  const t = await getTranslations()
  const user = await getCurrentUser()
  const userProfile = await getCurrentUserProfile()
  const organization = await getOrganization()
  const orgId = await getOrganizationIdFromCookie()
  const userRoleData = orgId ? await getUserRoleInOrganization(orgId) : null
  const userRole = (userRoleData as any)?.role || 'staff'

  const userName = (userProfile as any)?.full_name || user?.email || 'User'
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

        {/* Notification Bell */}
        <Button variant="ghost" size="icon" className="relative h-8 w-8 md:h-10 md:w-10">
          <Bell size={18} className="text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </Button>

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
    <header className="h-14 md:h-16 border-b border-border bg-background flex items-center px-3 sm:px-4 md:px-6 lg:px-8 gap-2 md:gap-4">
      <TopBarClient>{content}</TopBarClient>
    </header>
  )
}
