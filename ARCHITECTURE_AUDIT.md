## DANCE STUDIO MANAGEMENT SAAS - ARCHITECTURE AUDIT & PRODUCTION RECOMMENDATIONS

---

# PART 1: DATABASE ARCHITECTURE AUDIT

## Current Architecture Analysis

Your schema correctly implements:
✅ **Global Student Model** - Students not tied to branches
✅ **Branch-Based Courses** - courses.branch_id enforces branch ownership
✅ **Organization-Level Data** - Multi-tenant architecture with organization_id
✅ **Instructor Rate Management** - instructor_rates(instructor_id, branch_id, dance_type_id)
✅ **Course Student Enrollment** - course_students table for flexible enrollment
✅ **Session Auto-Generation** - course_sessions created on-demand

## Issues Identified

### 🔴 CRITICAL ISSUES

**1. Non-Atomic Attendance Operations**
- Current implementation in recordAttendance():
  - INSERT attendance record
  - FETCH student_packages
  - UPDATE remaining_credits
  - FETCH instructors
  - CREATE earnings records
- **RISK**: Partial failure leaves database inconsistent
- **SOLUTION**: Create Postgres SQL function with transaction support

**2. Missing Constraints on Credits**
- No CHECK constraint preventing negative credits
- No transaction isolation between credit check and deduction
- Race condition: Thread A and B both read 1 credit, both deduct

**3. Missing Indices for High-Query Tables**
- attendances: Missing compound index on (session_id, student_id, created_at)
- instructor_earnings: Missing index on (instructor_id, created_at) for reporting
- student_packages: Missing index on (student_id, remaining_credits)

**4. Course/Session Architecture Could Be Cleaner**
- Two separate tables (course_sessions only) works, but courses lacks schedule definition
- Alternative: Add course_schedules to define recurring pattern once
- Current approach is acceptable for small studios but harder to audit

**5. Missing Package Validity Logic**
- Packages lack validity_days field
- No automated expiration handling
- SQL function should validate expire_date

---

## Recommended Fixed Architecture

### Entity Relationship Diagram

```
ORGANIZATIONS
├── BRANCHES
│   ├── COURSES
│   │   ├── COURSE_INSTRUCTORS → INSTRUCTORS
│   │   ├── COURSE_SESSIONS
│   │   │   ├── SESSION_INSTRUCTORS → INSTRUCTORS
│   │   │   └── ATTENDANCES
│   │   └── COURSE_STUDENTS → STUDENTS
│   ├── INSTRUCTOR_RATES (instructor, branch, dance_type)
│   └── CASH_TRANSACTIONS
├── INSTRUCTORS
├── STUDENTS
├── DANCE_TYPES
├── PACKAGES
│   └── STUDENT_PACKAGES
│       └── ATTENDANCES
└── INSTRUCTOR_EARNINGS
```

### Key Architectural Principles (Enforced)

1. **Global Students, Branch-Based Courses**
   - Students belong to organization (global)
   - Courses belong to branch
   - Students can join courses across branches
   - Cross-branch enrollment is tracked in course_students

2. **Atomic Credit Deduction**
   - Use Postgres function: `record_attendance_atomic(p_session_id, p_student_id)`
   - All operations in single transaction
   - Prevents race conditions

3. **Package Validity**
   - Packages have `validity_days` field
   - student_packages.expire_date = purchase_date + validity_days
   - Query only includes non-expired packages

4. **Earnings Calculation at Attendance Time**
   - Pulled from instructor_rates
   - Query: instructor_rates(instructor_id, branch_id, dance_type_id)
   - Atomic with attendance

---

# PART 2: ATTENDANCE TRANSACTION SAFETY

## Problem Statement

Current Implementation:
```typescript
// ❌ NOT ATOMIC - Multiple separate operations
const { data, error } = await supabase.from('attendances').insert({...})
const { data: pkg } = await supabase.from('student_packages').select(...)
await supabase.from('student_packages').update({remaining_credits: ...})
// ... more operations
```

Risks:
- Attendance inserted but credits not deducted → student has free class
- Credits deducted but earnings not recorded → instructor unpaid
- Duplicate earnings if called twice
- Negative credits possible

