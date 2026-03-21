import { getOrganization } from '@/lib/auth/getOrganization'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Users, Lock, Bell, Building, Edit2, Trash2 } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { CurrencySettings } from '@/components/settings/CurrencySettings'
import { OrganizationPermissionSettings } from '@/components/settings/OrganizationPermissionSettings'
import { AddTeamMemberForm } from '@/components/settings/AddTeamMemberForm'
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
    const supabase = await createServerSupabaseClient()

    // Get team members
    const { data: members } = await supabase
      .from('organization_users')
      .select('id, role, user_id, profiles(id, full_name)')
      .eq('organization_id', organization.id)

    teamMembers = members || []

    // Get all profiles for the add user dropdown
    const { data: profiles } = await supabase.from('profiles').select('id, full_name')

    allProfiles = profiles || []

    // Get current user role
    const roleData = await getUserRoleInOrganization(organization.id)
    userRole = (roleData as any)?.role || 'staff'
    
    console.log('🔍 Role Data from getUserRoleInOrganization:', roleData)
    console.log('User Role:', userRole)
    console.log('Team Members Count:', teamMembers.length)
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
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#4F46E5] p-3 rounded-lg">
            <Users className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#111827]">Team Members</h2>
            <p className="text-sm text-gray-600">{teamMembers.length} member(s)</p>
          </div>
        </div>

        {/* Add Team Member Form */}
        <AddTeamMemberForm
          availableUsers={availableUsers}
          userRole={userRole}
          canManageTeam={canManageTeam}
        />

        {/* Team Members List */}
        {teamMembers.length === 0 ? (
          <p className="text-gray-600 text-center py-8 mt-4">No team members</p>
        ) : (
          <div className="space-y-3 mt-4">
            {teamMembers.map((member: any) => (
              <div
                key={member.id}
                className="flex justify-between items-center p-4 border border-[#E5E7EB] rounded-lg"
              >
                <div>
                  <p className="font-medium text-[#111827]">{member.profiles?.full_name}</p>
                  <p className="text-sm text-gray-600">{ROLE_LABELS[member.role] || member.role}</p>
                </div>

                {/* Edit/Delete Buttons */}
                {canManageTeam && member.role !== 'owner' && (
                  <div className="flex gap-2">
                    {(organization as any)?.allow_role_change && (
                      <select
                        defaultValue={member.role}
                        onChange={(e) => {
                          updateTeamMemberRole(member.id, e.target.value)
                        }}
                        className="text-xs px-2 py-1 border border-[#E5E7EB] rounded bg-white"
                      >
                        <option value="manager">Manager</option>
                        <option value="instructor">Instructor</option>
                        <option value="staff">Staff</option>
                      </select>
                    )}

                    {(organization as any)?.allow_member_delete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => {
                          if (
                            confirm(
                              `Are you sure you want to remove ${member.profiles?.full_name}?`,
                            )
                          ) {
                            removeTeamMember(member.id)
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
