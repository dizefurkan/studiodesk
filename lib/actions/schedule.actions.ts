'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { actionError } from '@/lib/i18n/actionError'

export interface ScheduleCourse {
  id: string
  name: string
  day_of_week: number
  start_time: string
  end_time: string
  branch_id: string
  dance_type_id: string
  branchName: string
  danceTypeName: string
  /** Room the course is usually held in */
  studio_id: string | null
  studioName: string | null
  /** YYYY-MM-DD; the course isn't shown on the calendar before this day */
  createdOn: string
  instructors: Array<{ id: string; first_name: string; last_name: string }>
  studentCount: number
}

export interface ScheduleSession {
  id: string
  course_id: string
  session_date: string
  attendanceCount: number
  presentCount: number
}

/**
 * Every active course of the organization (not paginated), ordered by weekday and start time.
 * For the calendar, the attendance overview and the dashboard.
 */
export async function getScheduleCourses(): Promise<{ data?: ScheduleCourse[]; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }
  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('courses')
    .select(
      'id, name, day_of_week, start_time, end_time, branch_id, dance_type_id, studio_id, created_at, studios(name), branches!inner(name, organization_id), dance_types(name), course_instructors(instructors(id, first_name, last_name)), course_students(students(is_active, deleted_at))'
    )
    .eq('branches.organization_id', organization.id)
    .is('deleted_at', null)
    .order('day_of_week')
    .order('start_time')

  if (error) {
    console.error('[getScheduleCourses]', error)
    return { error: await actionError('fetchCoursesFailed') }
  }

  return {
    data: (data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      day_of_week: c.day_of_week,
      start_time: c.start_time,
      end_time: c.end_time,
      branch_id: c.branch_id,
      dance_type_id: c.dance_type_id,
      branchName: c.branches?.name ?? '',
      danceTypeName: c.dance_types?.name ?? '',
      studio_id: c.studio_id,
      createdOn: c.created_at.slice(0, 10),
      studioName: c.studios?.name ?? null,
      instructors: (c.course_instructors ?? [])
        .map((ci) => ci.instructors)
        .filter((i): i is NonNullable<typeof i> => i !== null),
      // Students who will be on the attendance sheet: not deleted, not passive
      studentCount: (c.course_students ?? []).filter((cs) => cs.students && cs.students.is_active && !cs.students.deleted_at)
        .length,
    })),
  }
}

/** Sessions (with attendance counts) of the organization's courses between two days, inclusive. */
export async function getSessionsInRange(
  from: string,
  to: string
): Promise<{ data?: ScheduleSession[]; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }
  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('course_sessions')
    .select('id, course_id, session_date, courses!inner(branches!inner(organization_id)), attendances(is_present)')
    .eq('courses.branches.organization_id', organization.id)
    .gte('session_date', from)
    .lte('session_date', to)

  if (error) {
    console.error('[getSessionsInRange]', error)
    return { error: await actionError('fetchSessionsFailed') }
  }

  return {
    data: (data ?? []).map((s) => ({
      id: s.id,
      course_id: s.course_id,
      session_date: s.session_date,
      attendanceCount: s.attendances?.length ?? 0,
      presentCount: (s.attendances ?? []).filter((a) => a.is_present).length,
    })),
  }
}

/** Branches of the organization with their rooms, for the calendar's room view and branch filter. */
export async function getScheduleRooms(): Promise<{
  data?: Array<{ id: string; name: string; studios: Array<{ id: string; name: string }> }>
  error?: string
}> {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }
  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('branches')
    .select('id, name, studios(id, name)')
    .eq('organization_id', organization.id)
    .is('deleted_at', null)
    .order('name')
  if (error) {
    console.error('[getScheduleRooms]', error)
    return { error: await actionError('fetchBranchesFailed') }
  }
  return {
    data: (data ?? []).map((b) => ({
      id: b.id,
      name: b.name,
      studios: [...(b.studios ?? [])].sort((x, y) => x.name.localeCompare(y.name)),
    })),
  }
}
