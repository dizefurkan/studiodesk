'use server'
/* eslint-disable @typescript-eslint/no-explicit-any -- lib/types/database.types.ts is hand-written and incomplete */

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser, getUserRoleInOrganization } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { SUPPORTED_CURRENCIES } from '@/config/currencies'

type Result = { error?: string; success?: boolean }

export type SettingsRole = 'owner' | 'manager' | 'instructor' | 'staff'

/** Organization + current user's role, for settings pages. */
export async function getSettingsContext() {
  const [user, organization] = await Promise.all([getCurrentUser(), getOrganization()])
  if (!user || !organization) return null
  const roleData = await getUserRoleInOrganization(organization.id)
  const role = ((roleData as any)?.role || 'staff') as SettingsRole
  return {
    user,
    organization: organization as any,
    role,
    canEditOrganization: role === 'owner' || role === 'manager',
    isOwner: role === 'owner',
  }
}

/** Resolves the org and checks the caller has one of `roles`. */
async function requireOrgRole(roles: SettingsRole[]) {
  const ctx = await getSettingsContext()
  if (!ctx) throw new Error('Not authenticated')
  if (!roles.includes(ctx.role)) throw new Error('You do not have permission to change these settings')
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
  const { error } = await (createAdminClient() as any).from('organizations').update(patch).eq('id', id)
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
    if (!name || name.length < 2) return { error: 'Organization name must be at least 2 characters' }
    if (!Number.isInteger(input.week_start_day) || input.week_start_day < 0 || input.week_start_day > 6)
      return { error: 'Invalid week start day' }
    if (!input.timezone) return { error: 'Timezone is required' }
    await updateOrganization(organization.id, { name, timezone: input.timezone, week_start_day: input.week_start_day })
    return done()
  } catch (e) {
    return fail(e)
  }
}

export async function updateCurrencySetting(currency: string): Promise<Result> {
  try {
    const { organization } = await requireOrgRole(['owner', 'manager'])
    if (!SUPPORTED_CURRENCIES.some((c) => c.code === currency)) return { error: 'Unsupported currency' }
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
    if (!Number.isInteger(weeks) || weeks < 1 || weeks > 52) return { error: 'Lookahead must be between 1 and 52 weeks' }
    if (!Number.isInteger(limit) || limit < 1 || limit > 14) return { error: 'Weekly limit must be between 1 and 14' }
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
    if (!user) return { error: 'Not authenticated' }
    const fullName = input.fullName?.trim()
    if (!fullName) return { error: 'Name is required' }
    const { error } = await (createAdminClient() as any)
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
    if (!user?.email) return { error: 'Not authenticated' }
    if (!input.newPassword || input.newPassword.length < 8) return { error: 'New password must be at least 8 characters' }

    const supabase = await createServerSupabaseClient()
    // Re-authenticate so a stolen session alone can't change the password.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: input.currentPassword,
    })
    if (signInError) return { error: 'Current password is incorrect' }

    const { error } = await supabase.auth.updateUser({ password: input.newPassword })
    if (error) throw error
    return { success: true }
  } catch (e) {
    return fail(e)
  }
}
