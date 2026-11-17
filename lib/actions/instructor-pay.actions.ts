'use server'

import { unstable_rethrow } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canSeeInstructor, getPayAccess } from '@/lib/auth/payAccess'
import { actionError } from '@/lib/i18n/actionError'
import { todayInTimeZone } from '@/lib/i18n/dates'
import { logOperation } from '@/lib/actions/history.actions'
import { isDateLocked, monthEnd, monthStart, parseDate, parseMonth } from '@/lib/earnings/periods'
import { recalculateEarningsForMonth, type EarningBreakdown } from '@/lib/earnings/sessionEarnings'
import { ADJUSTMENT_KINDS, PAYOUT_METHODS, type AdjustmentKind, type PayoutMethod } from '@/lib/earnings/constants'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

const round2 = (n: number) => Math.round(n * 100) / 100


type BalanceRow = {
  instructor_id: string
  opening: number
  earned: number
  lesson_count: number
  adjustments: number
  paid: number
}

async function balances(organizationId: string, month: string): Promise<BalanceRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('instructor_pay_balances', {
    p_organization_id: organizationId,
    p_from: monthStart(month),
    p_to: monthEnd(month),
  })
  if (error) throw error
  return (data ?? []).map((r) => ({
    instructor_id: r.instructor_id,
    opening: Number(r.opening),
    earned: Number(r.earned),
    lesson_count: Number(r.lesson_count),
    adjustments: Number(r.adjustments),
    paid: Number(r.paid),
  }))
}

const closingOf = (b: Pick<BalanceRow, 'opening' | 'earned' | 'adjustments' | 'paid'>) =>
  round2(b.opening + b.earned + b.adjustments - b.paid)

// ---------------------------------------------------------------------------------------------
// Monthly summary (payouts page)
// ---------------------------------------------------------------------------------------------

/**
 * Per instructor for one month: balance carried in, earnings, extra items, payouts and the
 * balance left to pay. Owners and managers only.
 */
export async function getPaySummary(monthInput?: string) {
  const access = await getPayAccess()
  if (!access) return { error: await actionError('notAuthenticated') }
  if (!access.canManage) return { error: await actionError('noPayPermission') }

  const today = todayInTimeZone(access.timezone)
  const month = parseMonth(monthInput) ?? today.slice(0, 7)

  try {
    const admin = createAdminClient()
    const [rows, { data: instructors }, { data: branches }, { data: periods }] = await Promise.all([
      balances(access.organizationId, month),
      admin
        .from('instructors')
        .select('id, first_name, last_name, deleted_at')
        .eq('organization_id', access.organizationId)
        .order('first_name'),
      admin
        .from('branches')
        .select('id, name')
        .eq('organization_id', access.organizationId)
        .is('deleted_at', null)
        .order('name'),
      admin
        .from('instructor_pay_periods')
        .select('period_month, closed_at')
        .eq('organization_id', access.organizationId)
        .order('period_month', { ascending: false }),
    ])

    const byId = new Map(rows.map((r) => [r.instructor_id, r]))
    const list = (instructors ?? [])
      .map((i) => {
        const b = byId.get(i.id) ?? { opening: 0, earned: 0, lesson_count: 0, adjustments: 0, paid: 0 }
        return {
          instructorId: i.id,
          name: `${i.first_name} ${i.last_name}`,
          archived: !!i.deleted_at,
          opening: round2(b.opening),
          earned: round2(b.earned),
          lessonCount: b.lesson_count,
          adjustments: round2(b.adjustments),
          paid: round2(b.paid),
          closing: closingOf(b),
        }
      })
      // Archived instructors only while something is still open or moved this month
      .filter((r) => !r.archived || r.closing !== 0 || r.earned !== 0 || r.paid !== 0 || r.adjustments !== 0)

    const totals = list.reduce(
      (t, r) => ({
        opening: t.opening + r.opening,
        earned: t.earned + r.earned,
        adjustments: t.adjustments + r.adjustments,
        paid: t.paid + r.paid,
        closing: t.closing + r.closing,
      }),
      { opening: 0, earned: 0, adjustments: 0, paid: 0, closing: 0 }
    )

    const closed = (periods ?? []).find((p) => p.period_month === monthStart(month))
    const latestClosed = periods?.[0]?.period_month ?? null

    return {
      data: {
        month,
        today,
        rows: list,
        totals: {
          opening: round2(totals.opening),
          earned: round2(totals.earned),
          adjustments: round2(totals.adjustments),
          paid: round2(totals.paid),
          closing: round2(totals.closing),
        },
        branches: branches ?? [],
        isClosed: !!closed,
        closedAt: closed?.closed_at ?? null,
        canClose: !closed && monthEnd(month) < today,
        canReopen: !!closed && access.isOwner && latestClosed === monthStart(month),
        isOwner: access.isOwner,
      },
    }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Unexpected error in getPaySummary:', error)
    return { error: await actionError('fetchPaySummaryFailed') }
  }
}

