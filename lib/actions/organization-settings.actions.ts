'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { logOperation } from '@/lib/actions/history.actions'
import { getChanges } from '@/lib/utils/history-utils'

export interface AttendanceConfig {
  week_start_day: number
  timezone: string
  virtual_sessions_weeks: number
  attendance_per_week_limit: number
  allow_makeup_sessions: boolean
}

/**
 * Get attendance configuration for current organization
 */
export async function getAttendanceConfig(): Promise<{
  data?: AttendanceConfig
  error?: string
}> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('organizations')
      .select(
        'week_start_day, timezone, virtual_sessions_weeks, attendance_per_week_limit, allow_makeup_sessions',
      )
      .eq('id', organization.id)
      .single()

    if (error) {
      console.error('Error fetching attendance config:', error)
      return { error: 'Failed to fetch config' }
    }

    const orgData = data as Partial<AttendanceConfig> | null

    return {
      data: {
        week_start_day: orgData?.week_start_day || 1,
        timezone: orgData?.timezone || 'Europe/Istanbul',
        virtual_sessions_weeks: orgData?.virtual_sessions_weeks || 12,
        attendance_per_week_limit: orgData?.attendance_per_week_limit || 1,
        allow_makeup_sessions: orgData?.allow_makeup_sessions !== false,
      },
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Update attendance configuration
 */
export async function updateAttendanceConfig(
  config: Partial<AttendanceConfig>,
): Promise<{ success?: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    // Get current config for before state
    const { data: beforeData } = await supabase
      .from('organizations')
      .select(
        'week_start_day, timezone, virtual_sessions_weeks, attendance_per_week_limit, allow_makeup_sessions',
      )
      .eq('id', organization.id)
      .single()

    const updateData: any = {}
    if (config.week_start_day !== undefined) updateData.week_start_day = config.week_start_day
    if (config.timezone !== undefined) updateData.timezone = config.timezone
    if (config.virtual_sessions_weeks !== undefined)
      updateData.virtual_sessions_weeks = config.virtual_sessions_weeks
    if (config.attendance_per_week_limit !== undefined)
      updateData.attendance_per_week_limit = config.attendance_per_week_limit
    if (config.allow_makeup_sessions !== undefined)
      updateData.allow_makeup_sessions = config.allow_makeup_sessions
    updateData.updated_at = new Date().toISOString()

    const { error } = await (supabase
      .from('organizations') as any)
      .update(updateData)
      .eq('id', organization.id)

    if (error) {
      console.error('Error updating config:', error)
      return { error: 'Failed to update config' }
    }

    // Log operation (non-blocking)
    const beforeState = beforeData || {}
    const changes = getChanges(beforeState, updateData)
    void logOperation(
      'UPDATE',
      'organization_settings',
      organization.id,
      {
        before: beforeState,
        after: updateData,
        changes,
      },
      organization.id
    )

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
