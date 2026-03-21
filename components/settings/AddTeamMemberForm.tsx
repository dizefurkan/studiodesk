'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { UserPlus, Mail, Copy, Check } from 'lucide-react'
import { sendTeamInvitation } from '@/lib/actions/invitations.actions'

interface AddTeamMemberFormProps {
  userRole: string
  canManageTeam: boolean
  isHeaderMode?: boolean
  isExpanded?: boolean
  onOpen?: () => void
  onClose?: () => void
}

interface PasswordModalData {
  email: string
  password: string
  role: string
}

export function AddTeamMemberForm({
  userRole,
  canManageTeam,
  isHeaderMode = false,
  isExpanded: externalIsExpanded = false,
  onOpen,
  onClose,
}: AddTeamMemberFormProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(externalIsExpanded)
  const [inviteEmail, setInviteEmail] = useState('')
  const [selectedRole, setSelectedRole] = useState('staff')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordModal, setPasswordModal] = useState<PasswordModalData | null>(null)
  const [copiedPassword, setCopiedPassword] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)

  const handleSendInvite = async () => {
    if (!inviteEmail) {
      setMessage({ type: 'error', text: 'Please enter an email address' })
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteEmail)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const result = await sendTeamInvitation(inviteEmail, selectedRole)

      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        // Show password modal for new users
        if (result.isNewUser && result.temporaryPassword) {
          setPasswordModal({
            email: result.email || inviteEmail,
            password: result.temporaryPassword,
            role: selectedRole,
          })
        }

        setMessage({
          type: 'success',
          text: result.isNewUser ? 'User created successfully!' : `User added to organization`,
        })
        setInviteEmail('')
        setSelectedRole('staff')

        // Close form after a delay
        setTimeout(() => {
          setIsExpanded(false)
          onClose?.()
          setMessage(null)
        }, 2000)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create user' })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, type: 'email' | 'password') => {
    navigator.clipboard.writeText(text)
    if (type === 'email') {
      setCopiedEmail(true)
      setTimeout(() => setCopiedEmail(false), 2000)
    } else {
      setCopiedPassword(true)
      setTimeout(() => setCopiedPassword(false), 2000)
    }
  }

  const closePasswordModal = () => {
    setPasswordModal(null)
    setIsExpanded(false)
    onClose?.()
    // Refresh page to show new team member in list
    router.refresh()
  }

  if (!canManageTeam) {
    return null
  }

  // Password Modal
  if (passwordModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full animate-in">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-green-100 rounded-lg mb-3">
              <Check className="text-green-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-[#111827]">User Created!</h2>
            <p className="text-gray-600 text-sm mt-1">
              Share these credentials with the new team member
            </p>
          </div>

          {/* Credentials */}
          <div className="space-y-4 mb-6">
            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase block mb-2">
                Email Address
              </label>
              <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <code className="flex-1 text-sm font-mono text-[#111827] break-all">
                  {passwordModal.email}
                </code>
                <button
                  onClick={() => copyToClipboard(passwordModal.email, 'email')}
                  className="shrink-0 p-2 hover:bg-gray-200 rounded transition-colors"
                  title="Copy email"
                >
                  {copiedEmail ? (
                    <Check size={16} className="text-green-600" />
                  ) : (
                    <Copy size={16} className="text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase block mb-2">
                Temporary Password
              </label>
              <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <code className="flex-1 text-sm font-mono text-[#111827] tracking-wide">
                  {passwordModal.password}
                </code>
                <button
                  onClick={() => copyToClipboard(passwordModal.password, 'password')}
                  className="shrink-0 p-2 hover:bg-gray-200 rounded transition-colors"
                  title="Copy password"
                >
                  {copiedPassword ? (
                    <Check size={16} className="text-green-600" />
                  ) : (
                    <Copy size={16} className="text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase block mb-2">
                Role
              </label>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900 capitalize">
                  {passwordModal.role}
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 p-3 rounded-lg mb-6 border border-yellow-200">
            <p className="text-xs text-yellow-800">
              <strong>Important:</strong> The user should change their password after first login.
            </p>
          </div>

          {/* Actions */}
          <Button
            onClick={closePasswordModal}
            className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold"
          >
            Done
          </Button>
        </div>
      </div>
    )
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
          className="w-full bg-linear-to-r from-[#4F46E5] to-[#4338CA] hover:from-[#4338CA] hover:to-[#3730A3] text-white font-semibold py-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          <UserPlus size={20} />
          Invite Team Member
        </Button>
      ) : (
        <div className="border-2 border-[#4F46E5] rounded-lg p-6 bg-linear-to-br from-[#F9FAFB] to-white">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-[#4F46E5] p-2 rounded-lg">
              <Mail size={18} className="text-white" />
            </div>
            <h4 className="font-semibold text-[#111827]">Invite New Team Member</h4>
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
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value.toLowerCase())}
                placeholder="user@company.com"
                className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg text-sm text-[#111827] placeholder-[#9CA3AF] bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">
                A temporary password will be generated automatically
              </p>
            </div>

            {/* Role Selector */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all"
              >
                <option value="staff">Staff</option>
                <option value="instructor">Instructor</option>
                <option value="manager">Manager</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSendInvite}
                disabled={loading || !inviteEmail}
                className="flex-1 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Creating...' : 'Create User'}
              </Button>
              <Button
                onClick={() => {
                  setIsExpanded(false)
                  onClose?.()
                  setMessage(null)
                  setInviteEmail('')
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
    </>
  )
}
