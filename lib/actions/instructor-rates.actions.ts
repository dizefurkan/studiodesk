'use server'

import { unstable_rethrow } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getPayAccess } from '@/lib/auth/payAccess'
import { logOperation } from '@/lib/actions/history.actions'
import { actionError, type ActionErrorKey } from '@/lib/i18n/actionError'
import { todayInTimeZone } from '@/lib/i18n/dates'
import { parseDate } from '@/lib/earnings/periods'
import { PAY_MODELS, recalculateEarningsForRate } from '@/lib/earnings/sessionEarnings'

type Admin = ReturnType<typeof createAdminClient>

/** Start date of a rate's first period when none is given: it has always applied. */
const ALWAYS = '2000-01-01'

const RATE_SELECT = `
  id,
  pay_model,
  ratio_per_class,
  amount,
  min_amount,
  instructors!inner(id, first_name, last_name, organization_id),
  branches(id, name),
  dance_types(id, name),
  instructor_rate_versions(id, effective_from, pay_model, ratio, amount, min_amount)
` as const

export type RateTermsInput = {
  payModel: string
  /** percentage model, 0–100 */
  ratio?: number | null
  /** fixed models: per lesson / per hour / per student */
  amount?: number | null
  /** minimum per lesson that took place (optional) */
  minAmount?: number | null
  /** yyyy-MM-dd; empty = always */
  effectiveFrom?: string | null
}

type Terms = { pay_model: string; ratio: number; amount: number | null; min_amount: number | null; effective_from: string }

const round2 = (n: number) => Math.round(n * 100) / 100

function validateTerms(input: RateTermsInput): Terms | ActionErrorKey {
  if (!(PAY_MODELS as readonly string[]).includes(input.payModel)) return 'invalidPayModel'
  const effective_from = input.effectiveFrom ? parseDate(input.effectiveFrom) : ALWAYS
  if (!effective_from) return 'invalidDate'
  const min = input.minAmount ?? null
  if (min !== null && (!Number.isFinite(min) || min < 0)) return 'invalidAmount'

  if (input.payModel === 'percentage') {
    const ratio = Number(input.ratio)
    if (!Number.isFinite(ratio) || ratio <= 0 || ratio > 100) return 'ratioRange'
    return { pay_model: 'percentage', ratio: round2(ratio), amount: null, min_amount: min ? round2(min) : null, effective_from }
  }
  const amount = Number(input.amount)
  if (!Number.isFinite(amount) || amount <= 0) return 'invalidAmount'
  return { pay_model: input.payModel, ratio: 0, amount: round2(amount), min_amount: min ? round2(min) : null, effective_from }
}

/** Copies the version in force today (or the first one, if all start later) onto the rate row. */
async function syncRateMirror(admin: Admin, rateId: string, today: string) {
  const { data: versions } = await admin
    .from('instructor_rate_versions')
    .select('effective_from, pay_model, ratio, amount, min_amount')
    .eq('rate_id', rateId)
    .order('effective_from', { ascending: false })
  if (!versions?.length) return
  const current = versions.find((v) => v.effective_from <= today) ?? versions[versions.length - 1]
  await admin
    .from('instructor_rates')
    .update({
      pay_model: current.pay_model,
      ratio_per_class: current.ratio,
      amount: current.amount,
      min_amount: current.min_amount,
    })
    .eq('id', rateId)
}

/** A rate of the user's organization, or null. */
async function findRate(admin: Admin, rateId: string, organizationId: string) {
  const { data } = await admin
    .from('instructor_rates')
    .select('id, instructor_id, branch_id, dance_type_id, instructors!inner(organization_id, first_name, last_name)')
    .eq('id', rateId)
    .eq('instructors.organization_id', organizationId)
    .maybeSingle()
  return data
}

export async function getInstructorRates(instructorId?: string) {
  const access = await getPayAccess()
  if (!access) return { error: await actionError('notAuthenticated') }
  if (!access.canManage) return { error: await actionError('noPayPermission') }

  try {
    const admin = createAdminClient()
    let query = admin
      .from('instructor_rates')
      .select(RATE_SELECT)
      // Service-role client: scope to the caller's organization explicitly
      .eq('instructors.organization_id', access.organizationId)
    if (instructorId) query = query.eq('instructor_id', instructorId)

    const { data, error } = await query
    if (error) {
      console.error('Error fetching instructor rates:', error)
      return { error: await actionError('fetchRatesFailed') }
    }
    return {
      data: (data ?? []).map((r) => ({
        ...r,
        instructor_rate_versions: [...(r.instructor_rate_versions ?? [])].sort((a, b) =>
          a.effective_from < b.effective_from ? 1 : -1
        ),
      })),
    }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Unexpected error in getInstructorRates:', error)
    return { error: await actionError('unexpected') }
  }
}

