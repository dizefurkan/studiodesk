import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const organization = await getOrganization()
    if (!organization) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('organizations')
      .select(
        'week_start_day, timezone, virtual_sessions_weeks, attendance_per_week_limit, allow_makeup_sessions',
      )
      .eq('id', organization.id)
      .single()

    if (error) {
      console.error('Error fetching settings:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    return NextResponse.json(data || {})
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const organization = await getOrganization()
    if (!organization) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const body = await request.json()

    // Validate input
    const {
      week_start_day,
      timezone,
      virtual_sessions_weeks,
      attendance_per_week_limit,
      allow_makeup_sessions,
    } = body

    if (typeof week_start_day !== 'number' || week_start_day < 0 || week_start_day > 6) {
      return NextResponse.json(
        { error: 'Invalid week_start_day (must be 0-6)' },
        { status: 400 },
      )
    }

    if (typeof virtual_sessions_weeks !== 'number' || virtual_sessions_weeks < 1) {
      return NextResponse.json(
        { error: 'Invalid virtual_sessions_weeks (must be >= 1)' },
        { status: 400 },
      )
    }

    if (typeof attendance_per_week_limit !== 'number' || attendance_per_week_limit < 1) {
      return NextResponse.json(
        { error: 'Invalid attendance_per_week_limit (must be >= 1)' },
        { status: 400 },
      )
    }

    const supabase = await createServerSupabaseClient()
    const { error } = await (supabase
      .from('organizations') as any)
      .update({
        week_start_day,
        timezone,
        virtual_sessions_weeks,
        attendance_per_week_limit,
        allow_makeup_sessions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organization.id)

    if (error) {
      console.error('Error updating settings:', error)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
