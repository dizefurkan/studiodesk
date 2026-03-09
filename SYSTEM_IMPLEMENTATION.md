# Dance Studio Management System - Complete Implementation Guide

## System Overview

This is a production-ready SaaS application for managing dance studios with complete lifecycle management for students, courses, instructors, and finances.

## Core Features Implemented

### 1. ✅ Student Course Purchase System

**Location:** `/dashboard/students/[id]` (Student Profile Page)

**Flow:**
1. Admin opens a student profile
2. Clicks "Purchase Package" button
3. Selects a course package (e.g., "Salsa Beginner - 8 classes")
4. Can optionally override the price
5. Confirms purchase

**What Happens:**
- Creates `student_packages` record with remaining credits
- Records transaction in `cash_transactions` (income)
- Updates student's credit balance automatically

**Files:**
- `components/students/StudentPurchaseDialog.tsx` - Modal UI for purchasing
- `lib/actions/students.actions.ts` - Backend `purchasePackage()` function
- Data tables: `packages`, `student_packages`, `cash_transactions`

**Example:**
```
Student "John Doe" purchases "Salsa Beginner - 8 classes" for 2000 TL
→ Adds 8 credits to student_packages
→ Records +2000 TL income transaction
```

---

### 2. ✅ Student Credits Display

**Location:** `/dashboard/students/[id]` (Student Profile Page)

**Features:**
- Shows all active packages for the student
- Displays remaining credits per package
- Shows progress bar (% of credits used)
- Color-coded by availability (green > 50%, yellow 25-50%, red < 25%)
- Shows dance type for each package

**Files:**
- `components/students/StudentCredits.tsx` - Credit display component
- `lib/actions/students.actions.ts` - `getStudentPackages()` function

**Example:**
```
Credits:
├─ Salsa Beginner:     5 / 8 credits (62% remaining)
└─ Bachata Intermediate: 1 / 6 credits (17% remaining - RED FLAG)
```

---

### 3. ✅ Course Enrollment & Student Management

**Location:** `/dashboard/courses/[id]` (Course Detail Page)

**Features:**
- View students with active packages for the course
- Auto-filtered by dance type matching
- Display student credits per package
- Quick access to enrollment list

**Files:**
- `lib/actions/courses.actions.ts`:
  - `getCourseEnrolledStudents()` - Get students with active packages
  - `getAvailableStudentsForCourse()` - Get enrollable students
- Data table: `student_packages` with dance type filter

---

### 4. ✅ Attendance Tracking System

**Location:** `/dashboard/attendance`

**Features:**
1. **Course/Session Selection:**
   - View all courses
   - Click to select course sessions
   
2. **Student Attendance:**
   - Lists enrolled students (those with active packages)
   - Unrecorded students with "Mark Present" button
   - Recorded students with "Remove" button (undo)
   - Color-coded feedback (green/red/gray)

3. **Automatic Credit Deduction:**
   - When marked present: remaining_credits -= 1
   - Credit count updated in real-time
   - Can remove and restore credits if needed

4. **Automatic Instructor Earnings:**
   - Calculates based on instructor_rates
   - Creates `instructor_earnings` record
   - Prevents duplicate entries per instructor+session

**Files:**
- `app/dashboard/attendance/page.tsx` - Main page
- `components/attendance/StudentAttendanceList.tsx` - Attendance UI
- `lib/actions/attendance.actions.ts`:
  - `recordAttendance()` - Mark present + deduct credit + calc earnings
  - `removeAttendance()` - Undo attendance + restore credit
  - `getSessionStudents()` - Get students for session
  - `getSessionAttendances()` - Get recorded attendances

**Data Flow:**
```
Student marked present
→ Create attendance record
→ Deduct 1 credit from student_packages
→ Calculate instructor rate
→ Create instructor_earnings record
```

---

### 5. ✅ Instructor Earnings Calculation

**Location:** `/dashboard/instructor-earnings`

**Features:**
- Automatic calculation from attendance
- Filters by instructor and date range
- Summary: total earnings, session count, average rate
- Based on `instructor_rates` table

**Automatic Calculation:**
- When attendance recorded, system:
  1. Gets session instructors from `course_instructors`
  2. Looks up rate from `instructor_rates` (by instructor + branch + dance_type)
  3. Creates `instructor_earnings` record with amount
  4. Prevents duplicates (idempotent)