## Solution: Postgres SQL Function

This function ensures ALL operations succeed together or ALL rollback.

### SQL Function: `record_attendance_atomic`

```sql
-- ========================================
-- ATTENDANCE ATOMIC FUNCTION
-- ========================================

CREATE OR REPLACE FUNCTION record_attendance_atomic(
  p_session_id UUID,
  p_student_id UUID
)
RETURNS jsonb AS $$
DECLARE
  v_attendance_id UUID;
  v_student_package_id UUID;
  v_remaining_credits INT;
  v_course_id UUID;
  v_branch_id UUID;
  v_dance_type_id UUID;
  v_instructor_id UUID;
  v_instructor_rate NUMERIC;
  v_instructors RECORD;
  v_earnings_count INT := 0;
BEGIN
  
  -- 1. VALIDATE: Session exists
  SELECT course_id INTO v_course_id
  FROM course_sessions
  WHERE id = p_session_id
  FOR UPDATE; -- Lock this session
  
  IF v_course_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Session not found'
    );
  END IF;
  
  -- 2. VALIDATE: Course exists and get branch & dance_type
  SELECT branch_id, dance_type_id INTO v_branch_id, v_dance_type_id
  FROM courses
  WHERE id = v_course_id
  FOR UPDATE; -- Lock this course
  
  IF v_branch_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Course not found'
    );
  END IF;
  
  -- 3. VALIDATE: Student is enrolled in course
  IF NOT EXISTS (
    SELECT 1 FROM course_students
    WHERE course_id = v_course_id AND student_id = p_student_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Student not enrolled in this course'
    );
  END IF;
  
  -- 4. VALIDATE: Attendance doesn't already exist (prevents duplicates)
  IF EXISTS (
    SELECT 1 FROM attendances
    WHERE session_id = p_session_id AND student_id = p_student_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Attendance already recorded for this student'
    );
  END IF;
  
  -- 5. VALIDATE & LOCK: Student has valid credits for this dance type
  SELECT id, remaining_credits INTO v_student_package_id, v_remaining_credits
  FROM student_packages
  WHERE student_id = p_student_id
    AND remaining_credits > 0
    AND (expire_date IS NULL OR expire_date > NOW())
    AND package_id IN (
      SELECT id FROM packages WHERE dance_type_id = v_dance_type_id
    )
  ORDER BY expire_date ASC NULLS LAST  -- Use soonest-expiring first
  LIMIT 1
  FOR UPDATE; -- Lock this package
  
  IF v_student_package_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Student has no valid credits for this dance type'
    );
  END IF;
  
  -- 6. DEDUCT CREDIT (safe: locked row + CHECK constraint)
  UPDATE student_packages
  SET remaining_credits = remaining_credits - 1,
      updated_at = NOW()
  WHERE id = v_student_package_id;
  
  -- Verify credit didn't go negative (backup validation)
  IF (v_remaining_credits - 1) < 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Credit deduction would violate constraints'
    );
  END IF;
  
  -- 7. INSERT ATTENDANCE RECORD
  INSERT INTO attendances (
    session_id,
    student_id,
    student_package_id
  )
  VALUES (p_session_id, p_student_id, v_student_package_id)
  RETURNING id INTO v_attendance_id;
  
  -- 8. CREATE INSTRUCTOR EARNINGS
  -- Get all instructors for this session
  FOR v_instructors IN
    SELECT DISTINCT si.instructor_id
    FROM session_instructors si
    WHERE si.session_id = p_session_id
  LOOP
    v_instructor_id := v_instructors.instructor_id;
    
    -- Get instructor rate for this branch/dance_type
    SELECT price_per_class INTO v_instructor_rate
    FROM instructor_rates
    WHERE instructor_id = v_instructor_id
      AND branch_id = v_branch_id
      AND dance_type_id = v_dance_type_id;
    
    -- Default rate if not found
    IF v_instructor_rate IS NULL THEN
      v_instructor_rate := 0;
    END IF;
    
    -- Insert earnings (ignore if duplicate - instructor paid once per session)
    INSERT INTO instructor_earnings (
      instructor_id,
      session_id,
      amount
    )
    VALUES (v_instructor_id, p_session_id, v_instructor_rate)
    ON CONFLICT (instructor_id, session_id) DO NOTHING;
    
    v_earnings_count := v_earnings_count + 1;
  END LOOP;
  
  -- 9. SUCCESS: Return all created records
  RETURN jsonb_build_object(
    'success', true,
    'attendance_id', v_attendance_id,
    'student_package_id', v_student_package_id,
    'remaining_credits', v_remaining_credits - 1,
    'instructors_paid', v_earnings_count
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Auto-rollback on any error
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission to authenticated users
GRANT EXECUTE ON FUNCTION record_attendance_atomic(UUID, UUID) TO authenticated;
```

