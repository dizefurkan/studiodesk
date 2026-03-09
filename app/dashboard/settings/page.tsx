import { getOrganization } from '@/lib/auth/getOrganization'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Users, Lock, Bell, Building } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function SettingsPage() {
  const organization = await getOrganization()

  let teamMembers: any[] = []
  if (organization) {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('organization_users')
      .select('id, role, profiles(full_name)')
      .eq('organization_id', organization.id)

    teamMembers = data || []
  }

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
            <div className="bg-[#4F46E5] bg-opacity-10 p-4 rounded-lg">
              <Building className="text-[#4F46E5]" size={24} />
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
          <Users className="text-[#4F46E5]" size={24} />
          <div>
            <h2 className="text-2xl font-bold text-[#111827]">Team Members</h2>
            <p className="text-sm text-gray-600">{teamMembers.length} member(s)</p>
          </div>
        </div>

        {teamMembers.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No team members</p>
        ) : (
          <div className="space-y-3">
            {teamMembers.map((member: any) => (
              <div key={member.id} className="flex justify-between items-center p-4 border border-[#E5E7EB] rounded-lg">
                <div>
                  <p className="font-medium text-[#111827]">{member.profiles?.full_name}</p>
                  <p className="text-sm text-gray-600">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button className="w-full mt-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white">
          Add Team Member
        </Button>
      </Card>

      {/* Security & Privacy */}
      <Card className="border-[#E5E7EB] p-6">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="text-[#4F46E5]" size={24} />
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
          <Bell className="text-[#4F46E5]" size={24} />
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
    </div>
  )
}