// ---------------------------------------------------------------------------------------------
// Pay periods
// ---------------------------------------------------------------------------------------------

/** Closes a finished month: its earnings, items and payouts can no longer change. */
export async function closePayPeriod(monthInput: string) {
  const access = await getPayAccess()
  if (!access) return { error: await actionError('notAuthenticated') }
  if (!access.canManage) return { error: await actionError('noPayPermission') }
  const month = parseMonth(monthInput)
  if (!month) return { error: await actionError('invalidDate') }
  if (monthEnd(month) >= todayInTimeZone(access.timezone)) return { error: await actionError('periodNotEnded') }

  try {
    const admin = createAdminClient()
    const rows = await balances(access.organizationId, month)
    const summary = rows
      .filter((r) => r.opening || r.earned || r.adjustments || r.paid)
      .map((r) => ({ ...r, closing: closingOf(r) }))

    const user = await getCurrentUser()
    const { data, error } = await admin
      .from('instructor_pay_periods')
      .insert({
        organization_id: access.organizationId,
        period_month: monthStart(month),
        closed_by: user?.id ?? null,
        summary,
      })
      .select('id')
      .single()
    if (error) {
      if (error.code === '23505') return { error: await actionError('periodAlreadyClosed') }
      console.error('Error closing pay period:', error)
      return { error: await actionError('closePeriodFailed') }
    }

    void logOperation('CREATE', 'instructor_pay_period', data.id, { after: { month } }, access.organizationId)
    return { success: true }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Unexpected error in closePayPeriod:', error)
    return { error: await actionError('closePeriodFailed') }
  }
}

/**
 * Reopens the most recently closed month (owner only). Corrections that were booked for its
 * lessons while it was closed are removed and its lessons are recalculated, so nothing is
 * counted twice.
 */
export async function reopenPayPeriod(monthInput: string) {
  const access = await getPayAccess()
  if (!access) return { error: await actionError('notAuthenticated') }
  if (!access.isOwner) return { error: await actionError('onlyOwnerReopens') }
  const month = parseMonth(monthInput)
  if (!month) return { error: await actionError('invalidDate') }

  try {
    const admin = createAdminClient()
    const { data: periods } = await admin
      .from('instructor_pay_periods')
      .select('id, period_month')
      .eq('organization_id', access.organizationId)
      .order('period_month', { ascending: false })
    const period = (periods ?? []).find((p) => p.period_month === monthStart(month))
    if (!period) return { error: await actionError('periodNotClosed') }
    if (periods?.[0]?.id !== period.id) return { error: await actionError('reopenLatestOnly') }

    // Corrections booked for this month's lessons (they live in later, open months)
    const { data: sessions } = await admin
      .from('course_sessions')
      .select('id, courses!inner(branches!inner(organization_id))')
      .eq('courses.branches.organization_id', access.organizationId)
      .gte('session_date', monthStart(month))
      .lte('session_date', monthEnd(month))
    const sessionIds = (sessions ?? []).map((s) => s.id)
    if (sessionIds.length) {
      const { error: corrError } = await admin
        .from('instructor_adjustments')
        .delete()
        .eq('organization_id', access.organizationId)
        .eq('kind', 'correction')
        .in('source_session_id', sessionIds)
      if (corrError) {
        console.error('Error removing corrections:', corrError)
        return { error: await actionError('reopenPeriodFailed') }
      }
    }

    const { error } = await admin.from('instructor_pay_periods').delete().eq('id', period.id)
    if (error) return { error: await actionError('reopenPeriodFailed') }

    const recalc = await recalculateEarningsForMonth(access.organizationId, month)
    if (recalc.error) console.error('Error recalculating reopened month:', recalc.error)

    void logOperation('DELETE', 'instructor_pay_period', period.id, { before: { month } }, access.organizationId)
    return { success: true }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Unexpected error in reopenPayPeriod:', error)
    return { error: await actionError('reopenPeriodFailed') }
  }
}

