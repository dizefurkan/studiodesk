'use server'

import { toBusinessType } from '@/lib/business/types'

import { revalidatePath } from 'next/cache'
import type { User } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePlatformAdmin } from '@/lib/auth/platformAdmin'
import { MUST_CHANGE_PASSWORD } from '@/lib/auth/passwordPolicy'
import { toRole, type Role } from '@/lib/constants/roles'
import { actionError } from '@/lib/i18n/actionError'

// Every action re-checks platform admin rights and then uses the
// service-role client (bypasses RLS). Never call these from dashboard code.

export type StoreRole = Role
const ROLES: StoreRole[] = ['owner', 'manager', 'instructor', 'staff']

type Result<T = undefined> = { data?: T; error?: string; notFound?: true }

export interface StoreSummary {
  id: string
  name: string
  is_active: boolean
  currency: string | null
  created_at: string
  branchCount: number
  memberCount: number
  owners: { user_id: string; email: string | null; full_name: string | null }[]
}

export interface StoreBranch {
  id: string
  name: string
  address: string | null
  phone: string | null
  deleted_at: string | null
  created_at: string
}

export interface StoreMember {
  id: string
  user_id: string
  role: StoreRole
  email: string | null
  full_name: string | null
  created_at: string
}

export interface StoreDetail {
  id: string
  name: string
  is_active: boolean
  currency: string | null
  timezone: string | null
  created_at: string
  branches: StoreBranch[]
  members: StoreMember[]
}

export interface Account {
  id: string
  email: string | null
  full_name: string | null
  created_at: string
  last_sign_in_at: string | null
  banned: boolean
  is_platform_admin: boolean
  memberships: { id: string; organization_id: string; organization_name: string; role: StoreRole }[]
}

function fail(e: unknown): { error: string } {
  const msg = e instanceof Error ? e.message : String(e)
  console.error('[backoffice]', msg)
  return { error: msg }
}

function db() {
  return createAdminClient()
}

function revalidateBackoffice() {
  revalidatePath('/[locale]/backoffice', 'layout')
}

async function profilesById(ids: string[]) {
  const map = new Map<string, { email: string | null; full_name: string | null }>()
  if (ids.length === 0) return map
  const { data } = await db().from('profiles').select('id, email, full_name').in('id', ids)
  for (const p of data || []) map.set(p.id, { email: p.email, full_name: p.full_name })
  return map
}

/** All auth users (paginated through the admin API). */
async function listAllAuthUsers() {
  const admin = createAdminClient()
  const users: User[] = []
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    users.push(...data.users)
    if (data.users.length < 1000) break
  }
  return users
}

// =====================================================================
// STORES
// =====================================================================

export async function listStores(search?: string): Promise<Result<StoreSummary[]>> {
  try {
    await requirePlatformAdmin()
    let q = db()
      .from('organizations')
      .select('id, name, is_active, currency, created_at, branches(id, deleted_at), organization_users(user_id, role)')
      .order('created_at', { ascending: false })
    if (search?.trim()) q = q.ilike('name', `%${search.trim()}%`)
    const { data, error } = await q
    if (error) throw error

    const ownerIds = new Set<string>()
    for (const o of data || [])
      for (const m of o.organization_users || []) if (m.role === 'owner') ownerIds.add(m.user_id)
    const profiles = await profilesById([...ownerIds])

    return {
      data: (data || []).map((o) => ({
        id: o.id,
        name: o.name,
        is_active: o.is_active,
        currency: o.currency,
        created_at: o.created_at,
        branchCount: (o.branches || []).filter((b) => !b.deleted_at).length,
        memberCount: (o.organization_users || []).length,
        owners: (o.organization_users || [])
          .filter((m) => m.role === 'owner')
          .map((m) => ({ user_id: m.user_id, ...(profiles.get(m.user_id) || { email: null, full_name: null }) })),
      })),
    }
  } catch (e) {
    return fail(e)
  }
}

