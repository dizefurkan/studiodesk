'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, UserPlus } from 'lucide-react'
import { addExistingUserToOrganizationById } from '@/lib/actions/organization.actions'

interface AddTeamMemberFormProps {
  availableUsers: Array<{ id: string; full_name: string; email?: string }>
  userRole: string
  canManageTeam: boolean
  isHeaderMode?: boolean
  isExpanded?: boolean
  onOpen?: () => void
  onClose?: () => void
}

export function AddTeamMemberForm({
  availableUsers,
  userRole,
  canManageTeam,
  isHeaderMode = false,
  isExpanded: externalIsExpanded = false,
  onOpen,
  onClose,
}: AddTeamMemberFormProps) {
  const [isExpanded, setIsExpanded] = useState(externalIsExpanded)
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
        setIsExpanded(false)
        onClose?.()
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

  // Header mode - just show the button
  if (isHeaderMode) {
    return (
      <Button
        onClick={() => {
          setIsExpanded(true)
          onOpen?.()
        }}
        className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
      >
        <UserPlus size={18} />
        Add Member
      </Button>
    )
  }

  // Default mode - full form with expand/collapse
  return (
    <>
      {!isExpanded ? (
        <Button
          onClick={() => {
            setIsExpanded(true)
            onOpen?.()
          }}
          className="w-full bg-gradient-to-r from-[#4F46E5] to-[#4338CA] hover:from-[#4338CA] hover:to-[#3730A3] text-white font-semibold py-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          <UserPlus size={20} />
          Add Team Member
        </Button>
      ) : (
        <div className="border-2 border-[#4F46E5] rounded-lg p-6 bg-gradient-to-br from-[#F9FAFB] to-white">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-[#4F46E5] p-2 rounded-lg">
              <UserPlus size={18} className="text-white" />
            </div>
            <h4 className="font-semibold text-[#111827]">Add New Team Member</h4>
          </div>

          {message && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm font-medium ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            {/* User Selector */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                Select User
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all"
              >
                <option value="">Choose a user...</option>
                {availableUsers.length === 0 ? (
                  <option disabled>No users available</option>
                ) : (
                  availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name}
                      {user.email ? ` (${user.email})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Role Selector */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all"
              >
                <option value="staff">Staff</option>
                <option value="instructor">Instructor</option>
                <option value="manager">Manager</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleAdd}
                disabled={loading || !selectedUserId || availableUsers.length === 0}
                className="flex-1 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Adding...' : 'Add Member'}
              </Button>
              <Button
                onClick={() => {
                  setIsExpanded(false)
                  onClose?.()
                  setMessage(null)
                  setSelectedUserId('')
                  setSelectedRole('staff')
                }}
                variant="outline"
                className="flex-1 border-[#E5E7EB] text-[#111827] hover:bg-[#F9FAFB]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {availableUsers.length === 0 && isExpanded && (
        <p className="text-sm text-gray-600 mt-2 text-center">
          All users are already team members
        </p>
      )}
    </>
  )
}
