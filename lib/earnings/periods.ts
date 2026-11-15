import type { createAdminClient } from '@/lib/supabase/admin'

type Admin = ReturnType<typeof createAdminClient>

/** "2026-11" or "2026-11-15" → "2026-11-01" */
export function monthStart(value: string): string {
  return `${value.slice(0, 7)}-01`
}

/** Last day of the month, "2026-11" → "2026-11-30" */
export function monthEnd(value: string): string {
  const [y, m] = value.slice(0, 7).split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  return `${value.slice(0, 7)}-${String(last).padStart(2, '0')}`
}

/** "2026-11" → "2026-10" */
export function previousMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** A valid "YYYY-MM" or null */
export function parseMonth(value: string | undefined | null): string | null {
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return null
  return value
}

/** A valid "YYYY-MM-DD" or null */
export function parseDate(value: string | undefined | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const d = new Date(`${value}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : value
}

/** First days ("YYYY-MM-01") of the organization's closed pay months. */
export async function closedMonths(admin: Admin, organizationId: string): Promise<Set<string>> {
  const { data } = await admin
    .from('instructor_pay_periods')
    .select('period_month')
    .eq('organization_id', organizationId)
  return new Set((data ?? []).map((p) => p.period_month))
}

/** Whether the pay month that contains `date` is closed. */
export async function isDateLocked(admin: Admin, organizationId: string, date: string): Promise<boolean> {
  const { data } = await admin
    .from('instructor_pay_periods')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('period_month', monthStart(date))
    .maybeSingle()
  return !!data
}
