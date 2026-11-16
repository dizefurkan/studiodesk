'use server'

import { unstable_rethrow } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMemberAccess } from '@/lib/auth/memberAccess'
import { actionError } from '@/lib/i18n/actionError'
import { logOperation } from '@/lib/actions/history.actions'
import { todayInTimeZone } from '@/lib/i18n/dates'

/**
 * Labels group students and courses, e.g. by level (Beginner / Intermediate / Advanced).
 * A course's labels find students of the same level to invite when the class has free places.
 */

const MAX_LABEL_LENGTH = 40

async function labelAccess() {
  const access = await getMemberAccess()
  if (!access) return { error: await actionError('notAuthenticated') } as const
  return { access } as const
}

function cleanName(name: string) {
  return name.replace(/\s+/g, ' ').trim()
}

/** All labels of the organization with how many active students and courses carry them. */
export async function getLabels() {
  const res = await labelAccess()
  if ('error' in res) return { error: res.error, data: [] }
  const { access } = res

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('labels')
    .select('id, name, student_labels(students(is_active, deleted_at)), course_labels(courses(deleted_at))')
    .eq('organization_id', access.organizationId)
    .order('name')
  if (error) {
    console.error('Error fetching labels:', error)
    return { error: await actionError('fetchLabelsFailed'), data: [] }
  }
  return {
    data: (data ?? []).map((l) => ({
      id: l.id,
      name: l.name,
      studentCount: (l.student_labels ?? []).filter((sl) => sl.students?.is_active && !sl.students.deleted_at).length,
      courseCount: (l.course_labels ?? []).filter((cl) => cl.courses && !cl.courses.deleted_at).length,
    })),
  }
}

export async function createLabel(rawName: string) {
  const res = await labelAccess()
  if ('error' in res) return { error: res.error }
  const { access } = res
  const name = cleanName(rawName)
  if (!name || name.length > MAX_LABEL_LENGTH) return { error: await actionError('invalidLabelName') }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('labels')
    .insert({ organization_id: access.organizationId, name, created_by: access.userId })
    .select('id, name')
    .single()
  if (error) {
    if (error.code === '23505') return { error: await actionError('labelExists'), duplicate: true }
    console.error('Error creating label:', error)
    return { error: await actionError('saveLabelFailed') }
  }
  return { data }
}

export async function renameLabel(id: string, rawName: string) {
  const res = await labelAccess()
  if ('error' in res) return { error: res.error }
  const { access } = res
  const name = cleanName(rawName)
  if (!name || name.length > MAX_LABEL_LENGTH) return { error: await actionError('invalidLabelName') }

  const admin = createAdminClient()
  const { error } = await admin
    .from('labels')
    .update({ name })
    .eq('id', id)
    .eq('organization_id', access.organizationId)
  if (error) {
    if (error.code === '23505') return { error: await actionError('labelExists') }
    console.error('Error renaming label:', error)
    return { error: await actionError('saveLabelFailed') }
  }
  return { success: true }
}

export async function deleteLabel(id: string) {
  const res = await labelAccess()
  if ('error' in res) return { error: res.error }
  const { access } = res

  const admin = createAdminClient()
  const { error } = await admin.from('labels').delete().eq('id', id).eq('organization_id', access.organizationId)
  if (error) {
    console.error('Error deleting label:', error)
    return { error: await actionError('deleteLabelFailed') }
  }
  return { success: true }
}

/** Keeps only label ids that belong to the organization. */
async function ownLabels(organizationId: string, labelIds: string[]) {
  const unique = [...new Set(labelIds)]
  if (unique.length === 0) return []
  const admin = createAdminClient()
  const { data } = await admin
    .from('labels')
    .select('id, name')
    .eq('organization_id', organizationId)
    .in('id', unique)
  return data ?? []
}

const names = (labels: { name: string }[]) =>
  labels
    .map((l) => l.name)
    .sort((a, b) => a.localeCompare(b))
    .join(', ') || null

/** Replaces a student's labels and records the change in the student's history. */
export async function setStudentLabels(studentId: string, labelIds: string[]) {
  const res = await labelAccess()
  if ('error' in res) return { error: res.error }
  const { access } = res

  try {
    const admin = createAdminClient()
    const { data: student } = await admin
      .from('students')
      .select('id, student_labels(label_id, labels(name))')
      .eq('id', studentId)
      .eq('organization_id', access.organizationId)
      .maybeSingle()
    if (!student) return { error: await actionError('studentNotInOrg') }

    const labels = await ownLabels(access.organizationId, labelIds)
    const before = (student.student_labels ?? []).map((sl) => ({ id: sl.label_id, name: sl.labels?.name ?? '' }))
    const wanted = new Set(labels.map((l) => l.id))
    const had = new Set(before.map((l) => l.id))
    const toRemove = [...had].filter((id) => !wanted.has(id))
    const toAdd = [...wanted].filter((id) => !had.has(id))

    if (toRemove.length > 0) {
      const { error } = await admin.from('student_labels').delete().eq('student_id', studentId).in('label_id', toRemove)
      if (error) throw error
    }
    if (toAdd.length > 0) {
      const { error } = await admin
        .from('student_labels')
        .insert(toAdd.map((label_id) => ({ student_id: studentId, label_id })))
      if (error) throw error
    }

    if (toAdd.length > 0 || toRemove.length > 0) {
      const beforeNames = names(before)
      const afterNames = names(labels)
      void logOperation(
        'UPDATE',
        'student',
        studentId,
        {
          before: { labels: beforeNames },
          after: { labels: afterNames },
          changes: { labels: { before: beforeNames, after: afterNames } },
        },
        access.organizationId
      )
    }
    return { success: true }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Error in setStudentLabels:', error)
    return { error: await actionError('saveLabelFailed') }
  }
}

