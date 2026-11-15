import { createAdminClient } from '@/lib/supabase/admin'
import { todayInTimeZone } from '@/lib/i18n/dates'
import type { Json } from '@/lib/types/database.types'
import { closedMonths, monthStart } from './periods'
import { PAY_MODELS, type PayModel } from './payModels'

type Admin = ReturnType<typeof createAdminClient>

const round2 = (n: number) => Math.round(n * 100) / 100

export { PAY_MODELS, type PayModel }

export type RateVersion = {
  id: string
  rate_id: string
  effective_from: string
  pay_model: string
  ratio: number
  amount: number | null
  min_amount: number | null
}

/** How one instructor's pay for one lesson was calculated (stored in instructor_earnings.breakdown). */
export type EarningBreakdown = {
  model: PayModel
  ratio: number
  amount: number | null
  minAmount: number | null
  effectiveFrom: string
  hours: number
  lessonTotal: number
  presentCount: number
  creditCount: number
  calculated: number
  minApplied: boolean
  substitute: boolean
  students: { id: string; name: string; present: boolean; credit: boolean; value: number }[]
}

/**
 * The value of one lesson for each student package: what the student actually paid for the
 * package (its income entries in the cash register, or the list price when there are none)
 * divided by the package's number of lessons.
 */
export async function lessonValues(admin: Admin, studentPackageIds: string[]): Promise<Map<string, number>> {
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

/** Hours between two "HH:MM[:SS]" times (0 when invalid). */
export function lessonHours(start: string, end: string): number {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + (m || 0)
  }
  const diff = toMin(end) - toMin(start)
  return diff > 0 ? round2(diff / 60) : 0
}

/**
 * Pay for one lesson under a rate version.
 * - percentage: ratio % of the value of the lessons that took a credit
 * - per_lesson: a fixed amount when the lesson took place (anyone attended)
 * - per_hour:   amount × lesson length in hours, when the lesson took place
 * - per_student: amount × students present
 * A minimum guarantee lifts the result to `min_amount` when the lesson took place.
 */
export function computePay(
  version: Pick<RateVersion, 'pay_model' | 'ratio' | 'amount' | 'min_amount'>,
  ctx: { lessonTotal: number; presentCount: number; creditCount: number; hours: number }
): { amount: number; minApplied: boolean } {
  const held = ctx.presentCount > 0 || ctx.creditCount > 0
  const fixed = Number(version.amount ?? 0)
  let amount = 0
  switch (version.pay_model) {
    case 'per_lesson':
      amount = held ? fixed : 0
      break
    case 'per_hour':
      amount = held ? fixed * ctx.hours : 0
      break
    case 'per_student':
      amount = fixed * ctx.presentCount
      break
    default:
      amount = (Number(version.ratio) / 100) * ctx.lessonTotal
  }
  const min = Number(version.min_amount ?? 0)
  if (held && min > 0 && amount < min) return { amount: round2(min), minApplied: true }
  return { amount: round2(amount), minApplied: false }
}

/** The rate version in force on `date` for each instructor (course's branch + dance type). */
export async function versionsOn(
  admin: Admin,
  instructorIds: string[],
  branchId: string,
  danceTypeId: string,
  date: string
): Promise<Map<string, RateVersion>> {
  const result = new Map<string, RateVersion>()
  if (!instructorIds.length) return result
  const { data: rates } = await admin
    .from('instructor_rates')
    .select('id, instructor_id, instructor_rate_versions(id, rate_id, effective_from, pay_model, ratio, amount, min_amount)')
    .in('instructor_id', instructorIds)
    .eq('branch_id', branchId)
    .eq('dance_type_id', danceTypeId)
  for (const rate of rates ?? []) {
    const inForce = (rate.instructor_rate_versions ?? [])
      .filter((v) => v.effective_from <= date)
      .sort((a, b) => (a.effective_from < b.effective_from ? 1 : -1))[0]
    if (inForce) result.set(rate.instructor_id, inForce)
  }
  return result
}

/**
 * (Re)calculates instructor earnings for one session.
 *
 * Each instructor of the session is paid under the rate version in force on the lesson date
 * (see computePay). Open month: rows are written directly; a row whose amount was set by hand
 * keeps its amount (only calculated_amount and the breakdown are refreshed). Closed month:
 * rows stay as they were and the difference is written as a correction item dated today, so a
 * closed month's totals never change.
 *
 * Callers must have checked that the session belongs to the user's organization.
 */
