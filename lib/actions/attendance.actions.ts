'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { logOperation } from '@/lib/actions/history.actions'
import type { Database } from '@/lib/types/database.types'

type Attendance = Database['public']['Tables']['attendances']['Row']
type CourseSession = Database['public']['Tables']['course_sessions']['Row']
type Course = Database['public']['Tables']['courses']['Row']
type Student = Database['public']['Tables']['students']['Row']
type StudentPackage = Database['public']['Tables']['student_packages']['Row']
type CourseInstructor = Database['public']['Tables']['course_instructors']['Row']
type SessionInstructor = Database['public']['Tables']['session_instructors']['Row']
type Instructor = Database['public']['Tables']['instructors']['Row']
type InstructorRate = Database['public']['Tables']['instructor_rates']['Row']
type InstructorEarning = Database['public']['Tables']['instructor_earnings']['Row']
type Package = Database['public']['Tables']['packages']['Row']

// Query result types with relationships
type AttendanceWithRelations = Attendance & {
  students: { first_name: string | null; last_name: string | null } | null
  student_packages: { remaining_credits: number } | null
}

// Type-safe return where students is guaranteed to be present
type AttendanceWithStudent = AttendanceWithRelations & {
  students: NonNullable<AttendanceWithRelations['students']>
}

export async function getSessionAttendances(
  sessionId: string
): Promise<{ data?: AttendanceWithStudent[]; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()
    const result = await supabase
      .from('attendances')
      .select('*, students(first_name, last_name), student_packages(remaining_credits)')
      .eq('session_id', sessionId)
      .overrideTypes<AttendanceWithRelations[]>()

    const { data: allAttendances, error } = result as {
      data: AttendanceWithRelations[] | null
      error: any
    }

    if (error) {
      console.error('Error fetching attendances:', error)
      return { error: 'Failed to fetch attendances' }
    }

    // ✅ Filter to only include records with valid student relationship
    const data = (allAttendances || []).filter(
      (a): a is AttendanceWithRelations & { students: NonNullable<AttendanceWithRelations['students']> } =>
        !!a.students
    )

    return { data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getSessionStudents(
  sessionId: string
): Promise<{ data?: Student[]; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()

    // Get course from session
    const sessionResult = await supabase
      .from('course_sessions')
      .select('course_id')
      .eq('id', sessionId)
      .single()
      .overrideTypes<CourseSession>()

    const { data: session, error: sessionError } = sessionResult as {
      data: CourseSession | null
      error: any
    }

    if (sessionError || !session) {
      return { error: 'Session not found' }
    }

    // Get course info
    const courseResult = await supabase
      .from('courses')
      .select('dance_type_id')
      .eq('id', session.course_id)
      .single()
      .overrideTypes<Course>()

    const { data: courseData, error: courseError } = courseResult as {
      data: Course | null
      error: any
    }

    if (courseError || !courseData) {
      return { error: 'Course not found' }
    }

    // Use admin client to fetch students enrolled in this course with packages
    const adminSupabase = createAdminClient()
    
    type CourseStudentWithDetails = {
      student_id: string
      students: Student & {
        student_packages: (StudentPackage & {
          package: { dance_type_id: string } | null
        })[] | null
      } | null
    }

    const studentsResult = await adminSupabase
      .from('course_students')
      .select(
        `student_id, 
         students(
           id, first_name, last_name, 
           student_packages(
             id, remaining_credits, 
             package:packages(dance_type_id)
           )
         )`,
      )
      .eq('course_id', session.course_id)
      .overrideTypes<CourseStudentWithDetails[]>()

    const { data: courseStudents, error: studentsError } = studentsResult as {
      data: CourseStudentWithDetails[] | null
      error: any
    }

    if (studentsError) {
      console.error('Error fetching enrolled students:', {
        error: studentsError,
        message: (studentsError as any)?.message,
        details: (studentsError as any)?.details,
      })
      return { error: 'Failed to fetch students' }
    }

    // Extract students with their packages for this dance type
    const filteredStudents = (courseStudents || [])
      .filter((cs): cs is CourseStudentWithDetails & { students: NonNullable<CourseStudentWithDetails['students']> } => !!cs.students)
      .map((cs) => ({
        ...cs.students,
        student_packages: (cs.students.student_packages || [])
          .filter((sp) => sp.package?.dance_type_id === courseData.dance_type_id),
      }))

    return { data: filteredStudents }
  } catch (error) {
    console.error('Unexpected error in getSessionStudents:', {
      error,
      message: (error as any)?.message,
      stack: (error as any)?.stack?.split('\n').slice(0, 3),
    })
    return { error: 'An unexpected error occurred' }
  }
}

export async function recordAttendance(
  sessionId: string,
  studentId: string,
  studentPackageId: string,
  studioId?: string | null,
): Promise<{ success?: boolean; data?: Attendance; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()

    // Record attendance - .overrideTypes() ensures proper return type
    const result = await supabase
      .from('attendances')
      .insert({
        session_id: sessionId,
        student_id: studentId,
        student_package_id: studentPackageId,
        studio_id: studioId || null,
      } as any)
      .select()
      .single()
      .overrideTypes<Attendance>()
    
    const { data, error } = result as { data: Attendance | null; error: any }

    if (error) {
      console.error('Error recording attendance:', error)
      return { error: 'Failed to record attendance' }
    }

    if (!data) {
      return { error: 'Failed to record attendance' }
    }

    // ✅ Now data is properly typed as Attendance - no casting needed!
    // Log the attendance record creation
    const organization = await getOrganization()
    if (organization) {
      void logOperation('CREATE', 'attendance', data.id, {
        after: {
          sessionId: data.session_id,
          studentId: data.student_id,
          studentPackageId: data.student_package_id,
          studioId: data.studio_id,  // ✅ TypeScript knows this exists!
        }
      }, organization.id)
    }

    // Deduct credit from student_package
    
    const { data: pkg } = await supabase
      .from('student_packages')
      .select('remaining_credits')
      .eq('id', studentPackageId)
      .maybeSingle()
      .overrideTypes<StudentPackage>() as any

    // Get session and course info for instructor earnings
    const { data: sessionData } = await supabase
      .from('course_sessions')
      .select('course_id')
      .eq('id', sessionId)
      .maybeSingle()
      .overrideTypes<CourseSession>() as any

    if (sessionData) {
      // Get instructors for this course - Direct select without complex joins
      const { data: courseInstructors } = await supabase
        .from('course_instructors')
        .select('instructor_id')
        .eq('course_id', sessionData.course_id)
        .overrideTypes<{ instructor_id: string }[]>() as any

      if (courseInstructors && courseInstructors.length > 0) {
        // Get course details for rate calculation
        const { data: courseData } = await supabase
          .from('courses')
          .select('branch_id, dance_type_id')
          .eq('id', sessionData.course_id)
          .maybeSingle()
          .overrideTypes<Course>() as any

        if (courseData) {
          // Calculate earnings for each instructor
          for (const ci of courseInstructors) {
            // Get rate - using direct filter since we need multiple conditions
            const { data: rateData } = await supabase
              .from('instructor_rates')
              .select('ratio_per_class')
              .eq('instructor_id', ci.instructor_id)
              .eq('branch_id', courseData.branch_id)
              .eq('dance_type_id', courseData.dance_type_id)
              .maybeSingle()
              .overrideTypes<InstructorRate>() as any

            const ratio = rateData?.ratio_per_class || 0

            // Check if earnings already recorded for this instructor and session
            const { data: existingEarning } = await supabase
              .from('instructor_earnings')
              .select('id')
              .eq('instructor_id', ci.instructor_id)
              .eq('session_id', sessionId)
              .maybeSingle()
              .overrideTypes<{ id: string }>() as any

            // Only record if not already recorded
            if (!existingEarning && ratio > 0) {
              // Note: This appears to be legacy code - instructor earnings should be calculated
              // with package price. Keeping for backward compatibility.
              await supabase
                .from('instructor_earnings')
                .insert({
                  instructor_id: ci.instructor_id,
                  session_id: sessionId,
                  amount: (ratio / 100),  // Convert percentage to decimal
                } as any)
                .select()
                .single()
                .overrideTypes<InstructorEarning>() as any
            }
          }
        }
      }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function removeAttendance(
  attendanceId: string,
  studentPackageId: string,
): Promise<{ success?: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()

  try {
    const supabase = await createServerSupabaseClient()

    // Fetch before state for logging
    const { data: beforeAttendance } = await supabase
      .from('attendances')
      .select('id, session_id, student_id, student_package_id, studio_id')
      .eq('id', attendanceId)
      .maybeSingle()
      .overrideTypes<Attendance>() as any

    // Get the current credit count
    const { data: pkg } = await supabase
      .from('student_packages')
      .select('remaining_credits')
      .eq('id', studentPackageId)
      .maybeSingle()
      .overrideTypes<StudentPackage>() as any

    // Restore credit
    if (pkg) {
      const updateData = { remaining_credits: pkg.remaining_credits + 1 }
      await (supabase as any)
        .from('student_packages')
        .update(updateData)
        .eq('id', studentPackageId)
    }

    // Remove attendance record
    const { error } = await supabase.from('attendances').delete().eq('id', attendanceId)

    if (error) {
      console.error('Error removing attendance:', error)
      return { error: 'Failed to remove attendance' }
    }

    // Log the attendance record deletion
    if (organization && beforeAttendance) {
      void logOperation('DELETE', 'attendance', attendanceId, {
        before: {
          sessionId: beforeAttendance.session_id,
          studentId: beforeAttendance.student_id,
          studentPackageId: beforeAttendance.student_package_id,
          studioId: beforeAttendance.studio_id,
        }
      }, organization.id)
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function recordBatchAttendance(
  courseId: string,
  sessionId: string,
  attendanceData: Array<{
    studentId: string
    studentPackageId: string
    status: 'geldi' | 'gelmedi' | 'none'
    notes?: string
    deductCredits?: boolean  // New: whether to deduct credits
  }>,
  studioId?: string | null,
  instructorIds?: string[] | null,
  attendanceDate?: string,
): Promise<{
  success?: boolean
  data?: { sessionId: string; recordedCount: number; absenceNotesCount: number; skippedCount: number }
  error?: string
}> {
  /**
   * Records attendance for multiple students in a batch.
   * 
   * @param courseId - ID of the course
   * @param sessionId - Temporary session ID (will be replaced with database session ID)
   * @param attendanceData - Array of attendance records (status: 'geldi', 'gelmedi', or 'none')
   * @param studioId - Optional studio where attendance was recorded
   * @param instructorIds - Optional override instructor IDs for session
   * @param attendanceDate - Date for attendance in ISO format (YYYY-MM-DD)
   *                         If not provided, uses current date.
   *                         IMPORTANT: Dates are treated as local dates in the organization's timezone.
   *                         Ensure client and server use the same timezone convention.
   * 
   * Process:
   * 1. Validates date format (YYYY-MM-DD)
   * 2. Checks for existing course_sessions matching (course_id, session_date)
   * 3. Creates session on-demand if it doesn't exist (using admin client)
   * 4. Batch inserts all attendance records (both 'geldi' and 'gelmedi')
   * 5. Deducts credits for records where deductCredits=true
   * 6. Creates instructor earnings for the session
   * 
   * Returns:
   * - { success: true, data: { recordedCount, absenceNotesCount, skippedCount } }
   * - { error: string } if operation fails
   * 
   * Thread Safety: Race condition possible between check and create of session.
   *                Database UNIQUE constraint now prevents creation of duplicates.
   */

  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()

    // Validate attendance date format if provided
    if (attendanceDate) {
      // Check ISO date format (YYYY-MM-DD)
      const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateFormatRegex.test(attendanceDate)) {
        console.error('[recordBatchAttendance] Invalid date format:', attendanceDate)
        return { error: 'Invalid date format. Expected YYYY-MM-DD' }
      }
      
      // Validate it's a valid date
      const dateObj = new Date(attendanceDate + 'T00:00:00Z')
      if (isNaN(dateObj.getTime())) {
        console.error('[recordBatchAttendance] Invalid date value:', attendanceDate)
        return { error: 'Invalid date value' }
      }
      
      // Warn if date is far in the past or future (optional safeguard)
      const now = new Date()
      const attendanceDay = new Date(attendanceDate + 'T00:00:00Z')
      const daysAgo = Math.floor((now.getTime() - attendanceDay.getTime()) / (1000 * 60 * 60 * 24))
      if (daysAgo > 365) {
        console.warn('[recordBatchAttendance] Attendance date is more than a year in the past:', attendanceDate)
      }
      if (daysAgo < -30) {
        console.warn('[recordBatchAttendance] Attendance date is more than 30 days in the future:', attendanceDate)
      }
    }

    // ✨ NEW: Ensure session exists (create on-demand if needed)
    // Check if a session already exists for this course on the specified date
    const checkDate = attendanceDate || new Date().toISOString().split('T')[0]
    console.log('[recordBatchAttendance] Checking for session:', { courseId, checkDate })
    
    const { data: existingSession } = await supabase
      .from('course_sessions')
      .select('id')
      .eq('course_id', courseId)
      .eq('session_date', checkDate)
      .single()
      .overrideTypes<CourseSession>() as any

    let actualSessionId = sessionId
    
    if (!existingSession) {
      console.log('[recordBatchAttendance] Session not found, creating on-demand for course:', courseId)
      const today = attendanceDate || new Date().toISOString().split('T')[0]
      
      // Use admin client to bypass RLS for session creation
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const adminClient = createAdminClient()
      
      const result = await adminClient
        .from('course_sessions')
        .insert({ 
          course_id: courseId,
          session_date: today 
        } as any)
        .select()
        .single()
        .overrideTypes<CourseSession>()
      
      const { data: createdSession, error: createError } = result as { data: CourseSession | null; error: any }

      if (createError || !createdSession) {
        console.error('[recordBatchAttendance] Failed to create session:', createError)
        return { error: 'Failed to create session for attendance' }
      }
      
      actualSessionId = createdSession.id
      console.log('[recordBatchAttendance] Session created successfully:', actualSessionId)

      // If instructor(s) are specified, insert into session_instructors table
      if (instructorIds && instructorIds.length > 0) {
        const sessionInstructorRecords = instructorIds.map(id => ({
          session_id: actualSessionId,
          instructor_id: id
        }))
        
        const { error: siError } = await supabase
          .from('session_instructors')
          .insert(sessionInstructorRecords as any)
          .select()
          .overrideTypes<{ session_id: string; instructor_id: string }[]>() as any
        
        if (siError) {
          console.error('[recordBatchAttendance] Failed to insert session instructors:', siError)
        } else {
          console.log('[recordBatchAttendance] Session instructors inserted:', { actualSessionId, count: instructorIds.length })
        }
      }
    } else {
      // Session already exists for this course on this date
      actualSessionId = existingSession.id
      console.log('[recordBatchAttendance] Session already exists:', actualSessionId)
      
      // Check if attendance records already exist for this session
      const { data: existingAttendance, error: attendanceCheckError } = await supabase
        .from('attendances')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', actualSessionId)
        .limit(1)
      
      if (!attendanceCheckError && existingAttendance && existingAttendance.length > 0) {
        console.warn('[recordBatchAttendance] Attendance already recorded for this session/date')
        return { error: 'Yoklama bu tarih için zaten alınmış. Lütfen başka bir tarih seçiniz.' }
      }
    }

    // Filter to "geldi" and "gelmedi" records to process (save all records, not just those with notes)
    const geldiBatch = attendanceData.filter((a) => a.status === 'geldi')
    const gelmediWithNotesBatch = attendanceData.filter((a) => a.status === 'gelmedi')

    if (geldiBatch.length === 0 && gelmediWithNotesBatch.length === 0) {
      return {
        success: true,
        data: {
          sessionId: actualSessionId,
          recordedCount: 0,
          absenceNotesCount: 0,
          skippedCount: attendanceData.length,
        },
      }
    }

    // Validate that all records have studentPackageId
    const allBatchRecords = [...geldiBatch, ...gelmediWithNotesBatch]
    const invalidRecords = allBatchRecords.filter((a) => !a.studentPackageId)
    if (invalidRecords.length > 0) {
      console.error('Invalid records - missing studentPackageId:', invalidRecords)
      return { error: 'Some students are missing package data. Please refresh and try again.' }
    }

    // Batch insert all attendance records (both geldi and gelmedi)
    const attendanceRecords = allBatchRecords.map((a) => ({
      session_id: actualSessionId,
      student_id: a.studentId,
      student_package_id: a.studentPackageId,
      studio_id: studioId || null,
      is_present: a.status === 'geldi',  // TRUE for geldi, FALSE for gelmedi
      deduct_credits: a.deductCredits !== false,  // Save deduct_credits flag to database
      notes: a.notes || null,
    }))

    console.log('[recordBatchAttendance] Inserting attendance records:', attendanceRecords, 'with studio:', studioId || 'none', `(${geldiBatch.length} geldi + ${gelmediWithNotesBatch.length} gelmedi)`)
    const { error: insertError } = await supabase
      .from('attendances')
      .insert(attendanceRecords as any)
      .select()
      .overrideTypes<Attendance[]>() as any

    if (insertError && (insertError as any)?.code !== '23505') {
      // 23505 = unique violation (already marked), which is ok
      console.error('Error batch inserting attendance:', insertError)
      return { error: 'Failed to record attendance' }
    }

    // Batch update credits for each student package
    // Credit deduction happens for both "geldi" and "gelmedi" records if deductCredits is true
    const recordsToDeductCredits = allBatchRecords.filter((a) => a.deductCredits !== false)
    console.log(`[recordBatchAttendance] Deducting credits for ${recordsToDeductCredits.length} students (geldi + gelmedi)`)
    const creditDeductionResults = []
    
    for (const record of recordsToDeductCredits) {
      const { data: pkg } = await supabase
        .from('student_packages')
        .select('remaining_credits')
        .eq('id', record.studentPackageId)
        .maybeSingle()
        .overrideTypes<StudentPackage>() as any

      if (pkg && pkg.remaining_credits > 0) {
        const { error: updateError } = await (supabase as any)
          .from('student_packages')
          .update({ remaining_credits: pkg.remaining_credits - 1 })
          .eq('id', record.studentPackageId)
        
        if (!updateError) {
          creditDeductionResults.push({
            studentId: record.studentId,
            packageId: record.studentPackageId,
            previousCredits: pkg.remaining_credits,
            newCredits: pkg.remaining_credits - 1,
            status: 'success'
          })
          console.log(`[recordBatchAttendance] Credits deducted: ${record.studentId} (${pkg.remaining_credits} → ${pkg.remaining_credits - 1})`)
        } else {
          console.error(`[recordBatchAttendance] Failed to deduct credits for ${record.studentId}:`, updateError)
        }
      } else {
        console.warn(`[recordBatchAttendance] No credits to deduct for ${record.studentId} or invalid package`)
      }
    }
    console.log(`[recordBatchAttendance] Credit deduction complete:`, creditDeductionResults)

    // Get session and course info for instructor earnings
    console.log(`[recordBatchAttendance] Creating instructor earnings for session: ${actualSessionId}`)
    const { data: sessionData } = await supabase
      .from('course_sessions')
      .select('course_id')
      .eq('id', actualSessionId)
      .maybeSingle()
      .overrideTypes<CourseSession>() as any

    if (sessionData) {
      // First check if session_instructors table has a specific instructor for this session
      const { data: sessionInstructors } = await supabase
        .from('session_instructors')
        .select('instructor_id')
        .eq('session_id', actualSessionId)
        .overrideTypes<{ instructor_id: string }[]>() as any

      let instructorsToProcess: any[] = []
      
      if (sessionInstructors && sessionInstructors.length > 0) {
        // Use specific instructor(s) from session_instructors
        instructorsToProcess = sessionInstructors
        console.log(`[recordBatchAttendance] Found ${instructorsToProcess.length} specific instructor(s) for this session`)
      } else {
        // Fall back to course instructors if no session-specific instructor set
        const { data: courseInstructors } = await supabase
          .from('course_instructors')
          .select('instructor_id')
          .eq('course_id', sessionData.course_id)
          .overrideTypes<{ instructor_id: string }[]>() as any
        
        instructorsToProcess = courseInstructors || []
        console.log(`[recordBatchAttendance] No session-specific instructor; using ${instructorsToProcess.length} course instructor(s)`)
      }

      if (instructorsToProcess && instructorsToProcess.length > 0) {
        // Get course details for rate calculation
        const { data: courseData } = await supabase
          .from('courses')
          .select('branch_id, dance_type_id')
          .eq('id', sessionData.course_id)
          .single()
          .overrideTypes<Course>() as any

        if (courseData) {
          // Get package price for this dance type
          const { data: packageData } = await supabase
            .from('packages')
            .select('price')
            .eq('dance_type_id', courseData.dance_type_id)
            .single() as { data: Package; error: null }

          const packagePrice = packageData?.price || 0
          console.log(`[recordBatchAttendance] Package price for dance type: ₺${packagePrice}`)

          const earningsCreated = []
          
          // Calculate earnings for each instructor (only once per session)
          for (const ci of instructorsToProcess) {
            const { data: rateData } = await supabase
              .from('instructor_rates')
              .select('ratio_per_class')
              .eq('instructor_id', ci.instructor_id)
              .eq('branch_id', courseData.branch_id)
              .eq('dance_type_id', courseData.dance_type_id)
            .maybeSingle()
            .overrideTypes<InstructorRate>() as any

            const ratio = rateData?.ratio_per_class || 0
            const calculatedAmount = (ratio / 100) * packagePrice
            
            console.log(`[recordBatchAttendance] Calculating earnings: ${ratio}% × ₺${packagePrice} = ₺${calculatedAmount.toFixed(2)}`)

            // Check if earnings already recorded for this instructor and session
            const { data: existingEarning } = await supabase
              .from('instructor_earnings')
              .select('id')
              .eq('instructor_id', ci.instructor_id)
              .eq('session_id', actualSessionId)
              .maybeSingle()
              .overrideTypes<{ id: string }>() as any

            // Only record if not already recorded
            if (!existingEarning && ratio > 0) {
              const { error: earningsError } = await supabase
                .from('instructor_earnings')
                .insert({
                  instructor_id: ci.instructor_id,
                  session_id: actualSessionId,
                  amount: calculatedAmount,
                } as any)
                .select()
                .single()
                .overrideTypes<InstructorEarning>() as any
              
              if (!earningsError) {
                earningsCreated.push({
                  instructor_id: ci.instructor_id,
                  amount: calculatedAmount,
                  status: 'created'
                })
                console.log(`[recordBatchAttendance] Instructor earnings created: ${ci.instructor_id} - ₺${calculatedAmount}`)
              } else {
                console.error(`[recordBatchAttendance] Failed to create earnings for ${ci.instructor_id}:`, earningsError)
              }
            } else if (existingEarning) {
              console.log(`[recordBatchAttendance] Earnings already exist for ${ci.instructor_id}, skipping`)
            } else if (ratio === 0) {
              console.warn(`[recordBatchAttendance] No rate found for instructor ${ci.instructor_id}`)
            }
          }
          console.log(`[recordBatchAttendance] Earnings creation complete:`, earningsCreated)
        }
      }
    }

    // All records (geldi + gelmedi with notes) have been inserted in the batch above
    // No need for separate gelmedi handling

    return {
      success: true,
      data: { 
        sessionId: actualSessionId,
        recordedCount: geldiBatch.length, 
        absenceNotesCount: gelmediWithNotesBatch.length,
        skippedCount: attendanceData.length - allBatchRecords.length 
      },
    }
  } catch (error) {
    console.error('Unexpected error in recordBatchAttendance:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// Type for attendance reports
type AttendanceReport = Attendance & {
  students: { first_name: string | null; last_name: string | null } | null
  course_sessions: { session_date: string } | null
}

export async function getAttendanceReports(
  studentId?: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<{ data?: AttendanceReport[]; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('attendances')
      .select(
        'id, student_id, session_id, created_at, students(first_name, last_name), course_sessions(session_date)',
      )
      .order('created_at', { ascending: false })

    if (studentId) {
      query = query.eq('student_id', studentId)
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    const result = await query.overrideTypes<AttendanceReport[]>()
    const { data, error } = result as { data: AttendanceReport[] | null; error: any }

    if (error) {
      console.error('Error fetching attendance reports:', error)
      return { error: 'Failed to fetch reports' }
    }

    return { data: data || [] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
