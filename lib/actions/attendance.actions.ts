'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import type { Database } from '@/lib/types/database.types'

type Attendance = Database['public']['Tables']['attendances']['Row']

export async function getSessionAttendances(sessionId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('attendances')
      .select('*, students(first_name, last_name), student_packages(remaining_credits)')
      .eq('session_id', sessionId)

    if (error) {
      console.error('Error fetching attendances:', error)
      return { error: 'Failed to fetch attendances' }
    }

    return { data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getSessionStudents(sessionId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()

    // Get course from session
    const { data: session, error: sessionError } = await (supabase
      .from('course_sessions') as any)
      .select('course_id')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return { error: 'Session not found' }
    }

    // Get course info
    const { data: courseData, error: courseError } = await (supabase
      .from('courses') as any)
      .select('dance_type_id')
      .eq('id', session.course_id)
      .single()

    if (courseError || !courseData) {
      return { error: 'Course not found' }
    }

    // Use admin client to fetch students enrolled in this course with packages
    const adminSupabase = createAdminClient()
    const { data: courseStudents, error: studentsError } = await (adminSupabase
      .from('course_students') as any)
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

    if (studentsError) {
      console.error('Error fetching enrolled students:', {
        error: studentsError,
        message: (studentsError as any)?.message,
        details: (studentsError as any)?.details,
      })
      return { error: 'Failed to fetch students' }
    }

    // Extract students with their packages for this dance type (including those with 0 credits or no matching packages)
    const filteredStudents = (courseStudents || [])
      .map((cs: any) => ({
        ...cs.students,
        student_packages: (cs.students.student_packages || [])
          .filter((sp: any) => sp.package?.dance_type_id === courseData.dance_type_id),
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

export async function recordAttendance(sessionId: string, studentId: string, studentPackageId: string, studioId?: string | null) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()

    // Record attendance
    const { data, error } = await (supabase
      .from('attendances') as any)
      .insert({
        session_id: sessionId,
        student_id: studentId,
        student_package_id: studentPackageId,
        studio_id: studioId || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error recording attendance:', error)
      return { error: 'Failed to record attendance' }
    }

    // Deduct credit from student_package
    const { data: pkg } = await (supabase
      .from('student_packages') as any)
      .select('remaining_credits')
      .eq('id', studentPackageId)
      .single()

    if (pkg && pkg.remaining_credits > 0) {
      await (supabase
        .from('student_packages') as any)
        .update({ remaining_credits: pkg.remaining_credits - 1 })
        .eq('id', studentPackageId)
    }

    // Get session and course info for instructor earnings
    const { data: sessionData } = await (supabase
      .from('course_sessions') as any)
      .select('course_id')
      .eq('id', sessionId)
      .single()

    if (sessionData) {
      // Get instructors for this course
      const { data: courseInstructors } = await (supabase
        .from('course_instructors') as any)
        .select('instructor_id')
        .eq('course_id', sessionData.course_id)

      if (courseInstructors && courseInstructors.length > 0) {
        // Get course details for rate calculation
        const { data: courseData } = await (supabase
          .from('courses') as any)
          .select('branch_id, dance_type_id')
          .eq('id', sessionData.course_id)
          .single()

        if (courseData) {
          // Calculate earnings for each instructor
          for (const ci of courseInstructors) {
            const { data: rateData } = await (supabase
              .from('instructor_rates') as any)
              .select('ratio_per_class')
              .eq('instructor_id', ci.instructor_id)
              .eq('branch_id', courseData.branch_id)
              .eq('dance_type_id', courseData.dance_type_id)
              .single()

            const ratio = rateData?.ratio_per_class || 0

            // Check if earnings already recorded for this instructor and session
            const { data: existingEarning } = await (supabase
              .from('instructor_earnings') as any)
              .select('id')
              .eq('instructor_id', ci.instructor_id)
              .eq('session_id', sessionId)
              .single()

            // Only record if not already recorded
            if (!existingEarning && ratio > 0) {
              await (supabase
                .from('instructor_earnings') as any)
                .insert({
                  instructor_id: ci.instructor_id,
                  session_id: sessionId,
                  amount: ratio,
                })
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

export async function removeAttendance(attendanceId: string, studentPackageId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()

    // Get the current credit count
    const { data: pkg } = await (supabase
      .from('student_packages') as any)
      .select('remaining_credits')
      .eq('id', studentPackageId)
      .single()

    // Restore credit
    if (pkg) {
      await (supabase
        .from('student_packages') as any)
        .update({ remaining_credits: pkg.remaining_credits + 1 })
        .eq('id', studentPackageId)
    }

    // Remove attendance record
    const { error } = await supabase.from('attendances').delete().eq('id', attendanceId)

    if (error) {
      console.error('Error removing attendance:', error)
      return { error: 'Failed to remove attendance' }
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
) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()

    // ✨ NEW: Ensure session exists (create on-demand if needed)
    // Check if a session already exists for this course on the specified date
    const checkDate = attendanceDate || new Date().toISOString().split('T')[0]
    console.log('[recordBatchAttendance] Checking for session:', { courseId, checkDate })
    
    const { data: existingSession } = await (supabase
      .from('course_sessions') as any)
      .select('id')
      .eq('course_id', courseId)
      .eq('session_date', checkDate)
      .single()

    let actualSessionId = sessionId
    
    if (!existingSession) {
      console.log('[recordBatchAttendance] Session not found, creating on-demand for course:', courseId)
      const today = attendanceDate || new Date().toISOString().split('T')[0]
      
      // Use admin client to bypass RLS for session creation
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const adminClient = createAdminClient()
      
      const { data: createdSession, error: createError } = await (adminClient
        .from('course_sessions') as any)
        .insert({ 
          course_id: courseId,
          session_date: today 
        })
        .select()
        .single()

      if (createError) {
        console.error('[recordBatchAttendance] Failed to create session:', createError)
        return { error: 'Failed to create session for attendance' }
      }
      
      actualSessionId = createdSession?.id
      console.log('[recordBatchAttendance] Session created successfully:', actualSessionId)

      // If instructor(s) are specified, insert into session_instructors table
      if (instructorIds && instructorIds.length > 0) {
        const sessionInstructorRecords = instructorIds.map(id => ({
          session_id: actualSessionId,
          instructor_id: id
        }))
        
        const { error: siError } = await (supabase
          .from('session_instructors') as any)
          .insert(sessionInstructorRecords)
        
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
    }

    // Filter to "geldi" and "gelmedi" records to process (save all records, not just those with notes)
    const geldiBatch = attendanceData.filter((a) => a.status === 'geldi')
    const gelmediWithNotesBatch = attendanceData.filter((a) => a.status === 'gelmedi')

    if (geldiBatch.length === 0 && gelmediWithNotesBatch.length === 0) {
      return { success: true, data: { recordedCount: 0, skippedCount: attendanceData.length } }
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
    const { error: insertError } = await (supabase.from('attendances') as any).insert(attendanceRecords)

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
      const { data: pkg } = await (supabase
        .from('student_packages') as any)
        .select('remaining_credits')
        .eq('id', record.studentPackageId)
        .single()

      if (pkg && pkg.remaining_credits > 0) {
        const { error: updateError } = await (supabase
          .from('student_packages') as any)
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
    const { data: sessionData } = await (supabase
      .from('course_sessions') as any)
      .select('course_id')
      .eq('id', actualSessionId)
      .single()

    if (sessionData) {
      // First check if session_instructors table has a specific instructor for this session
      const { data: sessionInstructors } = await (supabase
        .from('session_instructors') as any)
        .select('instructor_id')
        .eq('session_id', actualSessionId)

      let instructorsToProcess: any[] = []
      
      if (sessionInstructors && sessionInstructors.length > 0) {
        // Use specific instructor(s) from session_instructors
        instructorsToProcess = sessionInstructors
        console.log(`[recordBatchAttendance] Found ${instructorsToProcess.length} specific instructor(s) for this session`)
      } else {
        // Fall back to course instructors if no session-specific instructor set
        const { data: courseInstructors } = await (supabase
          .from('course_instructors') as any)
          .select('instructor_id')
          .eq('course_id', sessionData.course_id)
        
        instructorsToProcess = courseInstructors || []
        console.log(`[recordBatchAttendance] No session-specific instructor; using ${instructorsToProcess.length} course instructor(s)`)
      }

      if (instructorsToProcess && instructorsToProcess.length > 0) {
        // Get course details for rate calculation
        const { data: courseData } = await (supabase
          .from('courses') as any)
          .select('branch_id, dance_type_id')
          .eq('id', sessionData.course_id)
          .single()

        if (courseData) {
          // Get package price for this dance type
          const { data: packageData } = await (supabase
            .from('packages') as any)
            .select('price')
            .eq('dance_type_id', courseData.dance_type_id)
            .single()

          const packagePrice = packageData?.price || 0
          console.log(`[recordBatchAttendance] Package price for dance type: ₺${packagePrice}`)

          const earningsCreated = []
          
          // Calculate earnings for each instructor (only once per session)
          for (const ci of instructorsToProcess) {
            const { data: rateData } = await (supabase
              .from('instructor_rates') as any)
              .select('ratio_per_class')
              .eq('instructor_id', ci.instructor_id)
              .eq('branch_id', courseData.branch_id)
              .eq('dance_type_id', courseData.dance_type_id)
              .single()

            const ratio = rateData?.ratio_per_class || 0

            // Calculate amount: ratio × package_price
            const calculatedAmount = ratio * packagePrice
            console.log(`[recordBatchAttendance] Calculating earnings: ${ratio} (ratio) × ₺${packagePrice} (price) = ₺${calculatedAmount}`)

            // Check if earnings already recorded for this instructor and session
            const { data: existingEarning } = await (supabase
              .from('instructor_earnings') as any)
              .select('id')
              .eq('instructor_id', ci.instructor_id)
              .eq('session_id', actualSessionId)
              .single()

            // Only record if not already recorded
            if (!existingEarning) {
              const { error: earningsError } = await (supabase
                .from('instructor_earnings') as any)
                .insert({
                  instructor_id: ci.instructor_id,
                  session_id: actualSessionId,
                  amount: calculatedAmount,
                })
              
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

export async function getAttendanceReports(
  studentId?: string,
  dateFrom?: string,
  dateTo?: string,
) {
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

    const { data, error } = await query

    if (error) {
      console.error('Error fetching attendance reports:', error)
      return { error: 'Failed to fetch reports' }
    }

    return { data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