**Files:**
- `lib/actions/instructor-earnings.actions.ts` - Query earnings
- Calculation happens in `lib/actions/attendance.actions.ts` - `recordAttendance()`

---

### 6. ✅ Course Calendar with Auto-Generation

**Location:** `/dashboard/calendar`

**Features:**
1. **Auto-Generation:**
   - On page load, checks if sessions exist for today + 2 weeks
   - If missing, automatically generates them based on course schedule
   - Uses `course.day_of_week` to match dates
   
2. **Calendar UI:**
   - Month view with navigation
   - Shows calendar grid
   - Can view previous/next months

3. **No "months ahead" frustration:**
   - Only generates next 2 weeks of sessions
   - Prevents bloated session tables
   - User-friendly: sessions appear as needed

**Files:**
- `app/dashboard/calendar/page.tsx` - Calendar page with auto-generation
- `lib/actions/courses.actions.ts` - `generateCourseSessions()` function

**How It Works:**
```
Calendar loaded
→ For each course:
  → Check if sessions exist for today + 14 days
  → If not: generate matching day_of_week sessions
  → If yes: skip (already exists)
```

---

### 7. ✅ Branch Cash Register

**Location:** `/dashboard/cash-register`

**Features:**
1. **Transaction List:**
   - Shows all transactions (income/expense)
   - Linked to student purchases
   - Manual expenses can be added

2. **Daily Report:**
   - Income total
   - Expenses total
   - Net balance

3. **Filters:**
   - By branch
   - By transaction type (income/expense)
   - By date

4. **Transaction Creation:**
   - Automatic from package sales
   - Manual transactions via "New Transaction" button
   - Includes description and amount

**Files:**
- `app/dashboard/cash-register/page.tsx` - Main page
- `lib/actions/cash-register.actions.ts`:
  - `getTransactions()` - Query transactions
  - `createTransaction()` - Add manual transactions
  - `getDailyReport()` - Summary stats
- Data table: `cash_transactions`

---

## Complete System Flow Example

### Scenario: Student Takes a Class and Pays

```
1. INITIAL STATE
   └─ Student "Maria" has $0 credits

2. ADMIN SELLS PACKAGE
   Location: /dashboard/students/[maria-id]
   Action: Click "Purchase Package"
   └─ Select: "Salsa Beginner - 8 classes - 2000 TL"
   └─ Confirm Purchase
   
   DATABASE CHANGES:
   ├─ INSERT student_packages (remaining_credits = 8)
   └─ INSERT cash_transactions (income, +2000 TL)
   
   UI UPDATES:
   ├─ Credits Section shows: "Salsa Beginner: 8/8 credits"
   └─ Cash Register shows: "+2000 TL Salsa Package Sale"

3. COURSE SESSION SCHEDULED
   Location: /dashboard/calendar
   
   DATABASE:
   ├─ Course "Salsa Beginner" scheduled for Monday 3-5pm
   └─ Calendar page auto-generates sessions (today + 2 weeks)
   └─ INSERT course_sessions (for each matching Monday)
   
   UI UPDATES:
   └─ Calendar shows session dates when clicked

4. ATTENDANCE RECORDED
   Location: /dashboard/attendance?session=[session-id]
   Action: Click "Mark Present" for Maria
   
   DATABASE CHANGES:
   ├─ INSERT attendances (session_id, student_id, package_id)
   ├─ UPDATE student_packages SET remaining_credits = 7
   └─ INSERT instructor_earnings (rate, amount)
   
   UI UPDATES:
   ├─ Maria moves to "✅ Marked Present" section (green)
   ├─ Credits show: "Salsa Beginner: 7/8 credits" (62%)
   └─ Instructor Earnings page shows new entry

5. ADMIN CHECKS FINANCIALS
   Location: /dashboard/cash-register?branch=[branch-id]
   
   UI Shows:
   ├─ Income: 2000 TL
   ├─ Balance: 2000 TL
   └─ Transaction: "+2000 TL Salsa Package Sale - Maria"

6. INSTRUCTOR CHECKS EARNINGS
   Location: /dashboard/instructor-earnings?instructor=[instructor-id]
   
   UI Shows:
   ├─ Total Earnings: [rate] TL
   ├─ Sessions: 1
   └─ Entry: "Session on 3/10/2026 - 300 TL"
```

