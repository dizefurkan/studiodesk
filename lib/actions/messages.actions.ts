'use server'

import { unstable_rethrow } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMemberAccess } from '@/lib/auth/memberAccess'
import { actionError } from '@/lib/i18n/actionError'
import { addDaysToDateString, todayInTimeZone } from '@/lib/i18n/dates'
import { daysUntilBirthday } from '@/lib/students/birthday'
import {
  MESSAGE_AUDIENCES,
  MESSAGE_CATEGORIES,
  MESSAGE_CHANNELS,
  normalizePhone,
  type MessageAudience,
} from '@/lib/messages/template'

const DEFAULT_TEMPLATES = [
  { key: 'paymentReminder', category: 'payment_reminder' },
  { key: 'packageExpiring', category: 'payment_reminder' },
  { key: 'event', category: 'event' },
  { key: 'announcement', category: 'announcement' },
  { key: 'birthday', category: 'birthday' },
  { key: 'classInvite', category: 'class_invite' },
] as const

async function messageAccess() {
  const access = await getMemberAccess()
  if (!access) return { error: await actionError('notAuthenticated') } as const
  if (!access.canMessage) return { error: await actionError('noMessagePermission') } as const
  return { access } as const
}

// ---------------------------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------------------------

/** The organization's templates. A studio with none gets the default set (in the user's language). */
export async function getMessageTemplates() {
  const res = await messageAccess()
  if ('error' in res) return { error: res.error }
  const { access } = res

  try {
    const admin = createAdminClient()
    const load = () =>
      admin
        .from('message_templates')
        .select('id, name, category, body, updated_at')
        .eq('organization_id', access.organizationId)
        .order('category')
        .order('name')

    // Defaults the studio has not been given yet (new ones reach existing studios once;
    // a default the studio deleted does not come back)
    const { data: org } = await admin
      .from('organizations')
      .select('seeded_message_templates')
      .eq('id', access.organizationId)
      .single()
    const seeded = new Set(org?.seeded_message_templates ?? [])
    const missing = DEFAULT_TEMPLATES.filter((d) => !seeded.has(d.key))
    if (missing.length > 0) {
      const t = await getTranslations('messages.defaults')
      const { error: seedError } = await admin.from('message_templates').insert(
        missing.map((d) => ({
          organization_id: access.organizationId,
          name: t(`${d.key}.name`),
          category: d.category,
          // Raw text: the {placeholders} are template fields, not translation variables
          body: t.raw(`${d.key}.body`) as string,
          created_by: access.userId,
        }))
      )
      if (seedError) throw seedError
      const { error: markError } = await admin
        .from('organizations')
        .update({ seeded_message_templates: [...seeded, ...missing.map((d) => d.key)] })
        .eq('id', access.organizationId)
      if (markError) throw markError
    }

    const { data, error } = await load()
    if (error) throw error

    return { data: data ?? [] }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Error in getMessageTemplates:', error)
    return { error: await actionError('fetchTemplatesFailed') }
  }
}

export async function saveMessageTemplate(input: { id?: string; name: string; category: string; body: string }) {
  const res = await messageAccess()
  if ('error' in res) return { error: res.error }
  const { access } = res

  const name = input.name.trim()
  const body = input.body.trim()
  if (!name || name.length > 120 || !body || body.length > 2000) return { error: await actionError('invalidInput') }
  if (!(MESSAGE_CATEGORIES as readonly string[]).includes(input.category)) return { error: await actionError('invalidInput') }

  try {
    const admin = createAdminClient()
    const { error } = input.id
      ? await admin
          .from('message_templates')
          .update({ name, category: input.category, body })
          .eq('id', input.id)
          .eq('organization_id', access.organizationId)
      : await admin
          .from('message_templates')
          .insert({ organization_id: access.organizationId, name, category: input.category, body, created_by: access.userId })
    if (error) {
      console.error('Error saving template:', error)
      return { error: await actionError('saveTemplateFailed') }
    }
    return { success: true }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Error in saveMessageTemplate:', error)
    return { error: await actionError('saveTemplateFailed') }
  }
}

