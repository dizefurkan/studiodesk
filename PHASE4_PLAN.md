# 🎯 Phase 4: Feature Module Development Plan

## Overview

Phase 4 focuses on building the main feature modules of the application. Each module will have:
- **List page** - View all records with search/filter
- **Detail page** - View single record
- **Create page** - Add new record
- **Edit page** - Modify existing record
- **Delete functionality** - Remove records
- **Database actions** - Server actions for CRUD operations
- **Type-safe operations** - Full TypeScript support

---

## 📋 Feature Modules Roadmap

### Module 1: **Students** (Estimated: 2-3 hours)
**Priority**: HIGHEST - Core to the system

#### Features
- List students with search and filter
- Create new student
- Edit student info
- Delete student
- View student details
- Display student enrollment status

#### Database Tables
- `students` (name, email, phone, notes)
- `student_packages` (enrollment, credits, expiry)

#### Pages
```
/dashboard/students/                    # List + search
/dashboard/students/[id]                # View detail
/dashboard/students/[id]/edit           # Edit form
/dashboard/students/new                 # Create form
```

#### Components
- `StudentsList.tsx` - Table with search/filter
- `StudentForm.tsx` - Create/edit form
- `StudentDetail.tsx` - Detail view
- `StudentCard.tsx` - Student summary card

---

### Module 2: **Instructors** (Estimated: 2-3 hours)
**Priority**: HIGH - Required for course management

#### Features
- List instructors
- Create new instructor
- Edit instructor details
- Delete instructor
- Manage branch assignments
- View instructor earnings

#### Database Tables
- `instructors` (name, email, phone)
- `branch_instructors` (branch assignment)
- `instructor_rates` (pricing by dance type)

#### Pages
```
/dashboard/instructors/                 # List
/dashboard/instructors/[id]             # Detail
/dashboard/instructors/[id]/edit        # Edit
/dashboard/instructors/new              # Create
/dashboard/instructors/[id]/earnings    # Earnings view
```

---

### Module 3: **Branches** (Estimated: 2 hours)
**Priority**: HIGH - Organizational structure

#### Features
- List branches
- Create branch
- Edit branch details
- Delete branch
- View branch details
- Manage branch instructors

#### Database Tables
- `branches` (name, address, phone, organization_id)

#### Pages
```
/dashboard/branches/                    # List
/dashboard/branches/[id]                # Detail
/dashboard/branches/[id]/edit           # Edit
/dashboard/branches/new                 # Create
```

---

### Module 4: **Dance Types** (Estimated: 1-2 hours)
**Priority**: MEDIUM - Foundational for courses

#### Features
- List dance types
- Create dance type
- Edit dance type
- Delete dance type

#### Database Tables
- `dance_types` (name, description, organization_id)

#### Pages
```
/dashboard/dance-types/                 # List
/dashboard/dance-types/new              # Create
/dashboard/dance-types/[id]/edit        # Edit
```

---

### Module 5: **Courses** (Estimated: 2-3 hours)
**Priority**: HIGH - Core learning delivery

#### Features
- List courses by branch
- Create course (select branch, dance type, instructor, schedule)
- Edit course details
- Delete course
- View course details
- Manage course instructors

#### Database Tables
- `courses` (name, dance_type, branch, schedule, capacity)
- `course_instructors` (many-to-many)
- `course_sessions` (auto-generated sessions)

#### Pages
```
/dashboard/courses/                     # List
/dashboard/courses/[id]                 # Detail
/dashboard/courses/[id]/edit            # Edit
/dashboard/courses/new                  # Create
/dashboard/courses/[id]/sessions        # Session management
```

---

### Module 6: **Calendar** (Estimated: 2-3 hours)
**Priority**: MEDIUM - Visual scheduling

#### Features
- Monthly/weekly calendar view
- Show all classes
- Click to view class details
- Drag-to-reschedule (optional)
- Color-coded by dance type

#### Database Tables
- Uses `course_sessions` + `courses`

#### Pages
```
/dashboard/calendar/                    # Calendar view
```

---

### Module 7: **Attendance** (Estimated: 2 hours)
**Priority**: MEDIUM - Class management

#### Features
- Mark attendance in class session
- Deduct credits from student packages
- View attendance history
- Record substitutes

#### Database Tables
- `attendances` (student, session, status, credit_used)

#### Pages
```
/dashboard/attendance/                  # List sessions
/dashboard/attendance/[sessionId]       # Mark attendance
```

---

### Module 8: **Packages** (Estimated: 2 hours)
**Priority**: MEDIUM - Revenue model

#### Features
- List packages
- Create package (with pricing and credit count)
- Edit package
- Delete package
- View package details