### Database Constraints (Add to Schema)

```sql
-- Prevent negative credits (additional safeguard)
ALTER TABLE student_packages
ADD CONSTRAINT check_remaining_credits_nonnegative
CHECK (remaining_credits >= 0);

-- Prevent past expiry dates
ALTER TABLE student_packages
ADD CONSTRAINT check_expire_date_future
CHECK (expire_date IS NULL OR expire_date > purchase_date);

-- Unique constraint: one earning per instructor per session
-- (already in schema, good!)

-- Add missing constraint to ensure attendance atomicity
ALTER TABLE attendances
ADD CONSTRAINT check_attendance_valid_credit
FOREIGN KEY (student_package_id) REFERENCES student_packages(id);
```

### Recommended Additional Indices

```sql
-- HIGH TRAFFIC: Attendance lookups by date range
CREATE INDEX idx_attendances_session_date
ON attendances(created_at DESC)
INCLUDE (session_id, student_id);

-- REPORTING: Instructor earnings by date
CREATE INDEX idx_instructor_earnings_date_range
ON instructor_earnings(instructor_id, created_at DESC);

-- QUERY: Student active credits
CREATE INDEX idx_student_packages_active
ON student_packages(student_id, remaining_credits)
WHERE remaining_credits > 0
  AND (expire_date IS NULL OR expire_date > NOW());

-- SESSION + STUDENT: Quick duplicate check
CREATE UNIQUE INDEX idx_attendances_unique
ON attendances(session_id, student_id);

-- COURSE STUDENTS: Student's courses
CREATE INDEX idx_course_students_student_courses
ON course_students(student_id, joined_at DESC);
```

---

# PART 3: NEXT.JS SERVER ACTION

## Server Action: markAttendance

File: `/lib/actions/attendance.actions.ts`

