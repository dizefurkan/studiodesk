# Supabase Action Functions - Type Safety Rules

## Rule 1: ALL select() queries MUST use .overrideTypes<T>()

**❌ WRONG - No type safety:**
```typescript
export async function getSessionAttendances(sessionId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('attendances')
    .select('*, students(...)')
    .eq('session_id', sessionId)
  
  // data type = never[] ❌ TypeScript can't help if field changes
  return { data }
}
```

**✅ CORRECT - Full type safety:**
```typescript
export async function getSessionAttendances(sessionId: string) {
  const supabase = await createServerSupabaseClient()
  
  type AttendanceWithRelations = Attendance & {
    students: { first_name: string | null; last_name: string | null } | null
    student_packages: { remaining_credits: number } | null
  }
  
  const result = await supabase
    .from('attendances')
    .select('*, students(first_name, last_name), student_packages(remaining_credits)')
    .eq('session_id', sessionId)
    .overrideTypes<AttendanceWithRelations[]>()
  
  const { data, error } = result as { 
    data: AttendanceWithRelations[] | null
    error: any 
  }
  
  // Now data is properly typed - TypeScript catches field changes!
  return { data }
}
```

## Rule 2: ALL insert/update chains MUST use .overrideTypes<T>()

**Insert with .select().single():**
```typescript
const result = await supabase
  .from('attendances')
  .insert({...} as any)
  .select()
  .single()
  .overrideTypes<Attendance>()

const { data, error } = result as { 
  data: Attendance | null
  error: any 
}
```

## Rule 3: Define types at function level

For complex joins, define the return type explicitly:

```typescript
// At top of function or file
type AttendanceQueryResult = Database['public']['Tables']['attendances']['Row'] & {
  students: {
    first_name: string | null
    last_name: string | null
  } | null
  student_packages: {
    remaining_credits: number
  } | null
}

// Then use that type
.overrideTypes<AttendanceQueryResult[]>()
```

## Rule 4: Return type MUST be explicit

**❌ WRONG:**
```typescript
export async function getAttendances() {
  return { data }  // No type annotation on return
}
```

**✅ CORRECT:**
```typescript
export async function getAttendances(): Promise<{ 
  data: AttendanceQueryResult[] | null
  error?: string
}> {
  return { data }
}
```

## Rule 5: Never trust implicit inference from Supabase

Even with literal table names, complex queries can break type inference. **ALWAYS explicit:**

```typescript
// ✅ GOOD - Even though table name is literal
const { data } = await supabase
  .from('attendances')  // Literal
  .select()
  .eq('id', id)
  .maybeSingle()
  .overrideTypes<Attendance>()  // Still explicit!
```

## Implementation Checklist

For EVERY action function:

- [ ] All `.select()` calls have `.overrideTypes<T>()`
- [ ] All `.insert().select()` chains have `.overrideTypes<T>()`
- [ ] All `.update().select()` chains have `.overrideTypes<T>()`
- [ ] Return type is explicitly typed with `Promise<{ data: ..., error?: ... }>`
- [ ] Complex joins have named types (not inline types)
- [ ] No `any` types in return value structure (except error object)
- [ ] Built successfully: `npm run build`

## Files to Update

Priority order:

1. ✅ `/lib/actions/attendance.actions.ts` - IN PROGRESS
2. `/lib/actions/courses.actions.ts` - TODO
3. `/lib/actions/cash-register.actions.ts` - TODO
4. `/lib/actions/invitations.actions.ts` - TODO
5. `/lib/actions/branches.actions.ts` - TODO
6. `/lib/actions/dance-types.actions.ts` - TODO

## Why This Matters

**Before (Unsafe):**
- Developer changes: `students: { first_name, last_name, email }`
- Page code does: `student.first_name` ✅ still works
- But now: `student.email` should exist but TypeScript doesn't know → **Runtime error**

**After (Safe):**
- Developer changes schema → TypeScript type needs update
- `overrideTypes<T>()` type definition must match actual query
- Page code mismatch → **Compile-time error caught** ✅

## Examples

### Simple Select
```typescript
const { data, error } = await supabase
  .from('courses')
  .select()
  .eq('id', courseId)
  .maybeSingle()
  .overrideTypes<Course>()
// data is Course | null
```

### With Relationships
```typescript
type StudentWithPackages = Student & {
  student_packages: (StudentPackage & { packages: Package | null })[] | null
}

const { data } = await supabase
  .from('students')
  .select('*, student_packages(*, packages(*))')
  .overrideTypes<StudentWithPackages[]>()
// data is StudentWithPackages[]
```

### Complex Join with Filter
```typescript
type CourseInstructorView = Database['public']['Tables']['course_instructors']['Row'] & {
  instructors: Database['public']['Tables']['instructors']['Row'] | null
}

const result = await supabase
  .from('course_instructors')
  .select('*, instructors(*)')
  .eq('course_id', courseId)
  .overrideTypes<CourseInstructorView[]>()
```