export async function getInstructorRate(rateId: string) {
  const access = await getPayAccess()
  if (!access) return { error: await actionError('notAuthenticated') }
  if (!access.canManage) return { error: await actionError('noPayPermission') }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('instructor_rates')
    .select(RATE_SELECT)
    .eq('id', rateId)
    .eq('instructors.organization_id', access.organizationId)
    .maybeSingle()
  if (error || !data) return { error: await actionError('rateNotFound') }
  return {
    data: {
      ...data,
      instructor_rate_versions: [...(data.instructor_rate_versions ?? [])].sort((a, b) =>
        a.effective_from < b.effective_from ? 1 : -1
      ),
    },
  }
}

/** A new rate for an instructor at a branch for a dance type, with its first pay period. */
export async function createInstructorRate(input: {
  instructorId: string
  branchId: string
  danceTypeId: string
  terms: RateTermsInput
}) {
  const access = await getPayAccess()
  if (!access) return { error: await actionError('notAuthenticated') }
  if (!access.canManage) return { error: await actionError('noPayPermission') }

  const terms = validateTerms(input.terms)
  if (typeof terms === 'string') return { error: await actionError(terms) }

  try {
    const admin = createAdminClient()
    const [{ data: instructor }, { data: branch }, { data: danceType }] = await Promise.all([
      admin
        .from('instructors')
        .select('id')
        .eq('id', input.instructorId)
        .eq('organization_id', access.organizationId)
        .maybeSingle(),
      admin
        .from('branches')
        .select('id')
        .eq('id', input.branchId)
        .eq('organization_id', access.organizationId)
        .maybeSingle(),
      admin
        .from('dance_types')
        .select('id')
        .eq('id', input.danceTypeId)
        .eq('organization_id', access.organizationId)
        .maybeSingle(),
    ])
    if (!instructor) return { error: await actionError('instructorAccessDenied') }
    if (!branch) return { error: await actionError('branchAccessDenied') }
    if (!danceType) return { error: await actionError('danceTypeNotFound') }

    const { data: existing } = await admin
      .from('instructor_rates')
      .select('id')
      .eq('instructor_id', instructor.id)
      .eq('branch_id', branch.id)
      .eq('dance_type_id', danceType.id)
      .maybeSingle()
    if (existing) return { error: await actionError('rateExists') }

    const { data: rate, error } = await admin
      .from('instructor_rates')
      .insert({
        instructor_id: instructor.id,
        branch_id: branch.id,
        dance_type_id: danceType.id,
        pay_model: terms.pay_model,
        ratio_per_class: terms.ratio,
        amount: terms.amount,
        min_amount: terms.min_amount,
      })
      .select('id')
      .single()
    if (error || !rate) {
      console.error('Error creating instructor rate:', error)
      return { error: await actionError('createRateFailed') }
    }

    const user = await getCurrentUser()
    const { error: versionError } = await admin
      .from('instructor_rate_versions')
      .insert({ rate_id: rate.id, ...terms, created_by: user?.id ?? null })
    if (versionError) {
      console.error('Error creating rate version:', versionError)
      await admin.from('instructor_rates').delete().eq('id', rate.id)
      return { error: await actionError('createRateFailed') }
    }

    await syncRateMirror(admin, rate.id, todayInTimeZone(access.timezone))
    const recalc = await recalculateEarningsForRate(rate.id, terms.effective_from)
    if (recalc.error) console.error('Error recalculating earnings after rate change:', recalc.error)

    void logOperation(
      'CREATE',
      'instructor_rate',
      rate.id,
      {
        after: {
          instructorId: instructor.id,
          branchId: branch.id,
          danceTypeId: danceType.id,
          payModel: terms.pay_model,
          ratioPerClass: terms.ratio,
          amount: terms.amount,
          minAmount: terms.min_amount,
          effectiveFrom: terms.effective_from,
        },
      },
      access.organizationId
    )
    return { data: { id: rate.id } }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Unexpected error in createInstructorRate:', error)
    return { error: await actionError('unexpected') }
  }
}

/**
 * New terms for a rate from a date on. Lessons before that date keep the old terms; lessons
 * from that date up to today are recalculated (except in closed months). A period that starts
 * on the same date is replaced.
 */
export async function saveRateVersion(rateId: string, input: RateTermsInput) {
  const access = await getPayAccess()
  if (!access) return { error: await actionError('notAuthenticated') }
  if (!access.canManage) return { error: await actionError('noPayPermission') }

  const terms = validateTerms(input)
  if (typeof terms === 'string') return { error: await actionError(terms) }

  try {
    const admin = createAdminClient()
    const rate = await findRate(admin, rateId, access.organizationId)
    if (!rate) return { error: await actionError('rateNotFound') }

    const { data: same } = await admin
      .from('instructor_rate_versions')
      .select('id, pay_model, ratio, amount, min_amount')
      .eq('rate_id', rate.id)
      .eq('effective_from', terms.effective_from)
      .maybeSingle()

    const user = await getCurrentUser()
    const { error } = same
      ? await admin
          .from('instructor_rate_versions')
          .update({ pay_model: terms.pay_model, ratio: terms.ratio, amount: terms.amount, min_amount: terms.min_amount })
          .eq('id', same.id)
      : await admin.from('instructor_rate_versions').insert({ rate_id: rate.id, ...terms, created_by: user?.id ?? null })
    if (error) {
      console.error('Error saving rate version:', error)
      return { error: await actionError('updateRateFailed') }
    }

    await syncRateMirror(admin, rate.id, todayInTimeZone(access.timezone))
    const recalc = await recalculateEarningsForRate(rate.id, terms.effective_from)
    if (recalc.error) console.error('Error recalculating earnings after rate change:', recalc.error)

    void logOperation(
      'UPDATE',
      'instructor_rate',
      rate.id,
      {
        before: same
          ? { payModel: same.pay_model, ratioPerClass: same.ratio, amount: same.amount, minAmount: same.min_amount }
          : undefined,
        after: {
          payModel: terms.pay_model,
          ratioPerClass: terms.ratio,
          amount: terms.amount,
          minAmount: terms.min_amount,
          effectiveFrom: terms.effective_from,
        },
      },
      access.organizationId
    )
    return { success: true }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Unexpected error in saveRateVersion:', error)
    return { error: await actionError('unexpected') }
  }
}