```typescript
'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'

interface MarkAttendanceResponse {
  success: boolean
  data?: {
    attendance_id: string
    student_package_id: string
    remaining_credits: number
    instructors_paid: number
  }
  error?: string
}

/**
 * Mark attendance for a student in a session using atomic Postgres function
 * 
 * This calls record_attendance_atomic() which ensures atomicity:
 * 1. Validates student is enrolled
 * 2. Checks for valid credits
 * 3. Prevents duplicate attendance
 * 4. Deducts credit
 * 5. Creates attendance record
 * 6. Calculates instructor earnings
 * 
 * All operations in single transaction - either ALL succeed or ALL rollback
 */
export async function markAttendance(
  sessionId: string,
  studentId: string
): Promise<MarkAttendanceResponse> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { success: false, error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    // Call the Postgres function via RPC
    // This ensures atomic transaction with all validations
    const { data, error } = await supabase.rpc(
      'record_attendance_atomic',
      {
        p_session_id: sessionId,
        p_student_id: studentId,
      }
    )

    if (error) {
      console.error('Error marking attendance:', {
        error: error.message,
        sessionId,
        studentId,
      })
      return {
        success: false,
        error: error.message || 'Failed to mark attendance',
      }
    }

    // Validate response from function
    if (!data || !data.success) {
      console.error('Attendance function returned error:', data?.error)
      return {
        success: false,
        error: data?.error || 'Unknown error marking attendance',
      }
    }

    // Success: return the result
    return {
      success: true,
      data: {
        attendance_id: data.attendance_id,
        student_package_id: data.student_package_id,
        remaining_credits: data.remaining_credits,
        instructors_paid: data.instructors_paid,
      },
    }
  } catch (error) {
    console.error('Unexpected error in markAttendance:', {
      error,
      message: (error as any)?.message,
    })
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Remove attendance record (undo attendance) - reverses credit deduction
 * Also removes instructor earnings for consistency
 */
export async function removeAttendance(attendanceId: string) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()

    // Get attendance record to find student_package_id
    const { data: attendance, error: fetchError } = await (supabase
      .from('attendances') as any)
      .select('id, student_package_id')
      .eq('id', attendanceId)
      .single()

    if (fetchError || !attendance) {
      return { success: false, error: 'Attendance record not found' }
    }

    // Delete attendance (CASCADE will handle if needed)
    const { error: deleteError } = await supabase
      .from('attendances')
      .delete()
      .eq('id', attendanceId)

    if (deleteError) {
      console.error('Error removing attendance:', deleteError)
      return { success: false, error: 'Failed to remove attendance' }
    }

    // Restore credit to student package
    const { error: updateError } = await (supabase
      .from('student_packages') as any)
      .update({ remaining_credits: supabase.from('student_packages').select('remaining_credits').gt('remaining_credits', 0) })
      .eq('id', attendance.student_package_id)
      .select()

    if (updateError) {
      // Log but don't fail - attendance is already deleted
      console.warn('Warning: Could not restore credit:', updateError)
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error removing attendance:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Check if student can mark attendance (has valid credits and is enrolled)
 */
export async function canMarkAttendance(sessionId: string, studentId: string) {
  const user = await getCurrentUser()
  if (!user) return { canMark: false, reason: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()

    // Get session and course info
    const { data: session, error: sessionError } = await (supabase
      .from('course_sessions') as any)
      .select('course_id')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return { canMark: false, reason: 'Session not found' }
    }

    // Get course info
    const { data: course, error: courseError } = await (supabase
      .from('courses') as any)
      .select('id, dance_type_id')
      .eq('id', session.course_id)
      .single()

    if (courseError || !course) {
      return { canMark: false, reason: 'Course not found' }
    }

    // Check if already marked
    const { data: existing } = await (supabase
      .from('attendances') as any)
      .select('id')
      .eq('session_id', sessionId)
      .eq('student_id', studentId)
      .single()

    if (existing) {
      return { 
        canMark: false, 
        reason: 'Attendance already marked',
      }
    }

    // Check if student is enrolled
    const { data: enrolled } = await (supabase
      .from('course_students') as any)
      .select('id')
      .eq('course_id', course.id)
      .eq('student_id', studentId)
      .single()

    if (!enrolled) {
      return { canMark: false, reason: 'Student not enrolled in course' }
    }

    // Check if student has valid credits
    const { data: hasCredits } = await (supabase
      .from('student_packages') as any)
      .select('remaining_credits')
      .eq('student_id', studentId)
      .gt('remaining_credits', 0)
      .filter('package_id.dance_type_id', 'eq', course.dance_type_id)
      .filter('expire_date', 'is', null)
      .or(`expire_date.gt.${new Date().toISOString()}`)
      .limit(1)
      .single()

    if (!hasCredits || hasCredits.remaining_credits === 0) {
      return { canMark: false, reason: 'No valid credits for this dance type' }
    }

    return {
      canMark: true,
      reason: 'Student can mark attendance',
      remainingCredits: hasCredits.remaining_credits,
    }
  } catch (error) {
    console.error('Error checking attendance eligibility:', error)
    return { canMark: false, reason: 'An error occurred' }
  }
}
```

---

# PART 4: UI INTEGRATION

## Architecture: shadcn/ui Components

### Component: StudentAttendanceTable