export async function getStore(id: string): Promise<Result<StoreDetail>> {
  try {
    await requirePlatformAdmin()
    const { data: org, error } = await db()
      .from('organizations')
      .select('id, name, is_active, currency, timezone, created_at')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    if (!org) return { error: await actionError('storeNotFound'), notFound: true }

    const [{ data: branches, error: bErr }, { data: members, error: mErr }] = await Promise.all([
      db()
        .from('branches')
        .select('id, name, address, phone, deleted_at, created_at')
        .eq('organization_id', id)
        .order('created_at', { ascending: true }),
      db()
        .from('organization_users')
        .select('id, user_id, role, created_at')
        .eq('organization_id', id)
        .order('created_at', { ascending: true }),
    ])
    if (bErr) throw bErr
    if (mErr) throw mErr

    const profiles = await profilesById((members || []).map((m) => m.user_id))
    return {
      data: {
        ...org,
        branches: branches || [],
        members: (members || []).map((m) => ({
          ...m,
          role: toRole(m.role),
          ...(profiles.get(m.user_id) || { email: null, full_name: null }),
        })),
      },
    }
  } catch (e) {
    return fail(e)
  }
}

export async function createStore(input: {
  name: string
  branchName: string
  ownerUserId: string
  currency?: string
  businessType?: string
}): Promise<Result<{ id: string }>> {
  try {
    await requirePlatformAdmin()
    const name = input.name?.trim()
    const branchName = input.branchName?.trim()
    if (!name || name.length < 2) return { error: await actionError('storeNameRequired') }
    if (!branchName) return { error: await actionError('branchNameRequired') }
    if (!input.ownerUserId) return { error: await actionError('ownerRequired') }

    const { data: org, error: orgErr } = await db()
      .from('organizations')
      .insert({ name, currency: input.currency || 'TRY', business_type: toBusinessType(input.businessType ?? 'dance') })
      .select('id')
      .single()
    if (orgErr) throw orgErr

    // roll back the organization if anything below fails
    try {
      const { error: ouErr } = await db()
        .from('organization_users')
        .insert({ organization_id: org.id, user_id: input.ownerUserId, role: 'owner' })
      if (ouErr) throw ouErr
      const { error: brErr } = await db()
        .from('branches')
        .insert({ organization_id: org.id, name: branchName })
      if (brErr) throw brErr
    } catch (inner) {
      await db().from('organizations').delete().eq('id', org.id)
      throw inner
    }

    revalidateBackoffice()
    return { data: { id: org.id } }
  } catch (e) {
    return fail(e)
  }
}

export async function updateStore(
  id: string,
  input: { name?: string; currency?: string; timezone?: string }
): Promise<Result> {
  try {
    await requirePlatformAdmin()
    const patch: Record<string, string> = {}
    if (input.name !== undefined) {
      if (input.name.trim().length < 2) return { error: await actionError('storeNameRequired') }
      patch.name = input.name.trim()
    }
    if (input.currency) patch.currency = input.currency
    if (input.timezone) patch.timezone = input.timezone
    const { error } = await db().from('organizations').update(patch).eq('id', id)
    if (error) throw error
    revalidateBackoffice()
    return {}
  } catch (e) {
    return fail(e)
  }
}

export async function setStoreActive(id: string, isActive: boolean): Promise<Result> {
  try {
    await requirePlatformAdmin()
    const { error } = await db().from('organizations').update({ is_active: isActive }).eq('id', id)
    if (error) throw error
    revalidateBackoffice()
    return {}
  } catch (e) {
    return fail(e)
  }
}

// =====================================================================
// BRANCHES
// =====================================================================

export async function createBranch(
  organizationId: string,
  input: { name: string; address?: string; phone?: string }
): Promise<Result> {
  try {
    await requirePlatformAdmin()
    if (!input.name?.trim()) return { error: await actionError('branchNameRequired') }
    const { error } = await db().from('branches').insert({
      organization_id: organizationId,
      name: input.name.trim(),
      address: input.address?.trim() || null,
      phone: input.phone?.trim() || null,
    })
    if (error) throw error
    revalidateBackoffice()
    return {}
  } catch (e) {
    return fail(e)
  }
}