export async function recalculateSessionEarnings(sessionId: string): Promise<{ error?: string }> {
  const admin = createAdminClient()

  const { data: session } = await admin
    .from('course_sessions')
    .select(
      'id, session_date, course_id, courses(branch_id, dance_type_id, start_time, end_time, branches(organization_id, organizations(timezone)))'
    )
    .eq('id', sessionId)
    .maybeSingle()
  const course = session?.courses
  const organizationId = course?.branches?.organization_id
  if (!session || !course || !organizationId) return { error: 'session not found' }
  const date = session.session_date

  const [{ data: sessionInstructors }, { data: regular }, { data: attendances }, { data: existing }, { data: period }] =
    await Promise.all([
      admin.from('session_instructors').select('instructor_id').eq('session_id', sessionId),
      admin.from('course_instructors').select('instructor_id').eq('course_id', session.course_id),
      admin
        .from('attendances')
        .select('student_id, student_package_id, is_present, deduct_credits, students(first_name, last_name)')
        .eq('session_id', sessionId),
      admin.from('instructor_earnings').select('id, instructor_id, amount, is_manual').eq('session_id', sessionId),
      admin
        .from('instructor_pay_periods')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('period_month', monthStart(date))
        .maybeSingle(),
    ])

  const credited = (attendances ?? []).filter((a) => a.deduct_credits)
  const values = await lessonValues(admin, [...new Set(credited.map((a) => a.student_package_id))])
  const lessonTotal = round2(credited.reduce((sum, a) => sum + (values.get(a.student_package_id) ?? 0), 0))
  const presentCount = (attendances ?? []).filter((a) => a.is_present).length
  const hours = lessonHours(course.start_time, course.end_time)
  const students = (attendances ?? []).map((a) => ({
    id: a.student_id,
    name: a.students ? `${a.students.first_name} ${a.students.last_name}` : '',
    present: a.is_present,
    credit: a.deduct_credits,
    value: a.deduct_credits ? round2(values.get(a.student_package_id) ?? 0) : 0,
  }))

  const instructorIds = (sessionInstructors ?? []).map((i) => i.instructor_id)
  const regularIds = new Set((regular ?? []).map((i) => i.instructor_id))
  const versions = await versionsOn(admin, instructorIds, course.branch_id, course.dance_type_id, date)

  const computed = new Map<string, { amount: number; breakdown: EarningBreakdown }>()
  for (const id of instructorIds) {
    const v = versions.get(id)
    if (!v) continue
    const pay = computePay(v, { lessonTotal, presentCount, creditCount: credited.length, hours })
    if (pay.amount <= 0) continue
    computed.set(id, {
      amount: pay.amount,
      breakdown: {
        model: (PAY_MODELS as readonly string[]).includes(v.pay_model) ? (v.pay_model as PayModel) : 'percentage',
        ratio: Number(v.ratio),
        amount: v.amount === null ? null : Number(v.amount),
        minAmount: v.min_amount === null ? null : Number(v.min_amount),
        effectiveFrom: v.effective_from,
        hours,
        lessonTotal,
        presentCount,
        creditCount: credited.length,
        calculated: pay.amount,
        minApplied: pay.minApplied,
        substitute: regularIds.size > 0 && !regularIds.has(id),
        students,
      },
    })
  }

  const existingBy = new Map((existing ?? []).map((e) => [e.instructor_id, e]))

  // Closed month: keep the rows, book the difference as a correction in the current month
  if (period) {
    const { data: corrections } = await admin
      .from('instructor_adjustments')
      .select('instructor_id, amount')
      .eq('organization_id', organizationId)
      .eq('kind', 'correction')
      .eq('source_session_id', sessionId)
    const corrected = new Map<string, number>()
    for (const c of corrections ?? []) corrected.set(c.instructor_id, (corrected.get(c.instructor_id) ?? 0) + Number(c.amount))

    const ids = new Set([...computed.keys(), ...existingBy.keys(), ...corrected.keys()])
    const today = todayInTimeZone(course.branches?.organizations?.timezone)
    const inserts = []
    for (const id of ids) {
      const row = existingBy.get(id)
      if (row?.is_manual) continue
      const current = Number(row?.amount ?? 0) + (corrected.get(id) ?? 0)
      const diff = round2((computed.get(id)?.amount ?? 0) - current)
      if (Math.abs(diff) < 0.01) continue
      inserts.push({
        organization_id: organizationId,
        instructor_id: id,
        applies_on: today,
        kind: 'correction',
        amount: diff,
        source_session_id: sessionId,
      })
    }
    if (inserts.length) {
      const { error } = await admin.from('instructor_adjustments').insert(inserts)
      if (error) return { error: error.message }
    }
    return {}
  }

  // Open month. Rows of instructors no longer paid for this lesson go away, except hand-set
  // rows of instructors who still taught it.
  const stale = (existing ?? []).filter(
    (e) => !computed.has(e.instructor_id) && !(e.is_manual && instructorIds.includes(e.instructor_id))
  )
  if (stale.length) {
    const { error } = await admin.from('instructor_earnings').delete().in('id', stale.map((e) => e.id))
    if (error) return { error: error.message }
  }

  for (const [id, c] of computed) {
    const row = existingBy.get(id)
    const breakdown = c.breakdown as unknown as Json
    if (row) {
      const { error } = await admin
        .from('instructor_earnings')
        .update(
          row.is_manual
            ? { calculated_amount: c.amount, breakdown, earned_on: date }
            : { amount: c.amount, calculated_amount: c.amount, breakdown, earned_on: date }
        )
        .eq('id', row.id)
      if (error) return { error: error.message }
    } else {
      const { error } = await admin.from('instructor_earnings').insert({
        instructor_id: id,
        session_id: sessionId,
        amount: c.amount,
        calculated_amount: c.amount,
        breakdown,
        earned_on: date,
      })
      if (error) return { error: error.message }
    }
  }
  return {}
}