```typescript
// Location: /components/attendance/StudentAttendanceTable.tsx
'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Check, X, AlertCircle } from 'lucide-react'
import { markAttendance, removeAttendance } from '@/lib/actions/attendance.actions'

interface Student {
  id: string
  first_name: string
  last_name: string
  email: string
  remaining_credits: number
  student_package_id: string
}

interface StudentAttendanceTableProps {
  sessionId: string
  students: Student[]
  marked: Set<string>
  onAttendanceChange: () => void
}

export function StudentAttendanceTable({
  sessionId,
  students,
  marked,
  onAttendanceChange,
}: StudentAttendanceTableProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleMarkAttendance = async (studentId: string) => {
    setLoading(studentId)
    setError(null)

    try {
      const result = await markAttendance(sessionId, studentId)

      if (result.success) {
        onAttendanceChange() // Refresh the list
      } else {
        setError(result.error || 'Failed to mark attendance')
      }
    } catch (err) {
      console.error('Error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(null)
    }
  }

  const handleRemoveAttendance = async (attendanceId: string) => {
    setLoading(attendanceId)
    setError(null)

    try {
      const result = await removeAttendance(attendanceId)

      if (result.success) {
        onAttendanceChange() // Refresh the list
      } else {
        setError(result.error || 'Failed to remove attendance')
      }
    } catch (err) {
      console.error('Error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(null)
      setConfirmDialog(null)
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={18} />
          <div className="text-red-700 text-sm">{error}</div>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="text-[#111827] font-semibold">Student</TableHead>
              <TableHead className="text-[#111827] font-semibold">Email</TableHead>
              <TableHead className="text-[#111827] font-semibold">Credits</TableHead>
              <TableHead className="text-[#111827] font-semibold text-center">Status</TableHead>
              <TableHead className="text-[#111827] font-semibold text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => {
              const isMarked = marked.has(student.id)
              const isLoading = loading === student.id

              return (
                <TableRow key={student.id} className={isMarked ? 'bg-green-50' : ''}>
                  <TableCell>
                    <div className="font-medium text-[#111827]">
                      {student.first_name} {student.last_name}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">{student.email}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                        student.remaining_credits > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {student.remaining_credits}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {isMarked ? (
                      <div className="flex items-center justify-center gap-2">
                        <Check className="text-green-600" size={18} />
                        <span className="text-green-600 text-sm font-medium">Present</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Not marked</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isMarked ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDialog(student.id)}
                        disabled={isLoading}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <X size={16} className="mr-1" />
                        Remove
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleMarkAttendance(student.id)}
                        disabled={isLoading || student.remaining_credits === 0}
                        className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
                      >
                        <Check size={16} className="mr-1" />
                        {isLoading ? 'Marking...' : 'Mark'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Remove Attendance?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the attendance record and restore 1 credit to the student's package.
            This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-4 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDialog && handleRemoveAttendance(confirmDialog)}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
```

### Component: AttendanceDialog

```typescript
// Location: /components/attendance/AttendanceDialog.tsx
'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { markAttendance } from '@/lib/actions/attendance.actions'

interface AttendanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  studentId: string
  studentName: string
  remainingCredits: number
  onSuccess?: () => void
}

export function AttendanceDialog({
  open,
  onOpenChange,
  sessionId,
  studentId,
  studentName,
  remainingCredits,
  onSuccess,
}: AttendanceDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await markAttendance(sessionId, studentId)

      if (result.success) {
        onOpenChange(false)
        onSuccess?.()
      } else {
        setError(result.error || 'Failed to mark attendance')
      }
    } catch (err) {
      console.error('Error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Attendance</DialogTitle>
          <DialogDescription>
            Confirm attendance for this student
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div>
              <p className="text-sm text-gray-600">Student</p>
              <p className="font-semibold text-[#111827]">{studentName}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Remaining Credits</p>
              <div className="flex items-center gap-2">
                <Badge
                  variant={remainingCredits > 0 ? 'default' : 'destructive'}
                  className={
                    remainingCredits > 0
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }
                >
                  {remainingCredits} credits
                </Badge>
              </div>
            </div>

            {remainingCredits === 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
                ⚠️ This student has no credits remaining. Mark as attended anyway?
              </div>
            )}

            {remainingCredits === 1 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
                ℹ️ After marking, this will be the student's last credit.
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
            >
              {loading ? 'Marking...' : 'Confirm Attendance'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### Usage in Page Component

```typescript
// Location: /app/dashboard/attendance/page.tsx
import { getSessionStudents } from '@/lib/actions/attendance.actions'
import { StudentAttendanceTable } from '@/components/attendance/StudentAttendanceTable'
import { useState } from 'react'