// ---------------------------------------------------------------------------------------------
// Extra items
// ---------------------------------------------------------------------------------------------

async function instructorInOrg(instructorId: string, organizationId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('instructors')
    .select('id, first_name, last_name')
    .eq('id', instructorId)
    .eq('organization_id', organizationId)
    .maybeSingle()
  return data
}

export async function createAdjustment(input: {
  instructorId: string
  date: string
  kind: string
  amount: number
  description?: string
}) {
  const access = await getPayAccess()
  if (!access) return { error: await actionError('notAuthenticated') }
  if (!access.canManage) return { error: await actionError('noPayPermission') }

  const date = parseDate(input.date)
  if (!date) return { error: await actionError('invalidDate') }
  if (!(ADJUSTMENT_KINDS as readonly string[]).includes(input.kind)) return { error: await actionError('invalidInput') }
  if (!Number.isFinite(input.amount) || input.amount <= 0) return { error: await actionError('invalidAmount') }
  const description = input.description?.trim() || null
  if (description && description.length > 500) return { error: await actionError('invalidInput') }

  try {
    const instructor = await instructorInOrg(input.instructorId, access.organizationId)
    if (!instructor) return { error: await actionError('instructorNotInOrg') }

    const admin = createAdminClient()
    if (await isDateLocked(admin, access.organizationId, date)) return { error: await actionError('periodLocked') }

    const amount = round2(input.kind === 'deduction' ? -input.amount : input.amount)
    const user = await getCurrentUser()
    const { data, error } = await admin
      .from('instructor_adjustments')
      .insert({
        organization_id: access.organizationId,
        instructor_id: instructor.id,
        applies_on: date,
        kind: input.kind,
        amount,
        description,
        created_by: user?.id ?? null,
      })
      .select('id')
      .single()
    if (error) {
      console.error('Error creating adjustment:', error)
      return { error: await actionError('createAdjustmentFailed') }
    }

    void logOperation(
      'CREATE',
      'instructor_adjustment',
      data.id,
      { after: { instructorName: `${instructor.first_name} ${instructor.last_name}`, kind: input.kind, amount, date } },
      access.organizationId
    )
    return { success: true }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Unexpected error in createAdjustment:', error)
    return { error: await actionError('createAdjustmentFailed') }
  }
}

export async function deleteAdjustment(adjustmentId: string) {
  const access = await getPayAccess()
  if (!access) return { error: await actionError('notAuthenticated') }
  if (!access.canManage) return { error: await actionError('noPayPermission') }

  try {
    const admin = createAdminClient()
    const { data: item } = await admin
      .from('instructor_adjustments')
      .select('id, applies_on, kind, amount, instructor_id')
      .eq('id', adjustmentId)
      .eq('organization_id', access.organizationId)
      .maybeSingle()
    if (!item) return { error: await actionError('adjustmentNotFound') }
    if (await isDateLocked(admin, access.organizationId, item.applies_on)) return { error: await actionError('periodLocked') }

    const { error } = await admin.from('instructor_adjustments').delete().eq('id', item.id)
    if (error) return { error: await actionError('deleteAdjustmentFailed') }

    void logOperation(
      'DELETE',
      'instructor_adjustment',
      item.id,
      { before: { kind: item.kind, amount: item.amount, date: item.applies_on } },
      access.organizationId
    )
    return { success: true }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Unexpected error in deleteAdjustment:', error)
    return { error: await actionError('deleteAdjustmentFailed') }
  }
}

// ---------------------------------------------------------------------------------------------
// Payouts
// ---------------------------------------------------------------------------------------------

