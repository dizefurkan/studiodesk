'use server'

import { unstable_rethrow } from 'next/navigation'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { logOperation } from '@/lib/actions/history.actions'
import { actionError } from '@/lib/i18n/actionError'

/**
 * Get all students enrolled in a course
 */
export async function getCourseStudents(courseId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }

  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await (supabase
      .from('course_students'))
      .select(`
        id, 
        student_id, 
        joined_at, 
        students(
          id,
          first_name, 
          last_name, 
          phone,
          is_active,
          student_packages(
            id,
            remaining_credits,
            expire_date,
            purchase_date,
            packages(
              id,
              name,
              dance_type_id,
              price,
              total_credits
            )
          )
        ),
        courses(
          dance_type_id
        )
      `)
      .eq('course_id', courseId)
      .order('joined_at', { ascending: false })

    if (error) {
      console.error('Error fetching course students:', error)
      return { error: await actionError('fetchCourseStudentsFailed') }
    }

    return { data }
  } catch (error) {
    console.error('Unexpected error in getCourseStudents:', error)
    return { error: await actionError('unexpected') }
  }
}

/**
 * Add a student to a course
 */
export async function addStudentToCourse(courseId: string, studentId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await (supabase
      .from('course_students'))
      .insert({
        course_id: courseId,
        student_id: studentId,
      })
      .select()
      .single()

    if (error) {
      // If it's a unique constraint error, return success (already enrolled)
      if (error?.code === '23505') {
        return { success: true, data: { message: 'Student already enrolled' } }
      }
      console.error('Error adding student to course:', error)
      return { error: await actionError('addStudentToCourseFailed') }
    }

    console.log('[addStudentToCourse] 🎯 Student added successfully, now logging...')

    // Get student name for history logging
    const { data: studentData } = await (supabase
      .from('students'))
      .select('first_name, last_name')
      .eq('id', studentId)
      .single()
    
    const studentName = studentData 
      ? `${studentData.first_name} ${studentData.last_name}`.trim()
      : 'Unknown Student'

    // Log the action to history using the standard pattern
    await logOperation('CREATE', 'course_student', courseId, {
      after: {
        studentId: studentId,
        studentName: studentName,
        courseId: courseId,
      },
    }, organization.id)

    console.log('[addStudentToCourse] ✅ History logged')
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error in addStudentToCourse:', error)
    return { error: await actionError('unexpected') }
  }
}

/**
 * Remove a student from a course
 */
export async function removeStudentFromCourse(courseId: string, studentId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }

  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  try {
    const supabase = await createServerSupabaseClient()

    const { data: removed, error } = await (supabase
      .from('course_students'))
      .delete()
      .eq('course_id', courseId)
      .eq('student_id', studentId)
      .select('joined_at')

    if (error) {
      console.error('Error removing student from course:', error)
      return { error: await actionError('removeStudentFromCourseFailed') }
    }

    // Keep them on the class's "Former students" list
    if (removed && removed.length > 0) {
      await recordDeparture({
        organizationId: organization.id,
        courseId,
        studentId,
        joinedAt: removed[0].joined_at,
        reason: 'removed',
        userId: user.id,
      })
    }

    console.log('[removeStudentFromCourse] 🎯 Student removed successfully, now logging...')

    // Get student name for history logging
    const { data: studentData } = await (supabase
      .from('students'))
      .select('first_name, last_name')
      .eq('id', studentId)
      .single()
    
    const studentName = studentData 
      ? `${studentData.first_name} ${studentData.last_name}`.trim()
      : 'Unknown Student'

    // Log the action to history using the standard pattern
    await logOperation('DELETE', 'course_student', courseId, {
      before: {
        studentId: studentId,
        studentName: studentName,
        courseId: courseId,
      },
    }, organization.id)

    console.log('[removeStudentFromCourse] ✅ History logged')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error in removeStudentFromCourse:', error)
    return { error: await actionError('unexpected') }
  }
}

/**
 * Get all courses a student is enrolled in with attendance stats
 */
