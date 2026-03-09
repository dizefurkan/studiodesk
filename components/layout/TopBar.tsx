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
  const userRole = userRoleData?.role || 'staff'

  const userName = (userProfile as any)?.full_name || user?.email || 'User'
  const userInitials = getInitials(userName)

  return (
    <header className="h-16 border-b border-[#E5E7EB] bg-white flex items-center justify-between px-8">
      {/* Left Section - Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-[#9CA3AF]" size={18} />
          <Input
            type="search"
            placeholder="Search students, courses..."
            className="pl-10 bg-[#F9FAFB] border-[#E5E7EB]"
          />
        </div>
      </div>

      {/* Right Section - Notifications & User Menu */}
      <div className="flex items-center gap-4 ml-4">
        {/* Organization Name */}
        {organization && (
          <div className="hidden md:block text-sm">
            <p className="text-[#9CA3AF] text-xs uppercase tracking-wider">Organization</p>
            <p className="font-semibold text-[#111827]">{organization.name}</p>
          </div>
        )}

        {/* Divider */}
        <div className="w-px h-8 bg-[#E5E7EB] hidden md:block" />

        {/* Notification Bell */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} className="text-[#6B7280]" />
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