---

## Database Schema Key Tables

### Student & Packages
```sql
students (id, first_name, last_name, email, phone, notes)
packages (id, name, total_credits, price, dance_type_id, organization_id)
student_packages (id, student_id, package_id, remaining_credits, purchase_date)
```

### Courses & Sessions
```sql
courses (id, name, day_of_week, start_time, end_time, branch_id, dance_type_id)
course_instructors (course_id, instructor_id)
course_sessions (id, course_id, session_date)
```

### Attendance & Earnings
```sql
attendances (id, session_id, student_id, student_package_id)
instructor_earnings (id, instructor_id, session_id, amount)
instructor_rates (instructor_id, branch_id, dance_type_id, price_per_class)
```

### Financials
```sql
cash_transactions (id, branch_id, type, amount, description, student_package_id)
```

---

## Key Server Actions (lib/actions/)

### students.actions.ts
- `getStudents()` - List all students
- `getStudent(id)` - Get single student
- `createStudent()` - New student
- `updateStudent()` - Edit student
- `deleteStudent()` - Remove student
- **`getStudentPackages(studentId)`** - Get credits
- **`purchasePackage()`** - Sell package ⭐
- **`reduceStudentCredits()`** - Deduct credits

### attendance.actions.ts
- `getSessionAttendances()` - Get attendance records
- `getSessionStudents()` - Get students for session
- **`recordAttendance()`** - Mark present ⭐
  - Deducts credit
  - Calculates instructor earnings
  - Creates earnings record
- `removeAttendance()` - Undo attendance + restore credit
- `getAttendanceReports()` - Query attendance

### courses.actions.ts
- `getCourses()` - List courses
- `getCourse(id)` - Get course details
- **`generateCourseSessions()`** - Auto-generate sessions ⭐
  - Creates sessions for date range
  - Matches course.day_of_week
- `getCourseSessions()` - Get sessions for course
- `getCourseEnrolledStudents()` - Get students with active packages
- `getAvailableStudentsForCourse()` - Get enrollable students

### instructor-earnings.actions.ts
- `getInstructorEarnings()` - Query earnings
- `getEarningsReport()` - Monthly summary

### cash-register.actions.ts
- `getTransactions()` - List transactions
- `createTransaction()` - Add transaction
- `getDailyReport()` - Income/expense summary

---

## UI Components

### students/
- `StudentPurchaseDialog.tsx` - 🛍️ Sell package modal
- `StudentCredits.tsx` - 📊 Display credits with progress

### attendance/
- `StudentAttendanceList.tsx` - ✅ Mark present/absent UI
- `RemoveAttendanceButton.tsx` - 🗑️ Undo attendance

### cash-register/
- `TransactionForm.tsx` - 📝 Add manual transactions
- `DeleteTransactionButton.tsx` - 🗑️ Remove transactions

### layout/
- `Sidebar.tsx` - 🗂️ Navigation menu (all pages linked)
- `TopBar.tsx` - Header/user menu
- `UserMenu.tsx` - Profile dropdown

---

## Navigation & Pages

All pages included in Sidebar menu:

```
Dashboard                    ✅
├─ Students                  ✅ (with Purchase Package)
├─ Instructors              ✅
├─ Branches                 ✅
├─ Dance Types              ✅
├─ Courses                  ✅ (with Sessions view)
├─ Calendar                 ✅ (auto-generates sessions)
├─ Attendance               ✅ (Student Attendance List)
├─ Packages                 ✅
├─ Cash Register            ✅ (income/expense tracking)
├─ Instructor Earnings      ✅ (auto-calculated)
└─ Settings                 ✅
```

Each page has:
- Create/Edit/Delete actions
- Search functionality
- Proper RLS security
- Professional SaaS UI

---

## Configuration & Customization

### Instructor Rates
Setting up instructor payments:

1. Go to Instructors page
2. Click instructor details
3. Set rate per class by branch & dance type
4. Rates stored in `instructor_rates` table

When attendance recorded:
```
Rate lookup: WHERE instructor_id = ? AND branch_id = ? AND dance_type_id = ?
```

### Package Pricing
1. Go to Packages page
2. Create/edit package with:
   - Name (e.g., "Salsa Beginner")
   - Credits (e.g., 8)
   - Price (e.g., 2000 TL)
   - Dance Type

