'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Users, Trash2, UserPlus, Key, Copy, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AddTeamMemberForm } from './AddTeamMemberForm'
import { removeTeamMember, updateTeamMemberRole, resetTeamMemberPassword } from '@/lib/actions/organization.actions'
import { ROLE_LABELS } from '@/lib/constants/roles'

interface TeamMembersSectionProps {
  teamMembers: any[]
  userRole: string
  canManageTeam: boolean
  organization: any
}

interface PasswordModalData {
  memberName: string
  password: string
}

export function TeamMembersSection({
  teamMembers,
  userRole,
  canManageTeam,
  organization,
}: TeamMembersSectionProps) {
  const t = useTranslations()
  const [isAddingTeamMember, setIsAddingTeamMember] = useState(false)
  const [passwordModal, setPasswordModal] = useState<PasswordModalData | null>(null)
  const [copiedPassword, setCopiedPassword] = useState(false)
  const [resettingPasswordFor, setResettingPasswordFor] = useState<string | null>(null)

  const handleResetPassword = async (memberId: string, memberName: string) => {
    setResettingPasswordFor(memberId)
    try {
      const result = await resetTeamMemberPassword(memberId)
      if (result.success && result.temporaryPassword) {
        setPasswordModal({
          memberName,
          password: result.temporaryPassword,
        })
      } else {
        alert(result.error || 'Failed to reset password')
      }
    } catch (error) {
      alert('Failed to reset password')
    } finally {
      setResettingPasswordFor(null)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedPassword(true)
    setTimeout(() => setCopiedPassword(false), 2000)
  }

  // Password Modal UI
  if (passwordModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full animate-in">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-blue-100 rounded-lg mb-3">
              <Key className="text-blue-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-[#111827]">New Password</h2>
            <p className="text-gray-600 text-sm mt-1">
              for {passwordModal.memberName}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
            <div className="flex items-center gap-2">
              <code className="flex-1 text-lg font-mono text-[#111827] tracking-wide">
                {passwordModal.password}
              </code>
              <button
                onClick={() => copyToClipboard(passwordModal.password)}
                className="shrink-0 p-2 hover:bg-gray-300 rounded transition-colors"
                title="Copy password"
              >
                {copiedPassword ? (
                  <Check size={18} className="text-green-600" />
                ) : (
                  <Copy size={18} className="text-gray-600" />
                )}
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg mb-6 border border-yellow-200">
            <p className="text-xs text-yellow-800">
              <strong>Share this password</strong> with the team member. They should change it after first login.
            </p>
          </div>

          <Button
            onClick={() => setPasswordModal(null)}
            className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold"
          >
            Done
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header with Title and Button (if members exist) - Hide when adding */}
      {!isAddingTeamMember && (
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-[#4F46E5] p-3 rounded-lg">
              <Users className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#111827]">Team Members</h2>
              <p className="text-sm text-gray-600">
                {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Add button in header if members exist */}
          {teamMembers.length > 0 && (
            <AddTeamMemberForm
              userRole={userRole}
              canManageTeam={canManageTeam}
              isHeaderMode={true}
              onOpen={() => setIsAddingTeamMember(true)}
            />
          )}
        </div>
      )}

      {/* Team Members List or Empty State or Add Form */}
      {teamMembers.length === 0 ? (
        <div className="space-y-6">
          {!isAddingTeamMember && (
            <div className="text-center py-12 border border-dashed border-[#E5E7EB] rounded-lg bg-[#F9FAFB]">
              <Users className="mx-auto text-gray-400 mb-3" size={40} />
              <p className="text-gray-600 font-medium">No team members yet</p>
              <p className="text-sm text-gray-500 mt-1">Add your first team member to get started</p>
            </div>
          )}

          {/* Add button in footer if no members */}
          <AddTeamMemberForm
            userRole={userRole}
            canManageTeam={canManageTeam}
            isHeaderMode={false}
            isExpanded={isAddingTeamMember}
            onOpen={() => setIsAddingTeamMember(true)}
            onClose={() => setIsAddingTeamMember(false)}
          />
        </div>
      ) : (
        <>
          {/* Show list or form based on state */}
          {!isAddingTeamMember ? (
            <div className="space-y-3">
              {teamMembers.map((member: any) => (
                <div
                  key={member.id}
                  className="flex justify-between items-center p-4 border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-[#111827]">{member.profiles?.email || 'Unknown'}</p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {ROLE_LABELS[member.role] || member.role}
                    </p>
                  </div>

                  {/* Edit/Delete Buttons */}
                  {canManageTeam && member.role !== 'owner' && (
                    <div className="flex gap-2 items-center">
                      {/* Reset Password Button (Owner only) */}
                      {userRole === 'owner' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                          onClick={() =>
                            handleResetPassword(member.id, member.profiles?.email || 'Team member')
                          }
                          disabled={resettingPasswordFor === member.id}
                          title="Reset password"
                        >
                          <Key size={16} />
                        </Button>
                      )}

                      {organization?.allow_role_change && (
                        <select
                          defaultValue={member.role}
                          onChange={(e) => {
                            updateTeamMemberRole(member.id, e.target.value)
                          }}
                          className="text-xs px-3 py-2 border border-[#E5E7EB] rounded-lg bg-white hover:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-0 transition-all cursor-pointer"
                        >
                          <option value="staff">Staff</option>
                          <option value="instructor">Instructor</option>
                          <option value="manager">Manager</option>
                        </select>
                      )}

                      {organization?.allow_member_delete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => {
                            if (
                              confirm(
                                t('common.deleteConfirm'),
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
          ) : (
            /* Show add form when isAddingTeamMember is true */
            <AddTeamMemberForm
              userRole={userRole}
              canManageTeam={canManageTeam}
              isHeaderMode={false}
              isExpanded={isAddingTeamMember}
              onOpen={() => setIsAddingTeamMember(true)}
              onClose={() => setIsAddingTeamMember(false)}
            />
          )}
        </>
      )}
    </>
  )
}