export async function getStudentEnrolledCourses(studentId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }

  try {
    const supabase = await createServerSupabaseClient()

    // Get all courses this student is enrolled in
    const { data: courseEnrollments, error: enrollmentError } = await (supabase
      .from('course_students'))
      .select(
        `
        id,
        course_id,
        joined_at,
        courses(
          id, name, day_of_week, start_time, end_time, dance_type_id,
          branches(name),
          dance_types(name),
          course_instructors(instructor_id)
        )
      `,
      )
      .eq('student_id', studentId)
      .order('joined_at', { ascending: false })

    if (enrollmentError) {
      console.error('Error fetching course enrollments:', enrollmentError)
      return { error: await actionError('fetchEnrolledCoursesFailed') }
    }

    if (!courseEnrollments || courseEnrollments.length === 0) {
      return { data: { active: [], completed: [] } }
    }

    // Get student packages to check remaining credits
    const { data: studentPackages, error: packagesError } = await (supabase
      .from('student_packages'))
      .select('id, remaining_credits, packages(dance_type_id)')
      .eq('student_id', studentId)

    if (packagesError) {
      console.error('Error fetching student packages:', packagesError)
      return { error: await actionError('fetchStudentPackagesFailed') }
    }

    // For each course, get attendance counts
    const coursesWithStats = await Promise.all(
      courseEnrollments.map(async (enrollment) => {
        // Get attendance records for this student in this course
        const { data: attendances } = await (supabase
          .from('attendances'))
          .select('id, created_at, course_sessions(session_date)')
          .eq('student_id', studentId)
          .in(
            'session_id',
            (
              await supabase.from('course_sessions')
                .select('id')
                .eq('course_id', enrollment.courses.id)
            ).data?.map((s) => s.id) || [],
          )

        // Find matching package for this course's dance type
        const matchingPackage = studentPackages?.find(
          (pkg) => pkg.packages?.dance_type_id === enrollment.courses.dance_type_id
        )

        return {
          courseId: enrollment.courses.id,
          courseName: enrollment.courses.name,
          branchName: enrollment.courses.branches?.name,
          danceTypeName: enrollment.courses.dance_types?.name,
          dayOfWeek: enrollment.courses.day_of_week,
          startTime: enrollment.courses.start_time,
          endTime: enrollment.courses.end_time,
          enrolledAt: enrollment.joined_at,
          attendanceCount: attendances?.length || 0,
          attendanceDates: attendances?.map((a) => a.course_sessions?.session_date) || [],
          remainingCredits: matchingPackage?.remaining_credits || 0,
          packageDanceTypeId: matchingPackage?.packages?.dance_type_id,
        }
      }),
    )

    // Separate into active (remaining_credits > 0) and completed (remaining_credits = 0)
    const active = coursesWithStats.filter((c) => c.remainingCredits > 0)
    const completed = coursesWithStats.filter((c) => c.remainingCredits === 0)

    return { data: { active, completed } }
  } catch (error) {
    console.error('Unexpected error in getStudentEnrolledCourses:', error)
    return { error: await actionError('unexpected') }
  }
}

/**
 * Courses the student could join or move to, with what helps pick one:
 * schedule, branch, dance type, class size, whether it shares a label (e.g. level)
 * with the student, and whether the student has credits for its dance type.
 */
export async function getCourseOptionsForStudent(studentId: string) {
  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  try {
    const admin = createAdminClient()
    const { data: student } = await admin
      .from('students')
      .select('id, student_labels(label_id), course_students(course_id), student_packages(remaining_credits, expire_date, packages(dance_type_id))')
      .eq('id', studentId)
      .eq('organization_id', organization.id)
      .maybeSingle()
    if (!student) return { error: await actionError('studentNotInOrg') }

    const { data: courses, error } = await admin
      .from('courses')
      .select(
        'id, name, day_of_week, start_time, end_time, dance_type_id, branches!inner(name, organization_id), dance_types(name), course_labels(label_id, labels(name)), course_students(student_id, students(is_active, deleted_at))'
      )
      .eq('branches.organization_id', organization.id)
      .is('deleted_at', null)
      .order('day_of_week')
      .order('start_time')
    if (error) throw error

    const studentLabels = new Set((student.student_labels ?? []).map((l) => l.label_id))
    const enrolled = new Set((student.course_students ?? []).map((c) => c.course_id))
    const today = new Date().toISOString().slice(0, 10)
    const creditTypes = new Set(
      (student.student_packages ?? [])
        .filter((p) => p.remaining_credits > 0 && (!p.expire_date || p.expire_date.slice(0, 10) >= today))
        .map((p) => p.packages?.dance_type_id)
        .filter((id): id is string => !!id)
    )

    return {
      data: (courses ?? []).map((c) => {
        const labels = (c.course_labels ?? []).map((l) => ({ id: l.label_id, name: l.labels?.name ?? '' }))
        return {
          id: c.id,
          name: c.name,
          dayOfWeek: c.day_of_week,
          startTime: c.start_time,
          endTime: c.end_time,
          branchName: c.branches?.name ?? null,
          danceTypeName: c.dance_types?.name ?? null,
          studentCount: (c.course_students ?? []).filter((cs) => cs.students?.is_active && !cs.students.deleted_at).length,
          enrolled: enrolled.has(c.id),
          matchingLabels: labels.filter((l) => studentLabels.has(l.id)).map((l) => l.name),
          hasCredits: creditTypes.has(c.dance_type_id),
        }
      }),
    }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Error in getCourseOptionsForStudent:', error)
    return { error: await actionError('fetchCoursesFailed') }
  }
}

/**
 * Moves a student from one class to another in one step. Past attendance stays with
 * the old class's lessons; only the enrollment changes.
 */
