'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'
import { addExistingUserToOrganizationById } from '@/lib/actions/organization.actions'

interface AddTeamMemberFormProps {
  availableUsers: Array<{ id: string; full_name: string; email?: string }>
  userRole: string
  canManageTeam: boolean
}

export function AddTeamMemberForm({
  availableUsers,
  userRole,
  canManageTeam,
}: AddTeamMemberFormProps) {
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState('staff')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleAdd = async () => {
    if (!selectedUserId) {
      setMessage({ type: 'error', text: 'Please select a user' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const result = await addExistingUserToOrganizationById(selectedUserId, selectedRole)

      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: 'Team member added successfully' })
        setSelectedUserId('')
        setSelectedRole('staff')
        // Page will automatically refresh via revalidatePath in the server action
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add team member' })
    } finally {
      setLoading(false)
    }
  }

  if (!canManageTeam) {
    return null
  }

  return (
    <div className="p-4 border border-[#E5E7EB] rounded-lg bg-[#F9FAFB]">
      <h4 className="font-medium text-[#111827] mb-3 flex items-center gap-2">
        <Plus size={16} />
        Add Team Member
      </h4>

      {message && (
        <div
          className={`mb-3 p-3 rounded text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-3">
        {/* User Selector */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">User</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-white"
          >
            <option value="">Select a user...</option>
            {availableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name}
              </option>
            ))}
          </select>
        </div>

        {/* Role Selector */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-white"
          >
            <option value="manager">Manager</option>
            <option value="instructor">Instructor</option>
            <option value="staff">Staff</option>
          </select>
        </div>

        {/* Add Button */}
        <Button
          onClick={handleAdd}
          disabled={loading || !selectedUserId}
          className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white disabled:opacity-50"
          size="sm"
        >
          {loading ? 'Adding...' : 'Add Team Member'}
        </Button>
      </div>
    </div>
  )
}
