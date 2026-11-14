'use server'

import { getLocale } from 'next-intl/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePlatformAdmin } from '@/lib/auth/platformAdmin'
import { actionError } from '@/lib/i18n/actionError'
import type { Database } from '@/lib/types/database.types'
import { STUDENT_COUNT_OPTIONS } from '@/lib/demoRequests'

export type DemoRequest = Database['public']['Tables']['demo_requests']['Row']
export type DemoRequestStatus = 'new' | 'contacted' | 'closed'

const demoRequestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  studioName: z.string().trim().min(2).max(160),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(30)
    .regex(/^[+()\d\s-]+$/),
  email: z.string().trim().email().max(254).optional().or(z.literal('')),
  city: z.string().trim().max(80).optional(),
  studentCount: z.enum(STUDENT_COUNT_OPTIONS).optional(),
  message: z.string().trim().max(2000).optional(),
  /** Honeypot: real visitors never see or fill this field */
  website: z.string().max(0).optional(),
  /** KVKK notice acknowledged */
  consent: z.literal(true),
})

export type DemoRequestInput = z.input<typeof demoRequestSchema>

/** Public: called from the landing page form. */
export async function submitDemoRequest(input: DemoRequestInput): Promise<{ success?: true; error?: string }> {
  const parsed = demoRequestSchema.safeParse(input)
  if (!parsed.success) {
    // A filled honeypot gets a quiet "success" so bots learn nothing
    if (input.website) return { success: true }
    return { error: await actionError('demoRequestInvalid') }
  }
  const v = parsed.data
  const admin = createAdminClient()

  // Simple abuse guard: at most 3 requests per phone number per day
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count } = await admin
    .from('demo_requests')
    .select('id', { count: 'exact', head: true })
    .eq('phone', v.phone)
    .gte('created_at', since)
  if ((count ?? 0) >= 3) return { success: true }

  const { error } = await admin.from('demo_requests').insert({
    name: v.name,
    studio_name: v.studioName,
    phone: v.phone,
    email: v.email || null,
    city: v.city || null,
    student_count: v.studentCount ?? null,
    message: v.message || null,
    locale: await getLocale(),
  })
  if (error) {
    console.error('[submitDemoRequest]', error.message)
    return { error: await actionError('demoRequestFailed') }
  }
  return { success: true }
}

/** Backoffice: newest first. */
export async function listDemoRequests(status?: DemoRequestStatus): Promise<{ data?: DemoRequest[]; error?: string }> {
  try {
    await requirePlatformAdmin()
  } catch {
    return { error: await actionError('notAuthorized') }
  }
  const admin = createAdminClient()
  let query = admin.from('demo_requests').select('*').order('created_at', { ascending: false }).limit(200)
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) return { error: error.message }
  return { data: data ?? [] }
}

export async function setDemoRequestStatus(id: string, status: DemoRequestStatus): Promise<{ error?: string }> {
  try {
    await requirePlatformAdmin()
  } catch {
    return { error: await actionError('notAuthorized') }
  }
  if (!['new', 'contacted', 'closed'].includes(status)) return { error: await actionError('demoRequestInvalid') }
  const { error } = await createAdminClient()
    .from('demo_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  return error ? { error: error.message } : {}
}