/** Records a payment to an instructor; it is also written to the cash register as an expense. */
export async function createPayout(input: {
  instructorId: string
  branchId: string
  amount: number
  date: string
  method: string
  note?: string
}) {
  const access = await getPayAccess()
  if (!access) return { error: await actionError('notAuthenticated') }
  if (!access.canManage) return { error: await actionError('noPayPermission') }

  const date = parseDate(input.date)
  if (!date) return { error: await actionError('invalidDate') }
  if (!(PAYOUT_METHODS as readonly string[]).includes(input.method)) return { error: await actionError('invalidInput') }
  if (!Number.isFinite(input.amount) || input.amount <= 0) return { error: await actionError('invalidAmount') }
  const note = input.note?.trim() || null
  if (note && note.length > 500) return { error: await actionError('invalidInput') }
  const today = todayInTimeZone(access.timezone)
  if (date > today) return { error: await actionError('payoutInFuture') }

  try {
    const admin = createAdminClient()
    const [instructor, { data: branch }] = await Promise.all([
      instructorInOrg(input.instructorId, access.organizationId),
      admin
        .from('branches')
        .select('id')
        .eq('id', input.branchId)
        .eq('organization_id', access.organizationId)
        .maybeSingle(),
    ])
    if (!instructor) return { error: await actionError('instructorNotInOrg') }
    if (!branch) return { error: await actionError('invalidBranch') }
    if (await isDateLocked(admin, access.organizationId, date)) return { error: await actionError('periodLocked') }

    const amount = round2(input.amount)
    const t = await getTranslations('instructorPay')
    const name = `${instructor.first_name} ${instructor.last_name}`

    // The cash register shows created_at as the transaction date. Midday UTC stays on the same
    // calendar day for every time zone the app supports.
    const { data: tx, error: txError } = await admin
      .from('cash_transactions')
      .insert({
        branch_id: branch.id,
        type: 'expense',
        category: 'instructor_payment',
        amount,
        description: t('payoutCashDescription', { name }),
        ...(date === today ? {} : { created_at: `${date}T12:00:00Z` }),
      })
      .select('id')
      .single()
    if (txError || !tx) {
      console.error('Error creating payout transaction:', txError)
      return { error: await actionError('createPayoutFailed') }
    }

    const user = await getCurrentUser()
    const { data, error } = await admin
      .from('instructor_payouts')
      .insert({
        organization_id: access.organizationId,
        instructor_id: instructor.id,
        branch_id: branch.id,
        cash_transaction_id: tx.id,
        amount,
        paid_on: date,
        method: input.method,
        note,
        created_by: user?.id ?? null,
      })
      .select('id')
      .single()
    if (error) {
      console.error('Error creating payout:', error)
      await admin.from('cash_transactions').delete().eq('id', tx.id)
      return { error: await actionError('createPayoutFailed') }
    }

    void logOperation(
      'CREATE',
      'instructor_payout',
      data.id,
      { after: { instructorName: name, amount, date, method: input.method } },
      access.organizationId
    )
    return { success: true }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Unexpected error in createPayout:', error)
    return { error: await actionError('createPayoutFailed') }
  }
}

/** Deletes a payout together with its cash register expense. */
export async function deletePayout(payoutId: string) {
  const access = await getPayAccess()
  if (!access) return { error: await actionError('notAuthenticated') }
  if (!access.canManage) return { error: await actionError('noPayPermission') }

  try {
    const admin = createAdminClient()
    const { data: payout } = await admin
      .from('instructor_payouts')
      .select('id, paid_on, amount, cash_transaction_id')
      .eq('id', payoutId)
      .eq('organization_id', access.organizationId)
      .maybeSingle()
    if (!payout) return { error: await actionError('payoutNotFound') }
    if (await isDateLocked(admin, access.organizationId, payout.paid_on)) return { error: await actionError('periodLocked') }

    // Deleting the cash transaction cascades to the payout
    const { error } = payout.cash_transaction_id
      ? await admin.from('cash_transactions').delete().eq('id', payout.cash_transaction_id)
      : await admin.from('instructor_payouts').delete().eq('id', payout.id)
    if (error) return { error: await actionError('deletePayoutFailed') }

    void logOperation(
      'DELETE',
      'instructor_payout',
      payout.id,
      { before: { amount: payout.amount, date: payout.paid_on } },
      access.organizationId
    )
    return { success: true }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Unexpected error in deletePayout:', error)
    return { error: await actionError('deletePayoutFailed') }
  }
}