export async function moveStudentToCourse(studentId: string, fromCourseId: string, toCourseId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: await actionError('notAuthenticated') }
  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }
  if (fromCourseId === toCourseId) return { error: await actionError('invalidInput') }

  try {
    const admin = createAdminClient()
    const [{ data: student }, { data: courses }] = await Promise.all([
      admin
        .from('students')
        .select('id, first_name, last_name')
        .eq('id', studentId)
        .eq('organization_id', organization.id)
        .maybeSingle(),
      admin
        .from('courses')
        .select('id, name, branches!inner(organization_id)')
        .in('id', [fromCourseId, toCourseId])
        .eq('branches.organization_id', organization.id)
        .is('deleted_at', null),
    ])
    if (!student) return { error: await actionError('studentNotInOrg') }
    const from = courses?.find((c) => c.id === fromCourseId)
    const to = courses?.find((c) => c.id === toCourseId)
    if (!from || !to) return { error: await actionError('courseNotFound') }

    const { error: addError } = await admin
      .from('course_students')
      .upsert({ course_id: toCourseId, student_id: studentId }, { onConflict: 'course_id,student_id', ignoreDuplicates: true })
    if (addError) throw addError
    const { data: removed, error: removeError } = await admin
      .from('course_students')
      .delete()
      .eq('course_id', fromCourseId)
      .eq('student_id', studentId)
      .select('joined_at')
    if (removeError) throw removeError
    await recordDeparture({
      organizationId: organization.id,
      courseId: fromCourseId,
      studentId,
      joinedAt: removed?.[0]?.joined_at ?? null,
      reason: 'moved',
      movedToCourseId: toCourseId,
      userId: user.id,
    })

    const studentName = `${student.first_name} ${student.last_name}`.trim()
    await Promise.all([
      logOperation('DELETE', 'course_student', fromCourseId, { before: { studentId, studentName, courseId: fromCourseId } }, organization.id),
      logOperation('CREATE', 'course_student', toCourseId, { after: { studentId, studentName, courseId: toCourseId } }, organization.id),
      logOperation(
        'UPDATE',
        'student',
        studentId,
        { before: { course: from.name }, after: { course: to.name }, changes: { course: { before: from.name, after: to.name } } },
        organization.id
      ),
    ])
    return { success: true }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Error in moveStudentToCourse:', error)
    return { error: await actionError('moveStudentFailed') }
  }
}

/** Remembers that a student left a class, for the class's "Former students" list. Never fails the caller. */
async function recordDeparture(input: {
  organizationId: string
  courseId: string
  studentId: string
  joinedAt: string | null
  reason: 'removed' | 'moved'
  movedToCourseId?: string
  userId: string
}) {
  try {
    const admin = createAdminClient()
    // Only for a course of this organization
    const { data: course } = await admin
      .from('courses')
      .select('id, branches!inner(organization_id)')
      .eq('id', input.courseId)
      .eq('branches.organization_id', input.organizationId)
      .maybeSingle()
    if (!course) return
    const { error } = await admin.from('course_student_departures').insert({
      course_id: input.courseId,
      student_id: input.studentId,
      joined_at: input.joinedAt,
      reason: input.reason,
      moved_to_course_id: input.movedToCourseId ?? null,
      left_by: input.userId,
    })
    if (error) console.error('Error recording departure:', error)
  } catch (error) {
    unstable_rethrow(error)
    console.error('Error in recordDeparture:', error)
  }
}

/**
 * Students who left the class and aren't back in it: latest departure per student,
 * with where they moved to and their current credits for this class type.
 */
export async function getFormerCourseStudents(courseId: string) {
  const organization = await getOrganization()
  if (!organization) return { error: await actionError('noOrganization') }

  try {
    const admin = createAdminClient()
    const { data: course } = await admin
      .from('courses')
      .select('id, dance_type_id, branches!inner(organization_id), course_students(student_id)')
      .eq('id', courseId)
      .eq('branches.organization_id', organization.id)
      .maybeSingle()
    if (!course) return { error: await actionError('courseNotFound') }
    const current = new Set((course.course_students ?? []).map((c) => c.student_id))

    const { data, error } = await admin
      .from('course_student_departures')
      .select(
        'id, student_id, joined_at, left_at, reason, moved_to:courses!course_student_departures_moved_to_course_id_fkey(id, name), students!inner(id, first_name, last_name, is_active, deleted_at, organization_id)'
      )
      .eq('course_id', courseId)
      .eq('students.organization_id', organization.id)
      .is('students.deleted_at', null)
      .order('left_at', { ascending: false })
    if (error) throw error

    const seen = new Set<string>()
    const rows = (data ?? []).filter((d) => {
      if (current.has(d.student_id) || seen.has(d.student_id)) return false
      seen.add(d.student_id)
      return true
    })
    return {
      data: rows.map((d) => ({
        id: d.id,
        studentId: d.student_id,
        firstName: d.students.first_name,
        lastName: d.students.last_name,
        isActive: d.students.is_active,
        joinedAt: d.joined_at,
        leftAt: d.left_at,
        reason: d.reason as 'removed' | 'moved',
        movedTo: d.moved_to ? { id: d.moved_to.id, name: d.moved_to.name } : null,
      })),
    }
  } catch (error) {
    unstable_rethrow(error)
    console.error('Error in getFormerCourseStudents:', error)
    return { error: await actionError('fetchCourseStudentsFailed') }
  }
}