/** Removes one dated period of a rate; the period before it applies again from that date. */
export async function deleteRateVersion(versionId: string) {
  const access = await getPayAccess()
  if (!access) return { error: await actionError('notAuthenticated') }
  if (!access.canManage) return { error: await actionError('noPayPermission') }

  try {
    const admin = createAdminClient()
    const { data: version } = await admin
      .from('instructor_rate_versions')
      .select('id, rate_id, effective_from, pay_model, ratio, amount')
      .eq('id', versionId)
      .maybeSingle()
    if (!version) return { error: await actionError('rateVersionNotFound') }
    const rate = await findRate(admin, version.rate_id, access.organizationId)
    if (!rate) return { error: await actionError('rateVersionNotFound') }

    const { count } = await admin
      .from('instructor_rate_versions')
      .select('id', { count: 'exact', head: true })
      .eq('rate_id', rate.id)
    if ((count ?? 0) <= 1) return { error: await actionError('cannotDeleteLastVersion') }

    const { error } = await admin.from('instructor_rate_versions').delete().eq('id', version.id)
    if (error) return { error: await actionError('deleteRateFailed') }

    await syncRateMirror(admin, rate.id, todayInTimeZone(access.timezone))
    const recalc = await recalculateEarningsForRate(rate.id, version.effective_from)
    if (recalc.error) console.error('Error recalculating earnings after rate change:', recalc.error)

    void logOperation(
      'UPDATE',
      'instructor_rate',
      rate.id,
      {
        before: {
          payModel: version.pay_model,
          ratioPerClass: version.ratio,
          amount: version.amount,
          effectiveFrom: version.effective_from,
        },
      },
      access.organizationId
    )
    return { success: true }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Unexpected error in deleteRateVersion:', error)
    return { error: await actionError('unexpected') }
  }
}

/** Deletes a rate with all its periods. Earnings already calculated stay as they are. */
export async function deleteInstructorRate(rateId: string) {
  const access = await getPayAccess()
  if (!access) return { error: await actionError('notAuthenticated') }
  if (!access.canManage) return { error: await actionError('noPayPermission') }

  try {
    const admin = createAdminClient()
    const rate = await findRate(admin, rateId, access.organizationId)
    if (!rate) return { error: await actionError('rateNotFound') }

    const { error } = await admin.from('instructor_rates').delete().eq('id', rate.id)
    if (error) {
      console.error('Error deleting instructor rate:', error)
      return { error: await actionError('deleteRateFailed') }
    }

    void logOperation(
      'DELETE',
      'instructor_rate',
      rate.id,
      { before: { instructorId: rate.instructor_id, branchId: rate.branch_id, danceTypeId: rate.dance_type_id } },
      access.organizationId
    )
    return { success: true }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Unexpected error in deleteInstructorRate:', error)
    return { error: await actionError('unexpected') }
  }
}

export async function getInstructorsAndBranchesAndDanceTypes() {
  const access = await getPayAccess()
  if (!access) return { error: await actionError('notAuthenticated') }
  if (!access.canManage) return { error: await actionError('noPayPermission') }

  try {
    const admin = createAdminClient()
    const [instructorsResult, branchesResult, danceTypesResult] = await Promise.all([
      admin
        .from('instructors')
        .select('id, first_name, last_name')
        .eq('organization_id', access.organizationId)
        .is('deleted_at', null)
        .order('first_name'),
      admin.from('branches').select('id, name').eq('organization_id', access.organizationId).is('deleted_at', null),
      admin.from('dance_types').select('id, name').eq('organization_id', access.organizationId).is('deleted_at', null),
    ])

    if (instructorsResult.error || branchesResult.error || danceTypesResult.error) {
      console.error('Error fetching data:', instructorsResult.error ?? branchesResult.error ?? danceTypesResult.error)
      return { error: await actionError('fetchDataFailed') }
    }

    return {
      data: {
        instructors: instructorsResult.data || [],
        branches: branchesResult.data || [],
        danceTypes: danceTypesResult.data || [],
        currency: access.currency,
      },
    }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Unexpected error in getInstructorsAndBranchesAndDanceTypes:', error)
    return { error: await actionError('unexpected') }
  }
}