// ---------------------------------------------------------------------------------------------
// Statement
// ---------------------------------------------------------------------------------------------

/**
 * One instructor's statement for a month: every lesson with how its pay was calculated,
 * extra items, payouts and the balances. Owners/managers for anyone, instructors for themselves.
 */
export async function getInstructorStatement(instructorId: string, monthInput?: string) {
  const access = await getPayAccess()
  if (!access) return { error: await actionError('notAuthenticated') }
  if (!canSeeInstructor(access, instructorId)) return { error: await actionError('noPayPermission') }

  const today = todayInTimeZone(access.timezone)
  const month = parseMonth(monthInput) ?? today.slice(0, 7)
  const from = monthStart(month)
  const to = monthEnd(month)

  try {
    const admin = createAdminClient()
    const instructor = await instructorInOrg(instructorId, access.organizationId)
    if (!instructor) return { error: await actionError('instructorNotInOrg') }

    const [rows, { data: earnings }, { data: adjustments }, { data: payouts }, { data: period }, { data: branches }] =
      await Promise.all([
      balances(access.organizationId, month),
      admin
        .from('instructor_earnings')
        .select(
          'id, amount, calculated_amount, is_manual, earned_on, breakdown, session_id, course_sessions(courses(name, start_time, end_time, branches(name), dance_types(name)))'
        )
        .eq('instructor_id', instructorId)
        .gte('earned_on', from)
        .lte('earned_on', to)
        .order('earned_on'),
      admin
        .from('instructor_adjustments')
        .select('id, applies_on, kind, amount, description, course_sessions(session_date, courses(name))')
        .eq('organization_id', access.organizationId)
        .eq('instructor_id', instructorId)
        .gte('applies_on', from)
        .lte('applies_on', to)
        .order('applies_on'),
      admin
        .from('instructor_payouts')
        .select('id, paid_on, amount, method, note, branches(name)')
        .eq('organization_id', access.organizationId)
        .eq('instructor_id', instructorId)
        .gte('paid_on', from)
        .lte('paid_on', to)
        .order('paid_on'),
      admin
        .from('instructor_pay_periods')
        .select('closed_at')
        .eq('organization_id', access.organizationId)
        .eq('period_month', from)
        .maybeSingle(),
      admin
        .from('branches')
        .select('id, name')
        .eq('organization_id', access.organizationId)
        .is('deleted_at', null)
        .order('name'),
    ])

    const b = rows.find((r) => r.instructor_id === instructorId) ?? {
      opening: 0,
      earned: 0,
      lesson_count: 0,
      adjustments: 0,
      paid: 0,
    }

    return {
      data: {
        instructor: { id: instructor.id, name: `${instructor.first_name} ${instructor.last_name}` },
        month,
        isClosed: !!period,
        closedAt: period?.closed_at ?? null,
        canManage: access.canManage,
        today,
        branches: access.canManage ? (branches ?? []) : [],
        summary: {
          opening: round2(b.opening),
          earned: round2(b.earned),
          lessonCount: b.lesson_count,
          adjustments: round2(b.adjustments),
          paid: round2(b.paid),
          closing: closingOf(b),
        },
        lessons: (earnings ?? []).map((e) => ({
          id: e.id,
          date: e.earned_on,
          course: e.course_sessions?.courses?.name ?? '',
          branch: e.course_sessions?.courses?.branches?.name ?? '',
          danceType: e.course_sessions?.courses?.dance_types?.name ?? '',
          amount: Number(e.amount),
          calculatedAmount: e.calculated_amount === null ? null : Number(e.calculated_amount),
          isManual: e.is_manual,
          breakdown: (e.breakdown as unknown as EarningBreakdown | null) ?? null,
        })),
        adjustments: (adjustments ?? []).map((a) => ({
          id: a.id,
          date: a.applies_on,
          kind: a.kind as AdjustmentKind,
          amount: Number(a.amount),
          description: a.description,
          sourceDate: a.course_sessions?.session_date ?? null,
          sourceCourse: a.course_sessions?.courses?.name ?? null,
        })),
        payouts: (payouts ?? []).map((p) => ({
          id: p.id,
          date: p.paid_on,
          amount: Number(p.amount),
          method: p.method as PayoutMethod,
          note: p.note,
          branch: p.branches?.name ?? '',
        })),
      },
    }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Unexpected error in getInstructorStatement:', error)
    return { error: await actionError('fetchStatementFailed') }
  }
}

