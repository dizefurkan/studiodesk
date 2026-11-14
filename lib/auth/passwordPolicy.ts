import type { User } from '@supabase/supabase-js'

/**
 * Set in `app_metadata` (not user-editable) whenever someone else chose the user's password:
 * a platform admin creating/resetting an account, or an owner/manager adding a team member.
 * The user is sent to /change-password until they pick their own.
 */
export const MUST_CHANGE_PASSWORD = 'must_change_password'

export function mustChangePassword(user: Pick<User, 'app_metadata'> | null | undefined): boolean {
  return user?.app_metadata?.[MUST_CHANGE_PASSWORD] === true
}