/** Replaces a course's labels and records the change in the course's history. */
export async function setCourseLabels(courseId: string, labelIds: string[]) {
  const res = await labelAccess()
  if ('error' in res) return { error: res.error }
  const { access } = res

  try {
    const admin = createAdminClient()
    const { data: course } = await admin
      .from('courses')
      .select('id, branches!inner(organization_id), course_labels(label_id, labels(name))')
      .eq('id', courseId)
      .eq('branches.organization_id', access.organizationId)
      .maybeSingle()
    if (!course) return { error: await actionError('courseNotFound') }

    const labels = await ownLabels(access.organizationId, labelIds)
    const before = (course.course_labels ?? []).map((cl) => ({ id: cl.label_id, name: cl.labels?.name ?? '' }))
    const wanted = new Set(labels.map((l) => l.id))
    const had = new Set(before.map((l) => l.id))
    const toRemove = [...had].filter((id) => !wanted.has(id))
    const toAdd = [...wanted].filter((id) => !had.has(id))

    if (toRemove.length > 0) {
      const { error } = await admin.from('course_labels').delete().eq('course_id', courseId).in('label_id', toRemove)
      if (error) throw error
    }
    if (toAdd.length > 0) {
      const { error } = await admin
        .from('course_labels')
        .insert(toAdd.map((label_id) => ({ course_id: courseId, label_id })))
      if (error) throw error
    }

    if (toAdd.length > 0 || toRemove.length > 0) {
      const beforeNames = names(before)
      const afterNames = names(labels)
      void logOperation(
        'UPDATE',
        'course',
        courseId,
        {
          before: { labels: beforeNames },
          after: { labels: afterNames },
          changes: { labels: { before: beforeNames, after: afterNames } },
        },
        access.organizationId
      )
    }
    return { success: true }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Error in setCourseLabels:', error)
    return { error: await actionError('saveLabelFailed') }
  }
}

export async function getStudentLabelIds(studentId: string) {
  const res = await labelAccess()
  if ('error' in res) return { error: res.error, data: [] as string[] }
  const admin = createAdminClient()
  const { data } = await admin
    .from('student_labels')
    .select('label_id, labels!inner(organization_id)')
    .eq('student_id', studentId)
    .eq('labels.organization_id', res.access.organizationId)
  return { data: (data ?? []).map((r) => r.label_id) }
}

export async function getCourseLabelIds(courseId: string) {
  const res = await labelAccess()
  if ('error' in res) return { error: res.error, data: [] as string[] }
  const admin = createAdminClient()
  const { data } = await admin
    .from('course_labels')
    .select('label_id, labels!inner(organization_id)')
    .eq('course_id', courseId)
    .eq('labels.organization_id', res.access.organizationId)
  return { data: (data ?? []).map((r) => r.label_id) }
}

/**
 * Active students who share a label with the course but are not enrolled in it:
 * the people to invite when the class has free places. Students with more matching
 * labels come first, then the ones with credits left.
 */
export async function getCourseCandidates(courseId: string) {
  const res = await labelAccess()
  if ('error' in res) return { error: res.error }
  const { access } = res

  try {
    const admin = createAdminClient()
    const { data: course } = await admin
      .from('courses')
      .select('id, branches!inner(organization_id), course_labels(label_id), course_students(student_id)')
      .eq('id', courseId)
      .eq('branches.organization_id', access.organizationId)
      .maybeSingle()
    if (!course) return { error: await actionError('courseNotFound') }

    const labelIds = (course.course_labels ?? []).map((cl) => cl.label_id)
    if (labelIds.length === 0) return { data: { hasLabels: false, students: [] } }
    const enrolled = new Set((course.course_students ?? []).map((cs) => cs.student_id))

    const { data: rows, error } = await admin
      .from('student_labels')
      .select(
        'label_id, labels!inner(name, organization_id), students!inner(id, first_name, last_name, phone, is_active, deleted_at, messages_opt_out, organization_id, student_packages(remaining_credits, expire_date))'
      )
      .in('label_id', labelIds)
      .eq('labels.organization_id', access.organizationId)
      .eq('students.organization_id', access.organizationId)
      .eq('students.is_active', true)
      .is('students.deleted_at', null)
    if (error) throw error

    const today = todayInTimeZone(access.timezone)
    const byStudent = new Map<
      string,
      { id: string; firstName: string; lastName: string; phone: string | null; optOut: boolean; credits: number; labels: string[] }
    >()
    for (const row of rows ?? []) {
      const s = row.students
      if (!s || enrolled.has(s.id)) continue
      const entry =
        byStudent.get(s.id) ??
        {
          id: s.id,
          firstName: s.first_name,
          lastName: s.last_name,
          phone: s.phone,
          optOut: s.messages_opt_out,
          credits: (s.student_packages ?? [])
            .filter((p) => !p.expire_date || p.expire_date.slice(0, 10) >= today)
            .reduce((sum, p) => sum + p.remaining_credits, 0),
          labels: [],
        }
      entry.labels.push(row.labels.name)
      byStudent.set(s.id, entry)
    }

    const students = [...byStudent.values()].sort(
      (a, b) =>
        b.labels.length - a.labels.length ||
        Number(b.credits > 0) - Number(a.credits > 0) ||
        a.firstName.localeCompare(b.firstName)
    )
    return { data: { hasLabels: true, students } }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Error in getCourseCandidates:', error)
    return { error: await actionError('fetchStudentsFailed') }
  }
}