/** Instructors the user may open a statement for (managers: all; instructors: themselves). */
export async function getStatementInstructors() {
  const access = await getPayAccess()
  if (!access) return { error: await actionError('notAuthenticated') }
  if (!access.canManage && access.ownInstructorIds.length === 0) return { error: await actionError('noPayPermission') }

  const admin = createAdminClient()
  let query = admin
    .from('instructors')
    .select('id, first_name, last_name')
    .eq('organization_id', access.organizationId)
    .is('deleted_at', null)
    .order('first_name')
  if (!access.canManage) query = query.in('id', access.ownInstructorIds)
  const { data, error } = await query
  if (error) return { error: await actionError('fetchInstructorsFailed') }
  return { data: data ?? [] }
}

// ---------------------------------------------------------------------------------------------
// Course profitability
// ---------------------------------------------------------------------------------------------

/** Revenue vs instructor cost per course between two dates (owners and managers). */
export async function getCourseProfitability(input: { from?: string; to?: string; branchId?: string }) {
  const access = await getPayAccess()
  if (!access) return { error: await actionError('notAuthenticated') }
  if (!access.canManage) return { error: await actionError('noPayPermission') }

  const today = todayInTimeZone(access.timezone)
  const from = parseDate(input.from) ?? monthStart(today)
  const to = parseDate(input.to) ?? monthEnd(today)

  try {
    const admin = createAdminClient()
    let branchId: string | undefined
    if (input.branchId) {
      const { data: branch } = await admin
        .from('branches')
        .select('id')
        .eq('id', input.branchId)
        .eq('organization_id', access.organizationId)
        .maybeSingle()
      if (!branch) return { error: await actionError('invalidBranch') }
      branchId = branch.id
    }

    const [{ data, error }, { data: branches }] = await Promise.all([
      admin.rpc('course_profitability', {
        p_organization_id: access.organizationId,
        p_from: from,
        p_to: to,
        ...(branchId ? { p_branch_id: branchId } : {}),
      }),
      admin
        .from('branches')
        .select('id, name')
        .eq('organization_id', access.organizationId)
        .is('deleted_at', null)
        .order('name'),
    ])
    if (error) throw error

    const rows = (data ?? []).map((r) => {
      const revenue = Number(r.revenue)
      const cost = Number(r.instructor_cost)
      const sessions = Number(r.session_count)
      return {
        courseId: r.course_id,
        course: r.course_name,
        branch: r.branch_name,
        danceType: r.dance_type_name,
        sessions,
        present: Number(r.present_count),
        credits: Number(r.credit_count),
        avgAttendance: sessions ? Math.round((Number(r.present_count) / sessions) * 10) / 10 : 0,
        revenue: round2(revenue),
        cost: round2(cost),
        profit: round2(revenue - cost),
        margin: revenue > 0 ? Math.round(((revenue - cost) / revenue) * 1000) / 10 : null,
      }
    })
    rows.sort((a, b) => a.profit - b.profit)

    const totals = rows.reduce(
      (t, r) => ({ revenue: t.revenue + r.revenue, cost: t.cost + r.cost, sessions: t.sessions + r.sessions }),
      { revenue: 0, cost: 0, sessions: 0 }
    )

    return {
      data: {
        from,
        to,
        branchId: branchId ?? null,
        branches: branches ?? [],
        rows,
        totals: {
          revenue: round2(totals.revenue),
          cost: round2(totals.cost),
          profit: round2(totals.revenue - totals.cost),
          sessions: totals.sessions,
          margin: totals.revenue > 0 ? Math.round(((totals.revenue - totals.cost) / totals.revenue) * 1000) / 10 : null,
        },
      },
    }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Unexpected error in getCourseProfitability:', error)
    return { error: await actionError('fetchProfitabilityFailed') }
  }
}
