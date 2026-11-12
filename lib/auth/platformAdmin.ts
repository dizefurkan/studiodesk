/* eslint-disable @typescript-eslint/no-explicit-any -- lib/types/database.types.ts is hand-written and doesn't cover platform_admins / is_active / nested selects */
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from './getCurrentUser'

/** true if the user is listed in public.platform_admins */
export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data, error } = await (admin as any)
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    console.error('[isPlatformAdmin]', error.message)
    return false
  }
  return !!data
}

/** For pages/layouts: redirects away unless the current user is a platform admin. */
export async function requirePlatformAdminPage(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!(await isPlatformAdmin(user.id))) redirect('/dashboard')
  return user
}

/** For server actions: throws unless the current user is a platform admin. */
export async function requirePlatformAdmin(): Promise<User> {
  const user = await getCurrentUser()
  if (!user || !(await isPlatformAdmin(user.id))) {
    throw new Error('Unauthorized')
  }
  return user
}