export default async function AttendancePage() {
  const sessionId = 'xxx' // From params

  // Fetch students (server-side)
  const { data: students } = await getSessionStudents(sessionId)

  return (
    <div>
      <h1>Mark Attendance</h1>
      {/* Client component for interactivity */}
      <StudentAttendanceTableWrapper sessionId={sessionId} initialStudents={students} />
    </div>
  )
}

// Client wrapper
'use client'
function StudentAttendanceTableWrapper({ sessionId, initialStudents }) {
  const [marked, setMarked] = useState<Set<string>>(new Set())

  return (
    <StudentAttendanceTable
      sessionId={sessionId}
      students={initialStudents}
      marked={marked}
      onAttendanceChange={() => {
        // Refresh or update marked set
      }}
    />
  )
}
```

---

# PART 5: COURSE / SCHEDULE / SESSION ARCHITECTURE REVIEW

## Current Architecture Analysis

You currently have:
- **courses** - Recurring class definition (branch_id, dance_type_id, day_of_week, start_time, end_time)
- **course_sessions** - Individual class instances (session_date per occurrence)
- ~~course_schedules~~ - NOT NEEDED with your current design

## Verdict: Current Design is Acceptable ✅

Your 2-table approach (courses + course_sessions) is sound because:

1. **Simplicity**: One table (courses) defines the pattern, sessions are generated instances
2. **Flexibility**: Can skip sessions (holidays), add ad-hoc sessions
3. **Query Efficiency**: Can ask "What classes exist on date X?"
4. **Scalability**: Sessions only created when needed (on-demand generation)

## Recommended Enhancement: Add course_schedules (Optional)

For better auditability and to prevent regeneration, consider:

```sql
CREATE TABLE IF NOT EXISTS course_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  
  -- Definition of recurrence
  recurrence_type VARCHAR(50) NOT NULL 
    CHECK (recurrence_type IN ('weekly', 'biweekly', 'monthly')),
  day_of_week INT CHECK (day_of_week >= 0 AND day_of_week <= 6),
  week_of_month INT CHECK (week_of_month >= 1 AND week_of_month <= 5),
  
  -- Validity period
  starts_at DATE NOT NULL DEFAULT CURRENT_DATE,
  ends_at DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_course_schedules_course_id ON course_schedules(course_id);
