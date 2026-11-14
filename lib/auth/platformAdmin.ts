import { redirect } from '@/i18n/navigation'
import { getLocale } from 'next-intl/server'
import type { User } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from './getCurrentUser'
import { mustChangePassword } from '@/lib/auth/passwordPolicy'

/** true if the user is listed in public.platform_admins */
export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data, error } = await admin
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
  if (!user) redirect({ href: '/login', locale: await getLocale() })
  if (mustChangePassword(user)) redirect({ href: '/change-password', locale: await getLocale() })
  if (!(await isPlatformAdmin(user.id))) redirect({ href: '/dashboard', locale: await getLocale() })
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