#### Database Tables
- `packages` (name, credits, price, dance_type, organization_id)
- `student_packages` (enrollment, remaining_credits, expire_date)

#### Pages
```
/dashboard/packages/                    # List
/dashboard/packages/new                 # Create
/dashboard/packages/[id]/edit           # Edit
```

---

### Module 9: **Cash Register** (Estimated: 2-3 hours)
**Priority**: MEDIUM - Financial tracking

#### Features
- Record transactions (sales, refunds, expenses)
- View transaction history
- Filter by type/date
- Daily/monthly summaries
- Reconciliation

#### Database Tables
- `cash_transactions` (type, amount, description, date, user_id)

#### Pages
```
/dashboard/cash-register/              # Transactions list
/dashboard/cash-register/new           # Record transaction
/dashboard/cash-register/report        # Daily/monthly report
```

---

### Module 10: **Instructor Earnings** (Estimated: 2 hours)
**Priority**: LOW - Reporting

#### Features
- View earnings by instructor
- Filter by date range
- View earning breakdown by dance type
- Generate payment reports
- Mark payments as processed

#### Database Tables
- Uses `instructor_rates` + `course_sessions` + `attendances`

#### Pages
```
/dashboard/instructor-earnings/        # List/report
/dashboard/instructor-earnings/[id]    # Instructor detail
```

---

### Module 11: **Settings** (Estimated: 1-2 hours)
**Priority**: MEDIUM - Configuration

#### Features
- View/edit organization info
- Manage payment methods
- Configure notification settings
- View API keys (if applicable)
- Manage user roles in organization
- Delete organization (admin only)

#### Pages
```
/dashboard/settings/                   # Organization settings
/dashboard/settings/team               # Team management
/dashboard/settings/payment            # Payment config
/dashboard/settings/notifications      # Notification settings
```

---

## 🛠 Implementation Pattern

Each module follows this pattern:

### 1. **Folder Structure**
```
app/dashboard/[module]/
├── page.tsx              # List view
├── [id]/
│   ├── page.tsx         # Detail view
│   └── edit/
│       └── page.tsx     # Edit form
└── new/
    └── page.tsx         # Create form

components/
└── [module]/
    ├── [Module]List.tsx   # Table/list component
    ├── [Module]Form.tsx   # Create/edit form
    ├── [Module]Detail.tsx # Detail view
    └── [Module]Card.tsx   # Summary card
```

### 2. **Server Actions**
```
lib/actions/[module].actions.ts

export async function create[Module]()
export async function update[Module]()
export async function delete[Module]()
export async function get[Module]()
export async function get[Module]s()
```

### 3. **Type Safety**
- Use database types from `lib/types/database.types.ts`
- Create form validation schemas with Zod
- Type all server action parameters

### 4. **Components**
- List with search and filter
- Form with validation
- Detail view
- Loading and error states
- Confirmation dialogs for delete

---

## 📊 Tech Stack for Modules

- **State Management**: React hooks + server actions (no external state needed)
- **Forms**: React Hook Form + Zod
- **Tables**: Custom component with pagination
- **Modals/Dialogs**: Custom modal with Tailwind
- **Date Handling**: `date-fns`
- **Icons**: Lucide React
- **CSS**: Tailwind CSS

---

## 🚀 Suggested Implementation Order

1. **Start with Students** (foundational, most used)
2. **Then Instructors** (needed for courses)
3. **Then Branches** (organizational structure)
4. **Then Dance Types** (needed for courses)
5. **Then Courses** (most complex, core feature)
6. **Then Calendar** (visual interface for courses)
7. **Then Attendance** (class operations)
8. **Then Packages** (revenue model)
9. **Then Cash Register** (financial tracking)
10. **Then Instructor Earnings** (reporting)
11. **Finally Settings** (configuration)

---

## ✨ Design Consistency

All modules will use:
- **Colors**: From `config/design-system.ts`
- **Components**: Button, Card, Input from `components/ui/`
- **Layout**: Consistent with dashboard layout
- **Responsive**: Mobile-first design
- **Icons**: Lucide React consistent with Sidebar

---

## 📝 Quality Checklist for Each Module

- ✅ List page with search/filter
- ✅ Create/edit forms with validation
- ✅ Delete with confirmation
- ✅ Loading states
- ✅ Error handling and messages
- ✅ Type-safe operations
- ✅ RLS policies enforced
- ✅ Responsive design
- ✅ Empty states handled
- ✅ Success messages
- ✅ Navigation back to list

---

## 🎯 Ready to Start?

Which module would you like to implement first? I'd recommend starting with **Students** as it's foundational and will give you the pattern for all other modules.

Tell me which one and I'll build a complete, production-ready implementation!