async function recalculateMany(sessionIds: string[]): Promise<{ error?: string }> {
  for (const id of [...new Set(sessionIds)]) {
    const res = await recalculateSessionEarnings(id)
    if (res.error) return res
  }
  return {}
}

/** After a package payment changes, lessons that used the package are worth a different amount. */
export async function recalculateEarningsForStudentPackage(studentPackageId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('attendances')
    .select('session_id')
    .eq('student_package_id', studentPackageId)
    .eq('deduct_credits', true)
  return recalculateMany((data ?? []).map((a) => a.session_id))
}

/**
 * After a rate version changes: every lesson of this instructor/branch/dance type from
 * `fromDate` up to today. Lessons in closed months are left alone: a rate change never
 * reopens a closed month.
 */
export async function recalculateEarningsForRate(rateId: string, fromDate: string) {
  const admin = createAdminClient()
  const { data: rate } = await admin
    .from('instructor_rates')
    .select('instructor_id, branch_id, dance_type_id, instructors(organization_id, organizations(timezone))')
    .eq('id', rateId)
    .maybeSingle()
  if (!rate) return {}
  const today = todayInTimeZone(rate.instructors?.organizations?.timezone)
  const { data } = await admin
    .from('session_instructors')
    .select('session_id, course_sessions!inner(session_date, courses!inner(branch_id, dance_type_id))')
    .eq('instructor_id', rate.instructor_id)
    .gte('course_sessions.session_date', fromDate)
    .lte('course_sessions.session_date', today)
    .eq('course_sessions.courses.branch_id', rate.branch_id)
    .eq('course_sessions.courses.dance_type_id', rate.dance_type_id)
  const closed = rate.instructors ? await closedMonths(admin, rate.instructors.organization_id) : new Set<string>()
  return recalculateMany(
    (data ?? [])
      .filter((s) => s.course_sessions && !closed.has(monthStart(s.course_sessions.session_date)))
      .map((s) => s.session_id)
  )
}

/** Every lesson in a month (used when a closed month is reopened). */
export async function recalculateEarningsForMonth(organizationId: string, month: string) {
  const admin = createAdminClient()
  const from = monthStart(month)
  const [y, m] = month.split('-').map(Number)
  const to = `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
  const { data } = await admin
    .from('course_sessions')
    .select('id, courses!inner(branches!inner(organization_id))')
    .eq('courses.branches.organization_id', organizationId)
    .gte('session_date', from)
    .lte('session_date', to)
  return recalculateMany((data ?? []).map((s) => s.id))
}
