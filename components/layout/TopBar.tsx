import { getCurrentUser, getUserRoleInOrganization } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { getOrganizationIdFromCookie } from '@/lib/auth/getCurrentUser'
import { getCurrentUserProfile } from '@/lib/auth/getCurrentUser'
import { getInitials } from '@/lib/utils/format'
import { UserMenu } from './UserMenu'
import { Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export async function TopBar() {
  const user = await getCurrentUser()
  const userProfile = await getCurrentUserProfile()
  const organization = await getOrganization()
  const orgId = await getOrganizationIdFromCookie()
  const userRoleData = orgId ? await getUserRoleInOrganization(orgId) : null
  const userRole = (userRoleData as any)?.role || 'staff'

  const userName = (userProfile as any)?.full_name || user?.email || 'User'
  const userInitials = getInitials(userName)

  return (
    <header className="h-14 md:h-16 border-b border-[#E5E7EB] bg-white flex items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8 gap-2 md:gap-4">
      {/* Left Section - Search - Hide on very small screens */}
      <div className="hidden sm:flex flex-1 max-w-xs md:max-w-md lg:max-w-xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 text-[#9CA3AF]" size={16} />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-9 text-sm bg-[#F9FAFB] border-[#E5E7EB]"
          />
        </div>
      </div>

      {/* Right Section - Notifications & User Menu */}
      <div className="flex items-center gap-2 md:gap-4 ml-auto">
        {/* Organization Name - Hide on mobile and tablet */}
        {organization && (
          <div className="hidden lg:block text-sm">
            <p className="text-[#9CA3AF] text-xs uppercase tracking-wider">Organization</p>
            <p className="font-semibold text-[#111827] truncate">{organization.name}</p>
          </div>
        )}

        {/* Divider */}
        <div className="w-px h-6 md:h-8 bg-[#E5E7EB] hidden lg:block" />

        {/* Notification Bell */}
        <Button variant="ghost" size="icon" className="relative h-8 w-8 md:h-10 md:w-10">
          <Bell size={18} className="text-[#6B7280]" />
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
    </header>
  )
}