export async function deleteMessageTemplate(id: string) {
  const res = await messageAccess()
  if ('error' in res) return { error: res.error }
  const { access } = res

  const admin = createAdminClient()
  const { error } = await admin
    .from('message_templates')
    .delete()
    .eq('id', id)
    .eq('organization_id', access.organizationId)
  if (error) return { error: await actionError('deleteTemplateFailed') }
  return { success: true }
}

// ---------------------------------------------------------------------------------------------
// Recipients
// ---------------------------------------------------------------------------------------------

/** Lists for the send screen: courses and the studio name used in templates. */
export async function getMessageSetup() {
  const res = await messageAccess()
  if ('error' in res) return { error: res.error }
  const { access } = res

  const admin = createAdminClient()
  const { data: courses } = await admin
    .from('courses')
    .select('id, name, branches!inner(organization_id)')
    .eq('branches.organization_id', access.organizationId)
    .is('deleted_at', null)
    .order('name')
  const { data: labels } = await admin
    .from('labels')
    .select('id, name')
    .eq('organization_id', access.organizationId)
    .order('name')
  return {
    data: {
      studioName: access.organizationName,
      labels: labels ?? [],
      today: todayInTimeZone(access.timezone),
      courses: (courses ?? []).map((c) => ({ id: c.id, name: c.name })),
    },
  }
}

/**
 * Active students for an audience, with what templates need (credits, package, expiry).
 * Students who opted out are returned flagged so the screen can say why they are skipped.
 */
export async function getMessageRecipients(input: { audience: string; courseId?: string; labelId?: string }) {
  const res = await messageAccess()
  if ('error' in res) return { error: res.error }
  const { access } = res

  const audience: MessageAudience = (MESSAGE_AUDIENCES as readonly string[]).includes(input.audience)
    ? (input.audience as MessageAudience)
    : 'all'

  try {
    const admin = createAdminClient()
    const today = todayInTimeZone(access.timezone)

    // Students to include (null = everyone) and to leave out
    let include: Set<string> | null = null
    let exclude: Set<string> | null = null
    if (audience === 'course' || audience === 'course_invite') {
      if (!input.courseId) return { data: [] }
      const { data: course } = await admin
        .from('courses')
        .select('id, branches!inner(organization_id), course_students(student_id), course_labels(label_id)')
        .eq('id', input.courseId)
        .eq('branches.organization_id', access.organizationId)
        .maybeSingle()
      if (!course) return { data: [] }
      const enrolled = new Set((course.course_students ?? []).map((e) => e.student_id))
      if (audience === 'course') {
        include = enrolled
      } else {
        // Same level, not in the class yet
        const labelIds = (course.course_labels ?? []).map((l) => l.label_id)
        if (labelIds.length === 0) return { data: [] }
        const { data: labelled } = await admin.from('student_labels').select('student_id').in('label_id', labelIds)
        include = new Set((labelled ?? []).map((l) => l.student_id))
        exclude = enrolled
      }
    } else if (audience === 'label') {
      if (!input.labelId) return { data: [] }
      const { data: labelled } = await admin
        .from('student_labels')
        .select('student_id, labels!inner(organization_id)')
        .eq('label_id', input.labelId)
        .eq('labels.organization_id', access.organizationId)
      include = new Set((labelled ?? []).map((l) => l.student_id))
    }

    const { data: students, error } = await admin
      .from('students')
      .select(
        'id, first_name, last_name, phone, messages_opt_out, birth_date, student_packages(remaining_credits, expire_date, purchase_date, packages(name))'
      )
      .eq('organization_id', access.organizationId)
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('first_name')
    if (error) throw error

    const soon = addDaysToDateString(today, 7)
    const rows = (students ?? [])
      .filter((s) => (!include || include.has(s.id)) && !exclude?.has(s.id))
      .filter((s) => audience !== 'birthday' || (!!s.birth_date && daysUntilBirthday(s.birth_date, today) === 0))
      .map((s) => {
        const usable = (s.student_packages ?? []).filter(
          (p) => !p.expire_date || p.expire_date.slice(0, 10) >= today
        )
        const credits = usable.reduce((sum, p) => sum + p.remaining_credits, 0)
        // The package the message is about: the next one to expire with credits, else the latest bought
        const withCredits = usable
          .filter((p) => p.remaining_credits > 0)
          .sort((a, b) => (a.expire_date ?? '9999').localeCompare(b.expire_date ?? '9999'))
        const latest = [...(s.student_packages ?? [])].sort((a, b) => b.purchase_date.localeCompare(a.purchase_date))[0]
        const pkg = withCredits[0] ?? latest
        const expires = withCredits[0]?.expire_date?.slice(0, 10) ?? null
        return {
          id: s.id,
          firstName: s.first_name,
          lastName: s.last_name,
          phone: normalizePhone(s.phone),
          rawPhone: s.phone,
          optOut: s.messages_opt_out,
          credits,
          packageName: pkg?.packages?.name ?? null,
          expires,
          expiringSoon: !!expires && expires <= soon,
        }
      })
      .filter((r) =>
        audience === 'low_credits' ? r.credits <= 1 : audience === 'expiring' ? r.expiringSoon : true
      )

    return { data: rows }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Error in getMessageRecipients:', error)
    return { error: await actionError('fetchStudentsFailed') }
  }
}

