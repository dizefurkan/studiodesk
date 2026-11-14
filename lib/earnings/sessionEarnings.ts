import { createAdminClient } from '@/lib/supabase/admin'

type Admin = ReturnType<typeof createAdminClient>

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * The value of one lesson for each student package: what the student actually paid for the
 * package (its income entries in the cash register, or the list price when there are none)
 * divided by the package's number of lessons.
 */
async function lessonValues(admin: Admin, studentPackageIds: string[]): Promise<Map<string, number>> {
  const values = new Map<string, number>()
  if (studentPackageIds.length === 0) return values

  const [{ data: pkgs }, { data: payments }] = await Promise.all([
    admin.from('student_packages').select('id, packages(price, total_credits)').in('id', studentPackageIds),
    admin
      .from('cash_transactions')
      .select('student_package_id, amount')
      .eq('type', 'income')
      .in('student_package_id', studentPackageIds),
  ])

  const paid = new Map<string, number>()
  for (const p of payments ?? []) {
    if (!p.student_package_id) continue
    paid.set(p.student_package_id, (paid.get(p.student_package_id) ?? 0) + Number(p.amount))
  }

  for (const sp of pkgs ?? []) {
    const pkg = sp.packages as { price: number; total_credits: number } | null
    if (!pkg || !pkg.total_credits) continue
    const amount = paid.get(sp.id) ?? Number(pkg.price)
    values.set(sp.id, amount / pkg.total_credits)
  }
  return values
}

/**
 * (Re)calculates instructor earnings for one session.
 *
 * Earnings = instructor rate (%) × the sum of the lesson values of every attendance that
 * took a credit. Attendance without a credit taken (absent without deduction, or marked
 * "don't take a credit") adds nothing. One row per instructor of the session; an instructor
 * without a rate for the course's branch and dance style gets no row.
 *
 * Callers must have checked that the session belongs to the user's organization.
 */
export async function recalculateSessionEarnings(sessionId: string): Promise<{ error?: string }> {
  const admin = createAdminClient()

  const { data: session } = await admin
    .from('course_sessions')
    .select('id, courses(branch_id, dance_type_id)')
    .eq('id', sessionId)
    .maybeSingle()
  const course = session?.courses as { branch_id: string; dance_type_id: string } | null
  if (!session || !course) return { error: 'session not found' }

  const [{ data: instructors }, { data: attendances }] = await Promise.all([
    admin.from('session_instructors').select('instructor_id').eq('session_id', sessionId),
    admin.from('attendances').select('student_package_id').eq('session_id', sessionId).eq('deduct_credits', true),
  ])

  const packageIds = [...new Set((attendances ?? []).map((a) => a.student_package_id).filter(Boolean))]
  const values = await lessonValues(admin, packageIds)
  const lessonTotal = (attendances ?? []).reduce((sum, a) => sum + (values.get(a.student_package_id) ?? 0), 0)

  const instructorIds = (instructors ?? []).map((i) => i.instructor_id)
  const { data: rates } = instructorIds.length
    ? await admin
        .from('instructor_rates')
        .select('instructor_id, ratio_per_class')
        .in('instructor_id', instructorIds)
        .eq('branch_id', course.branch_id)
        .eq('dance_type_id', course.dance_type_id)
    : { data: [] as { instructor_id: string; ratio_per_class: number }[] }
  const rateOf = new Map((rates ?? []).map((r) => [r.instructor_id, Number(r.ratio_per_class)]))

  const rows = instructorIds
    .filter((id) => (rateOf.get(id) ?? 0) > 0)
    .map((id) => ({
      instructor_id: id,
      session_id: sessionId,
      amount: round2(((rateOf.get(id) ?? 0) / 100) * lessonTotal),
    }))

  // Instructors no longer on the session (or without a rate) lose their row
  const keep = rows.map((r) => r.instructor_id)
  let stale = admin.from('instructor_earnings').delete().eq('session_id', sessionId)
  if (keep.length) stale = stale.not('instructor_id', 'in', `(${keep.join(',')})`)
  const { error: deleteError } = await stale
  if (deleteError) return { error: deleteError.message }

  if (rows.length) {
    const { error } = await admin
      .from('instructor_earnings')
      .upsert(rows, { onConflict: 'instructor_id,session_id' })
    if (error) return { error: error.message }
  }
  return {}
}