export async function updateBranch(
  id: string,
  input: { name: string; address?: string; phone?: string }
): Promise<Result> {
  try {
    await requirePlatformAdmin()
    if (!input.name?.trim()) return { error: await actionError('branchNameRequired') }
    const { error } = await db()
      .from('branches')
      .update({
        name: input.name.trim(),
        address: input.address?.trim() || null,
        phone: input.phone?.trim() || null,
      })
      .eq('id', id)
    if (error) throw error
    revalidateBackoffice()
    return {}
  } catch (e) {
    return fail(e)
  }
}

/** Soft delete / restore (same deleted_at pattern as the dashboard). */
export async function setBranchArchived(id: string, archived: boolean): Promise<Result> {
  try {
    const user = await requirePlatformAdmin()
    const { error } = await db()
      .from('branches')
      .update(
        archived
          ? { deleted_at: new Date().toISOString(), deleted_by: user.id, deleted_reason: 'Archived from backoffice' }
          : { deleted_at: null, deleted_by: null, deleted_reason: null }
      )
      .eq('id', id)
    if (error) throw error
    revalidateBackoffice()
    return {}
  } catch (e) {
    return fail(e)
  }
}

// =====================================================================
// MEMBERS (organization_users)
// =====================================================================

async function ownerCount(organizationId: string) {
  const { count } = await db()
    .from('organization_users')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('role', 'owner')
  return count || 0
}

export async function addStoreMember(organizationId: string, userId: string, role: StoreRole): Promise<Result> {
  try {
    await requirePlatformAdmin()
    if (!ROLES.includes(role)) return { error: await actionError('invalidRole') }
    const { error } = await db()
      .from('organization_users')
      .insert({ organization_id: organizationId, user_id: userId, role })
    if (error) {
      if (error.code === '23505') return { error: await actionError('alreadyStoreMember') }
      throw error
    }
    revalidateBackoffice()
    return {}
  } catch (e) {
    return fail(e)
  }
}

export async function updateStoreMemberRole(memberId: string, role: StoreRole): Promise<Result> {
  try {
    await requirePlatformAdmin()
    if (!ROLES.includes(role)) return { error: await actionError('invalidRole') }
    const { data: m } = await db().from('organization_users').select('organization_id, role').eq('id', memberId).single()
    if (m?.role === 'owner' && role !== 'owner' && (await ownerCount(m.organization_id)) <= 1)
      return { error: await actionError('keepOneOwner') }
    const { error } = await db().from('organization_users').update({ role }).eq('id', memberId)
    if (error) throw error
    revalidateBackoffice()
    return {}
  } catch (e) {
    return fail(e)
  }
}

export async function removeStoreMember(memberId: string): Promise<Result> {
  try {
    await requirePlatformAdmin()
    const { data: m } = await db().from('organization_users').select('organization_id, role').eq('id', memberId).single()
    if (m?.role === 'owner' && (await ownerCount(m.organization_id)) <= 1)
      return { error: await actionError('keepOneOwner') }
    const { error } = await db().from('organization_users').delete().eq('id', memberId)
    if (error) throw error
    revalidateBackoffice()
    return {}
  } catch (e) {
    return fail(e)
  }
}

// =====================================================================
// ACCOUNTS (auth.users + profiles)
// =====================================================================