// ---------------------------------------------------------------------------------------------
// Log
// ---------------------------------------------------------------------------------------------

/** Records a message opened on the user's phone (WhatsApp / SMS link). */
export async function logMessage(input: {
  studentId: string
  templateId?: string | null
  channel: string
  body: string
}) {
  const res = await messageAccess()
  if ('error' in res) return { error: res.error }
  const { access } = res
  if (!(MESSAGE_CHANNELS as readonly string[]).includes(input.channel)) return { error: await actionError('invalidInput') }
  const body = input.body.trim().slice(0, 4000)
  if (!body) return { error: await actionError('invalidInput') }

  try {
    const admin = createAdminClient()
    const { data: student } = await admin
      .from('students')
      .select('id, phone')
      .eq('id', input.studentId)
      .eq('organization_id', access.organizationId)
      .maybeSingle()
    const recipient = normalizePhone(student?.phone)
    if (!student || !recipient) return { error: await actionError('studentNotInOrg') }

    let templateId: string | null = null
    if (input.templateId) {
      const { data: template } = await admin
        .from('message_templates')
        .select('id')
        .eq('id', input.templateId)
        .eq('organization_id', access.organizationId)
        .maybeSingle()
      templateId = template?.id ?? null
    }

    const { error } = await admin.from('message_logs').insert({
      organization_id: access.organizationId,
      student_id: student.id,
      template_id: templateId,
      channel: input.channel,
      recipient,
      body,
      status: 'manual',
      sent_by: access.userId,
    })
    if (error) {
      console.error('Error logging message:', error)
      return { error: await actionError('logMessageFailed') }
    }
    return { success: true }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Error in logMessage:', error)
    return { error: await actionError('logMessageFailed') }
  }
}

export async function getMessageLogs(page = 1, pageSize = 20, studentId?: string) {
  const res = await messageAccess()
  if ('error' in res) return { error: res.error, data: [], totalCount: 0 }
  const { access } = res

  const admin = createAdminClient()
  const from = (Math.max(1, page) - 1) * pageSize
  let query = admin
    .from('message_logs')
    .select('id, channel, recipient, body, status, created_at, student_id, students(first_name, last_name), message_templates(name)', {
      count: 'exact',
    })
    .eq('organization_id', access.organizationId)
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)
  if (studentId) query = query.eq('student_id', studentId)
  const { data, error, count } = await query
  if (error) return { error: await actionError('fetchMessagesFailed'), data: [], totalCount: 0 }
  return { data: data ?? [], totalCount: count ?? 0 }
}