Admins can override price when selling (optional).

### Course Schedule
1. Go to Courses page
2. Create course with:
   - Name
   - Day of week (0=Sunday, 6=Saturday)
   - Start/end time
   - Capacity

Sessions auto-generate on calendar view.

---

## Security Features

**Row-Level Security (RLS) Enabled:**
- All tables have RLS policies
- Users only see their organization's data
- Role-based access (owner/manager/instructor/staff)
- Multi-tenant isolation

**Authentication:**
- Via Supabase Auth
- JWT tokens
- Session management
- Automatic role/org detection

---

## Error Handling

All server actions return:
```typescript
{ error: string } | { success: true, data: T }
```

UI components:
- Display error messages in modal/alert
- Disable buttons while processing
- Show loading states
- Auto-refresh on success

---

## Performance Optimizations

1. **Session Generation:** Only creates 2 weeks ahead (not full month/year)
2. **Query Optimization:** Uses specific select() fields, not *
3. **Index Coverage:** Database has indexes on:
   - `organization_id` (all tables)
   - `created_at` (for sorting)
   - `dance_type_id`, `branch_id` (for filtering)
4. **Debouncing:** Attendance marks saved immediately (no debounce needed)
5. **Caching:** Uses Next.js revalidation after mutations

---

## Testing the System

### Basic Flow Test
1. Create student: `/dashboard/students/new`
2. Create package: `/dashboard/packages/new`
3. Create course: `/dashboard/courses/new`
4. View calendar: `/dashboard/calendar`
5. Open student: `/dashboard/students/[id]`
6. Click "Purchase Package"
7. Open attendance: `/dashboard/attendance`
8. Mark student present
9. Verify credits decreased
10. Check instructor earnings: `/dashboard/instructor-earnings`
11. Check cash register: `/dashboard/cash-register`

### Verification Checklist
- [ ] Student credits display correctly
- [ ] Package purchase creates transaction
- [ ] Attendance deducts 1 credit
- [ ] Undoing attendance restores credit
- [ ] Instructor earnings appear after attendance
- [ ] Calendar generates sessions for today + 2 weeks
- [ ] Cash register shows income transactions
- [ ] All pages have proper authentication

---

## Deployment & Requirements

**Technology Stack:**
- Next.js 14+ (App Router)
- React 19+
- Supabase (PostgreSQL)
- TailwindCSS 4+
- TypeScript
- Vercel (recommended deployment)

**Environment Variables Needed:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

**Database Setup:**
1. Run `database/schema.sql`
2. Run `database/rls-policies.sql`
3. Create test instructor_rates if needed

**First Time Setup:**
1. Create organization via admin client
2. Create initial user
3. Create branch
4. Create dance types
5. Create instructors + set rates
6. Create packages
7. Create courses
8. System ready for students!

---

## Notes & Future Improvements

**What's Built:**
- ✅ Complete purchase/credit system
- ✅ Automatic attendance → credit deduction
- ✅ Automatic instructor earnings calculation
- ✅ Dynamic session generation (2 weeks window)
- ✅ Multi-tenant with RLS
- ✅ Professional SaaS UI

**Possible Enhancements:**
- [] Refunds/credit adjustments UI
- [] Attendance reports (per student/instructor/course)
- [] Revenue reports & analytics
- [] Email notifications (new class, payment reminders)
- [] Student app (check credits, book classes)
- [] Payment gateway integration (Stripe)
- [] Subscription mode (recurring payments)
- [] Class waiting list
- [] Make-up class tracking

---

## Support & Debugging

**Common Issues:**

1. **"Student has no active packages"**
   - Student must purchase package first
   - Package must match course dance type

2. **"Session not found"**
   - Calendar page auto-generates sessions
   - Refresh page to trigger generation
   - Check that course.day_of_week is set

3. **Credits not decreasing**
   - Check student has remaining_credits > 0
   - Verify attendance record created
   - Check student_packages.remaining_credits in DB

4. **Instructor earnings not appearing**
   - Verify instructor_rates exist for the combination
   - Check instructor assigned to course
   - Verify session has course_instructors link

---

**Last Updated:** March 2026
**Status:** Production Ready
**System Version:** 1.0