export async function listAccounts(search?: string): Promise<Result<Account[]>> {
  try {
    await requirePlatformAdmin()
    const users = await listAllAuthUsers()
    const ids = users.map((u) => u.id)

    const [profiles, { data: memberships }, { data: admins }] = await Promise.all([
      profilesById(ids),
      db().from('organization_users').select('id, user_id, role, organization_id, organizations(name)'),
      db().from('platform_admins').select('user_id'),
    ])
    const adminSet = new Set((admins || []).map((a) => a.user_id))

    let accounts: Account[] = users.map((u) => ({
      id: u.id,
      email: u.email ?? null,
      full_name: profiles.get(u.id)?.full_name ?? (u.user_metadata?.full_name as string) ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      banned: !!u.banned_until && new Date(u.banned_until) > new Date(),
      is_platform_admin: adminSet.has(u.id),
      memberships: (memberships || [])
        .filter((m) => m.user_id === u.id)
        .map((m) => ({
          id: m.id,
          organization_id: m.organization_id,
          organization_name: m.organizations?.name ?? '—',
          role: toRole(m.role),
        })),
    }))

    const s = search?.trim().toLowerCase()
    if (s)
      accounts = accounts.filter(
        (a) => a.email?.toLowerCase().includes(s) || a.full_name?.toLowerCase().includes(s)
      )
    accounts.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    return { data: accounts }
  } catch (e) {
    return fail(e)
  }
}

export async function createAccount(input: {
  email: string
  password: string
  fullName: string
}): Promise<Result<{ id: string }>> {
  try {
    await requirePlatformAdmin()
    const email = input.email?.trim().toLowerCase()
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return { error: await actionError('validEmailRequired') }
    if (!input.password || input.password.length < 8) return { error: await actionError('passwordMin') }

    const admin = createAdminClient()
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.fullName?.trim() || null },
      app_metadata: { [MUST_CHANGE_PASSWORD]: true },
    })
    if (error) throw error

    const { error: pErr } = await db()
      .from('profiles')
      .upsert({ id: data.user.id, email, full_name: input.fullName?.trim() || null })
    if (pErr) throw pErr

    revalidateBackoffice()
    return { data: { id: data.user.id } }
  } catch (e) {
    return fail(e)
  }
}

export async function updateAccountProfile(userId: string, input: { fullName: string }): Promise<Result> {
  try {
    await requirePlatformAdmin()
    const { error } = await db()
      .from('profiles')
      .update({ full_name: input.fullName?.trim() || null })
      .eq('id', userId)
    if (error) throw error
    revalidateBackoffice()
    return {}
  } catch (e) {
    return fail(e)
  }
}

export async function setAccountPassword(userId: string, password: string): Promise<Result> {
  try {
    const me = await requirePlatformAdmin()
    if (!password || password.length < 8) return { error: await actionError('passwordMin') }
    const { error } = await createAdminClient().auth.admin.updateUserById(userId, {
      password,
      // Someone else chose it: the user must replace it at next sign-in
      ...(me.id !== userId && { app_metadata: { [MUST_CHANGE_PASSWORD]: true } }),
    })
    if (error) throw error
    return {}
  } catch (e) {
    return fail(e)
  }
}

export async function setAccountBanned(userId: string, banned: boolean): Promise<Result> {
  try {
    const me = await requirePlatformAdmin()
    if (me.id === userId) return { error: await actionError('cannotDisableSelf') }
    const { error } = await createAdminClient().auth.admin.updateUserById(userId, {
      ban_duration: banned ? '876000h' : 'none',
    })
    if (error) throw error
    revalidateBackoffice()
    return {}
  } catch (e) {
    return fail(e)
  }
}

export async function setPlatformAdmin(userId: string, isAdmin: boolean): Promise<Result> {
  try {
    const me = await requirePlatformAdmin()
    if (me.id === userId && !isAdmin) return { error: await actionError('cannotRemoveOwnAdmin') }
    const q = isAdmin
      ? db().from('platform_admins').upsert({ user_id: userId })
      : db().from('platform_admins').delete().eq('user_id', userId)
    const { error } = await q
    if (error) throw error
    revalidateBackoffice()
    return {}
  } catch (e) {
    return fail(e)
  }
}

/** Lightweight list for pickers (owner / member select). */
export async function listAccountOptions(): Promise<Result<{ id: string; label: string }[]>> {
  const res = await listAccounts()
  if (res.error) return { error: res.error }
  return {
    data: (res.data || [])
      .filter((a) => !a.banned)
      .map((a) => ({ id: a.id, label: a.full_name ? `${a.full_name} (${a.email})` : a.email || a.id })),
  }
}
