'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'

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
          courses(
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
