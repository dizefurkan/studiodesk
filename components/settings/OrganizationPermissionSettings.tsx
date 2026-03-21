'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { updateOrganizationPermissions } from '@/lib/actions/organization.actions'

interface OrganizationPermissionSettingsProps {
  allowManagerInvite: boolean
  allowRoleChange: boolean
  allowMemberDelete: boolean
}

export function OrganizationPermissionSettings({
  allowManagerInvite,
  allowRoleChange,
  allowMemberDelete,
}: OrganizationPermissionSettingsProps) {
  const [settings, setSettings] = useState({
    allow_manager_invite: allowManagerInvite,
    allow_role_change: allowRoleChange,
    allow_member_delete: allowMemberDelete,
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSave = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const result = await updateOrganizationPermissions({
        allow_manager_invite: settings.allow_manager_invite,
        allow_role_change: settings.allow_role_change,
        allow_member_delete: settings.allow_member_delete,
      })

      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: 'Permissions updated successfully' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update permissions' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-[#E5E7EB] p-6 mt-6">
      <h3 className="text-lg font-bold text-[#111827] mb-4">Team Management Permissions</h3>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg border text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        <label className="flex items-center gap-3 p-3 border border-[#E5E7EB] rounded-lg cursor-pointer hover:bg-[#F9FAFB]">
          <input
            type="checkbox"
            checked={settings.allow_manager_invite}
            onChange={(e) =>
              setSettings({ ...settings, allow_manager_invite: e.target.checked })
            }
            className="w-4 h-4 rounded border-[#E5E7EB]"
          />
          <div>
            <p className="font-medium text-[#111827]">Allow managers to invite team members</p>
            <p className="text-xs text-gray-600">
              Managers can add new team members to the organization
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 border border-[#E5E7EB] rounded-lg cursor-pointer hover:bg-[#F9FAFB]">
          <input
            type="checkbox"
            checked={settings.allow_role_change}
            onChange={(e) =>
              setSettings({ ...settings, allow_role_change: e.target.checked })
            }
            className="w-4 h-4 rounded border-[#E5E7EB]"
          />
          <div>
            <p className="font-medium text-[#111827]">Allow role changes</p>
            <p className="text-xs text-gray-600">
              Managers can change team member roles (requires permission 1)
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 border border-[#E5E7EB] rounded-lg cursor-pointer hover:bg-[#F9FAFB]">
          <input
            type="checkbox"
            checked={settings.allow_member_delete}
            onChange={(e) =>
              setSettings({ ...settings, allow_member_delete: e.target.checked })
            }
            className="w-4 h-4 rounded border-[#E5E7EB]"
          />
          <div>
            <p className="font-medium text-[#111827]">Allow removing team members</p>
            <p className="text-xs text-gray-600">
              Managers can remove team members (requires permission 1)
            </p>
          </div>
        </label>
      </div>

      <Button
        onClick={handleSave}
        disabled={loading}
        className="w-full mt-6 bg-[#4F46E5] hover:bg-[#4338CA] text-white disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Permissions'}
      </Button>
    </Card>
  )
}
