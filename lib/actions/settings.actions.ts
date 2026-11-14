'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser, getUserRoleInOrganization } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { MUST_CHANGE_PASSWORD, mustChangePassword } from '@/lib/auth/passwordPolicy'
import { SUPPORTED_CURRENCIES } from '@/config/currencies'
import { actionError } from '@/lib/i18n/actionError'

type Result = { error?: string; success?: boolean }

export type SettingsRole = 'owner' | 'manager' | 'instructor' | 'staff'

/** Organization + current user's role, for settings pages. */
export async function getSettingsContext() {
  const [user, organization] = await Promise.all([getCurrentUser(), getOrganization()])
  if (!user || !organization) return null
  const roleData = await getUserRoleInOrganization(organization.id)
  const role = (roleData?.role || 'staff') as SettingsRole
  return {
    user,
    organization: organization,
    role,
    canEditOrganization: role === 'owner' || role === 'manager',
    isOwner: role === 'owner',
  }
}

/** Resolves the org and checks the caller has one of `roles`. */
async function requireOrgRole(roles: SettingsRole[]) {
  const ctx = await getSettingsContext()
  if (!ctx) throw new Error(await actionError('notAuthenticated'))
  if (!roles.includes(ctx.role)) throw new Error(await actionError('noPermissionSettings'))
  return ctx
}

function done(): Result {
  revalidatePath('/[locale]/dashboard', 'layout')
  return { success: true }
}

function fail(e: unknown): Result {
  const msg = e instanceof Error ? e.message : String(e)
  console.error('[settings]', msg)
  return { error: msg }
}

async function updateOrganization(id: string, patch: Record<string, unknown>) {
  const { error } = await (createAdminClient()).from('organizations').update(patch).eq('id', id)
  if (error) throw error
}

export async function updateGeneralSettings(input: {
  name: string
  timezone: string
  week_start_day: number
}): Promise<Result> {
  try {
    const { organization } = await requireOrgRole(['owner', 'manager'])
    const name = input.name?.trim()
    if (!name || name.length < 2) return { error: await actionError('studioNameMin') }
    if (!Number.isInteger(input.week_start_day) || input.week_start_day < 0 || input.week_start_day > 6)
      return { error: await actionError('invalidWeekStart') }
    if (!input.timezone) return { error: await actionError('timezoneRequired') }
    await updateOrganization(organization.id, { name, timezone: input.timezone, week_start_day: input.week_start_day })
    return done()
  } catch (e) {
    return fail(e)
  }
}

export async function updateCurrencySetting(currency: string): Promise<Result> {
  try {
    const { organization } = await requireOrgRole(['owner', 'manager'])
    if (!SUPPORTED_CURRENCIES.some((c) => c.code === currency)) return { error: await actionError('unsupportedCurrency') }
    await updateOrganization(organization.id, { currency })
    return done()
  } catch (e) {
    return fail(e)
  }
}

export async function updateAttendanceSettings(input: {
  virtual_sessions_weeks: number
  attendance_per_week_limit: number
  allow_makeup_sessions: boolean
}): Promise<Result> {
  try {
    const { organization } = await requireOrgRole(['owner', 'manager'])
    const weeks = Number(input.virtual_sessions_weeks)
    const limit = Number(input.attendance_per_week_limit)
    if (!Number.isInteger(weeks) || weeks < 1 || weeks > 52) return { error: await actionError('lookaheadRange') }
    if (!Number.isInteger(limit) || limit < 1 || limit > 14) return { error: await actionError('weeklyLimitRange') }
    await updateOrganization(organization.id, {
      virtual_sessions_weeks: weeks,
      attendance_per_week_limit: limit,
      allow_makeup_sessions: !!input.allow_makeup_sessions,
    })
    return done()
  } catch (e) {
    return fail(e)
  }
}

export async function updatePermissionSettings(input: {
  allow_manager_invite: boolean
  allow_role_change: boolean
  allow_member_delete: boolean
}): Promise<Result> {
  try {
    const { organization } = await requireOrgRole(['owner'])
    await updateOrganization(organization.id, {
      allow_manager_invite: !!input.allow_manager_invite,
      allow_role_change: !!input.allow_role_change,
      allow_member_delete: !!input.allow_member_delete,
    })
    return done()
  } catch (e) {
    return fail(e)
  }
}

// ---------------------------------------------------------------------
// Account (current user)
// ---------------------------------------------------------------------

export async function updateMyProfile(input: { fullName: string }): Promise<Result> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: await actionError('notAuthenticated') }
    const fullName = input.fullName?.trim()
    if (!fullName) return { error: await actionError('nameRequired') }
    const { error } = await (createAdminClient())
      .from('profiles')
      .upsert({ id: user.id, email: user.email, full_name: fullName })
    if (error) throw error
    return done()
  } catch (e) {
    return fail(e)
  }
}

export async function changeMyPassword(input: { currentPassword: string; newPassword: string }): Promise<Result> {
  try {
    const user = await getCurrentUser()
    if (!user?.email) return { error: await actionError('notAuthenticated') }
    if (!input.newPassword || input.newPassword.length < 8) return { error: await actionError('newPasswordMin') }

    const supabase = await createServerSupabaseClient()
    // Re-authenticate so a stolen session alone can't change the password.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: input.currentPassword,
    })
    if (signInError) return { error: await actionError('currentPasswordWrong') }

    if (input.newPassword === input.currentPassword) return { error: await actionError('newPasswordSame') }
    const { error } = await supabase.auth.updateUser({ password: input.newPassword })
    if (error) throw error
    if (mustChangePassword(user)) {
      const { error: flagError } = await createAdminClient().auth.admin.updateUserById(user.id, {
        app_metadata: { [MUST_CHANGE_PASSWORD]: false },
      })
      if (flagError) throw flagError
    }
    return { success: true }
  } catch (e) {
    return fail(e)
  }
}
