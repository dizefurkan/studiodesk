'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Users, Trash2, UserPlus } from 'lucide-react'
import { AddTeamMemberForm } from './AddTeamMemberForm'
import { removeTeamMember, updateTeamMemberRole } from '@/lib/actions/organization.actions'
import { ROLE_LABELS } from '@/lib/constants/roles'

interface TeamMembersSectionProps {
  teamMembers: any[]
  userRole: string
  canManageTeam: boolean
  organization: any
}

export function TeamMembersSection({
  teamMembers,
  userRole,
  canManageTeam,
  organization,
}: TeamMembersSectionProps) {
  const [isAddingTeamMember, setIsAddingTeamMember] = useState(false)

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
                    <p className="font-semibold text-[#111827]">{member.profiles?.full_name}</p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {ROLE_LABELS[member.role] || member.role}
                    </p>
                  </div>

                  {/* Edit/Delete Buttons */}
                  {canManageTeam && member.role !== 'owner' && (
                    <div className="flex gap-2 items-center">
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
