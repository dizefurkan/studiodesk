'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { createAdminClient } from '@/lib/supabase/admin'

// ========================================
// LOGGING UTILITY - NON-BREAKING
// ========================================

export type HistoryAction = 'CREATE' | 'UPDATE' | 'DELETE'
export type HistoryEntity =
  | 'student'
  | 'instructor'
  | 'course'
  | 'package'
  | 'branch'
  | 'dance_type'
  | 'attendance'
  | 'course_student'
  | 'instructor_rate'
  | 'cash_register'
  | 'studio'
  | 'invitation'
  | 'organization_settings'

interface HistoryLogData {
  before?: Record<string, any> // Previous values (for UPDATE/DELETE)
  after?: Record<string, any> // New values (for CREATE/UPDATE)
  changes?: Record<string, { before: any; after: any }> // Only changed fields (for UPDATE)
  [key: string]: any // Allow additional metadata
}

/**
 * Logs an operation to history_logs table
 * Designed to be non-blocking - continues even if logging fails
 */
export async function logOperation(
  action: HistoryAction,
  entity: HistoryEntity,
  entityId: string,
  data?: HistoryLogData,
  organizationId?: string
) {
  try {
    // Get current user and organization if not provided
    const user = await getCurrentUser()
    if (!user) {
      console.warn('[logOperation] User not authenticated, skipping log')
      return
    }

    const org = organizationId ? null : await getOrganization()
    const finalOrgId = organizationId || org?.id
    if (!finalOrgId) {
      console.warn('[logOperation] No organization found, skipping log')
      return
    }

    // Use admin client to bypass RLS
    const admin = createAdminClient()

    const { error } = await (admin.from('history_logs') as any).insert({
      organization_id: finalOrgId,
      user_id: user.id,
      action,
      entity,
      entity_id: entityId,
      data: data || null,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error(`[logOperation] Error logging ${action} on ${entity}:`, error)
      // Don't throw - this is non-critical
    }
  } catch (error) {
    // Silently catch - logs shouldn't break operations
    console.error('[logOperation] Unexpected error:', error)
  }
}

// ========================================
// EXISTING HISTORY QUERIES
// ========================================

export async function getStudentAttendanceHistory(studentId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await (supabase
      .from('attendances') as any)
      .select(
        `
        id,
        created_at,
        course_sessions!inner(
          session_date,
          course:courses(
            id,
            name,
            dance_types(name),
            branches(name)
          )
        )
      `,
      )
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching attendance history:', error)
      return { error: 'Failed to fetch attendance history' }
    }

    return { data: data || [] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getStudentPackageHistory(studentId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    // Get all attendance records for credit deductions
    const { data: attendances } = await supabase
      .from('attendances')
      .select('student_package_id, created_at')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    // Get package purchase history
    const { data: packages, error } = await supabase
      .from('student_packages')
      .select(
        `
        id,
        created_at,
        remaining_credits,
        package:packages(
          id,
          name,
          total_credits,
          dance_types(name)
        )
      `
      )
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching package history:', error)
      return { error: 'Failed to fetch package history' }
    }

    // Combine: for each package, count how many attendances used that package
    const packagesWithStats = (packages || []).map((pkg: any) => {
      const creditsUsed =
        (pkg.package?.total_credits || 0) - (pkg.remaining_credits || 0)
      const attendanceCount =
        (attendances || []).filter(
          (a: any) => a.student_package_id === pkg.id
        ).length || 0

      return {
        ...pkg,
        creditsUsed,
        attendanceCount,
      }
    })

    return { data: packagesWithStats }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
