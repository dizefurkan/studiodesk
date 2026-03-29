import { getOrganization } from '@/lib/auth/getOrganization'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Users, Lock, Bell, Building, Edit2, Trash2 } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { CurrencySettings } from '@/components/settings/CurrencySettings'
import { OrganizationPermissionSettings } from '@/components/settings/OrganizationPermissionSettings'
import { TeamMembersSection } from '@/components/settings/TeamMembersSection'
import { getCurrentUser, getUserRoleInOrganization } from '@/lib/auth/getCurrentUser'
import { removeTeamMember, updateTeamMemberRole } from '@/lib/actions/organization.actions'
import { ROLE_LABELS } from '@/lib/constants/roles'
export default async function SettingsPage() {
  const organization = await getOrganization()
  const currentUser = await getCurrentUser()

  // Log logged-in user information
  console.log('🔐 Logged-in User Information:')
  console.log('User ID:', currentUser?.id)
  console.log('User Email:', currentUser?.email)
  if (currentUser?.user_metadata) {
    console.log('User Metadata:', currentUser.user_metadata)
  }
  console.log('Organization:', organization?.name)
  console.log('Organization ID:', organization?.id)

  let teamMembers: any[] = []
  let allProfiles: any[] = []
  let userRole = 'staff'

  if (organization && currentUser) {
    const admin = createAdminClient()

    console.log('📋 Fetching team members for organization:', organization.id)

    // Get team members (use admin client to bypass RLS - RLS-free read)
    // First, get organization users without nested profiles to ensure data is returned
    const { data: members, error: membersError } = await (admin as any)
      .from('organization_users')
      .select('id, role, user_id, organization_id')
      .eq('organization_id', organization.id)

    console.log('🔍 Raw members query response:', JSON.stringify(members, null, 2))
    console.log('🔍 Raw members error:', membersError)
    console.log('🔍 Members received - count:', members?.length || 0)

    if (membersError) {
      console.error('❌ Error fetching team members:', membersError)
      teamMembers = []
    } else if (Array.isArray(members) && members.length > 0) {
      // Now get profile data for all user IDs
      const userIds = members.map(m => m.user_id)
      console.log('📋 User IDs to fetch profiles for:', userIds)
      console.log('📋 User IDs count:', userIds.length)
      
      const { data: memberProfiles, error: memberProfilesError } = await (admin as any)
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds)

      console.log('🔍 Member profiles query response:', JSON.stringify(memberProfiles, null, 2))
      console.log('🔍 Member profiles count:', memberProfiles?.length || 0)
      console.log('🔍 Member profiles error:', memberProfilesError)

      // Merge profile data with member data
      const profileMap = new Map(memberProfiles?.map((p: any) => [p.id, p]) || [])
      console.log('🗺️ Profile Map entries:', Array.from(profileMap.entries()))
      
      teamMembers = members.map((member: any) => {
        const profile = profileMap.get(member.user_id)
        console.log(`🔎 Looking for user_id ${member.user_id}, found:`, profile ? 'YES' : 'NO')
        return {
          ...member,
          profiles: profile || { id: member.user_id, full_name: 'Unknown' },
        }
      })

      console.log('✅ Team members with profiles merged:', JSON.stringify(teamMembers, null, 2))
    } else {
      console.log('⚠️  No members found:', members)
      teamMembers = []
    }

    // Get all profiles for the add user dropdown
    const { data: allProfilesData, error: allProfilesError } = await (admin as any)
      .from('profiles')
      .select('id, full_name')

    if (allProfilesError) {
      console.error('❌ Error fetching all profiles:', allProfilesError)
    } else {
      console.log('✅ All profiles fetched:', allProfilesData?.length || 0)
    }

    allProfiles = allProfilesData || []

    // Get current user role
    const roleData = await getUserRoleInOrganization(organization.id)
    userRole = (roleData as any)?.role || 'staff'
    
    console.log('� Current User Role:', userRole)
    console.log('📋 Final Team Members Array:', teamMembers)
    console.log('📊 Team Members Count:', teamMembers.length)
  } else {
    console.log('⚠️  Missing organization or currentUser')
    console.log('   Organization:', !!organization)
    console.log('   CurrentUser:', !!currentUser)
  }

  // Get available users (not already in organization)
  const teamMemberUserIds = new Set(teamMembers.map((m) => m.user_id))
  const availableUsers = allProfiles.filter((p) => !teamMemberUserIds.has(p.id))

  // Check if user can manage team
  const isOwner = userRole === 'owner'
  const isManager = userRole === 'manager'
  const canManageTeam = isOwner || (isManager && (organization as any)?.allow_manager_invite)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your organization and preferences</p>
      </div>

      {/* Organization Information */}
      <Card className="border-[#E5E7EB] p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-[#4F46E5] p-4 rounded-lg">
              <Building className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#111827]">{organization?.name}</h2>
              <p className="text-sm text-gray-600">Organization</p>
            </div>
          </div>
          <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">Edit</Button>
        </div>
      </Card>

      {/* Team Management */}
      <Card className="border-[#E5E7EB] p-6">
        <TeamMembersSection
          teamMembers={teamMembers}
          userRole={userRole}
          canManageTeam={canManageTeam}
          organization={organization}
        />
      </Card>

      {/* Team Management Permissions (Owner only) */}
      {isOwner && (
        <OrganizationPermissionSettings
          allowManagerInvite={(organization as any)?.allow_manager_invite || false}
          allowRoleChange={(organization as any)?.allow_role_change || false}
          allowMemberDelete={(organization as any)?.allow_member_delete || false}
        />
      )}

      {/* Security & Privacy */}
      <Card className="border-[#E5E7EB] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#4F46E5] p-3 rounded-lg">
            <Lock className="text-white" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-[#111827]">Security</h2>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center p-4 border border-[#E5E7EB] rounded-lg">
            <div>
              <p className="font-medium text-[#111827]">Change Password</p>
              <p className="text-sm text-gray-600">Update your account password</p>
            </div>
            <Button variant="outline" className="border-[#E5E7EB]">
              Change
            </Button>
          </div>

          <div className="flex justify-between items-center p-4 border border-[#E5E7EB] rounded-lg">
            <div>
              <p className="font-medium text-[#111827]">Two-Factor Authentication</p>
              <p className="text-sm text-gray-600">Add an extra layer of security</p>
            </div>
            <Button variant="outline" className="border-[#E5E7EB]">
              Enable
            </Button>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="border-[#E5E7EB] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#4F46E5] p-3 rounded-lg">
            <Bell className="text-white" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-[#111827]">Notifications</h2>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3 p-4 border border-[#E5E7EB] rounded-lg cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded border-[#E5E7EB]"
            />
            <div>
              <p className="font-medium text-[#111827]">Email Notifications</p>
              <p className="text-sm text-gray-600">Receive email updates about your studio</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 border border-[#E5E7EB] rounded-lg cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded border-[#E5E7EB]"
            />
            <div>
              <p className="font-medium text-[#111827]">Class Reminders</p>
              <p className="text-sm text-gray-600">Get reminders for upcoming classes</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 border border-[#E5E7EB] rounded-lg cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-[#E5E7EB]"
            />
            <div>
              <p className="font-medium text-[#111827]">Payment Alerts</p>
              <p className="text-sm text-gray-600">Get alerted for payment-related events</p>
            </div>
          </label>
        </div>
      </Card>

      {/* Currency Settings */}
      <CurrencySettings organizationId={organization?.id || ''} currentCurrency={organization?.currency} />
    </div>
  )
}