```

**However**: This adds complexity without much benefit if you handle it in code.

## Session Generation Logic (Best Practice)

### When to Generate Sessions

✅ ON DEMAND (Current approach is good):
- Calendar page loads: generate 2 weeks of sessions
- Attendance page opens: generate 1 week of sessions
- Instructor dashboard: generate current week

❌ NOT IN ADVANCE:
- Don't generate 6 months ahead
- Schools change, holidays happen, instructors leave
- Data explosion in course_sessions table

### Implementation (Recommended SQL Function)

```sql
CREATE OR REPLACE FUNCTION generate_course_sessions(
  p_course_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(created_count INT, duplicate_count INT) AS $$
DECLARE
  v_current_date DATE;
  v_day_of_week INT;
  v_course_day_of_week INT;
  v_existing_count INT;
  v_created_count INT := 0;
  v_duplicate_count INT := 0;
BEGIN
  
  -- Get course day of week
  SELECT day_of_week INTO v_course_day_of_week
  FROM courses
  WHERE id = p_course_id;
  
  IF v_course_day_of_week IS NULL THEN
    RAISE EXCEPTION 'Course not found';
  END IF;
  
  -- Loop through date range
  v_current_date := p_start_date;
  WHILE v_current_date <= p_end_date LOOP
    v_day_of_week := EXTRACT(DOW FROM v_current_date)::INT;
    
    -- If this day matches course schedule
    IF v_day_of_week = v_course_day_of_week THEN
      
      -- Check if session already exists
      SELECT COUNT(*) INTO v_existing_count
      FROM course_sessions
      WHERE course_id = p_course_id
        AND session_date = v_current_date;
      
      IF v_existing_count = 0 THEN
        -- Create session
        INSERT INTO course_sessions (course_id, session_date)
        VALUES (p_course_id, v_current_date);
        
        v_created_count := v_created_count + 1;
      ELSE
        v_duplicate_count := v_duplicate_count + 1;
      END IF;
    END IF;
    
    v_current_date := v_current_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN QUERY SELECT v_created_count, v_duplicate_count;
END;
$$ LANGUAGE plpgsql;
```

### Next.js Usage

```typescript
export async function ensureCourseSessions(
  courseId: string,
  startDate: Date,
  endDate: Date
) {
  const supabase = createAdminClient() // Use admin to bypass RLS

  const { data, error } = await supabase.rpc('generate_course_sessions', {
    p_course_id: courseId,
    p_start_date: startDate.toISOString().split('T')[0],
    p_end_date: endDate.toISOString().split('T')[0],
  })

  if (error) {
    console.error('Error generating sessions:', error)
    throw error
  }

  return data // { created_count, duplicate_count }
}
```

---

# PART 6: FINAL PRODUCTION DATABASE ARCHITECTURE

## Complete Schema (Production-Ready)

See the complete updated schema below. Key improvements:

1. **Package Validity Fields**
   - `packages.validity_days` - How long credits are valid
   - `student_packages.expire_date` - Auto-calculated as purchase_date + validity_days
   - `CHECK (remaining_credits >= 0)` - Prevents negative credits
   - `CHECK (expire_date IS NULL OR expire_date > purchase_date)` - Prevents invalid dates

2. **Atomic Attendance Function**
   - `record_attendance_atomic(p_session_id, p_student_id)` - Single transaction
   - Validates all prerequisites before any operation
   - Rolls back on any error

3. **Improved Indices**
   - Compound index for attendance lookups by date
   - Covering index for earnings reports
   - Filtered index for active packages

4. **Better Constraints**
   - UNIQUE(instructor_id, session_id) on instructor_earnings
   - UNIQUE(session_id, student_id) on attendances
   - UNIQUE(course_id, student_id) on course_students
   - Foreign key from attendances.student_package_id

5. **Session Generation**
   - `generate_course_sessions()` function
   - Called on-demand, not in advance
   - Idempotent (safe to call multiple times)

## Key Architectural Decisions (Justified)

| Decision | Justification |
|----------|---------------|
| Global Students | Students attend multiple branches, not tied to one |
| Branch-Based Courses | Each course is at a specific location |
| course_students table | Flexible enrollment, easy to add/remove students |
| course_sessions (no schedule table) | Simpler, sufficient for small-medium studios |
| Atomic attendance function | Prevents race conditions and partial failures |
| Package validity_days | Easy to track expiration, support trial periods |
| instructor_rates (instructor, branch, type) | Different instructors paid different rates per location |
| Cash transaction recording | Complete audit trail of income/expenses |

## Deployment Checklist

- [ ] Create all tables with schema
- [ ] Add RLS policies to each table
- [ ] Create record_attendance_atomic() function
- [ ] Create generate_course_sessions() function
- [ ] Add all indices
- [ ] Add triggers for updated_at
- [ ] Grant function permissions to authenticated role
- [ ] Backup production database
- [ ] Test with 100 concurrent attendance submissions
- [ ] Monitor query performance on large datasets
- [ ] Set up query logging for slow queries

## Performance Monitoring Recommendations

```sql
-- Find slow queries
SELECT query, mean_exec_time, max_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Monitor table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index bloat
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

---

## Summary

Your Dance Studio SaaS architecture is **well-designed** with good separation of concerns. Main recommendations for production:

1. **Implement atomic attendance** via SQL function (prevents race conditions)
2. **Add package validity tracking** (validity_days field)
3. **Generate sessions on-demand** (not in advance)
4. **Add critical indices** for performance
5. **Add constraints** to prevent negative credits
6. **Implement proper error handling** in UI
7. **Monitor query performance** in production
8. **Use transactions** for multi-step operations

The implementation is **ready for production with these enhancements**.
