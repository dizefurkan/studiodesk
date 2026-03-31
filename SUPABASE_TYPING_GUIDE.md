# Supabase TypeScript Typing Guide

## Problem Discovered

Supabase's TypeScript type inference **breaks when using variable table names**:

```typescript
// ❌ DON'T: Type inference fails - returns 'never'
await supabase.from(tableName).select()

// ✅ DO: Type inference works - returns proper types
await supabase.from('attendances').select()
```

## Root Cause

When `.from()` receives a **literal string** (`'attendances'`), TypeScript can statically infer:
- Table structure from Database type
- Row types, Insert types, Update types

When `.from()` receives a **variable** (`tableName`), TypeScript cannot infer the type at compile-time, so it defaults to `never`, breaking all downstream methods.

## Solution: Three Approaches

### Approach 1: Use Literal Table Names (Recommended for Simple Queries)

```typescript
const { data, error } = await supabase
  .from('attendances')  // Literal string = type-safe
  .select()
  .eq('id', attendanceId)
  .maybeSingle()

// data is automatically typed as Attendance | null
data?.studio_id  // ✅ TypeScript knows this field exists
```

### Approach 2: .overrideTypes() Method (For Complex Chains)

```typescript
const result = await supabase
  .from('attendances')
  .insert({
    session_id: sessionId,
    student_id: studentId,
    // ...
  } as any)  // Insert args need 'as any' due to inference issue
  .select()
  .single()
  .overrideTypes<Attendance>()  // Explicitly set return type

const { data, error } = result as { data: Attendance | null; error: any }
// Now data is properly typed
```

### Approach 3: Typed Helper Functions (For Reusable Patterns)

While tempting, generic helper functions with dynamic table names face the same limitation:

```typescript
// ❌ AVOID: This still has type inference issues
function insertRecord<T extends keyof Database['public']['Tables']>(
  table: T,
  data: Database['public']['Tables'][T]['Insert']
) {
  return supabase.from(table).insert(data)  // 'never' type
}
```

**Better**: Create table-specific helpers:

```typescript
// ✅ GOOD: Type-safe and specific
async function insertAttendance(data: Database['public']['Tables']['attendances']['Insert']) {
  return supabase
    .from('attendances')
    .insert(data)
    .select()
    .single()
    .overrideTypes<Attendance>()
}
```

## Best Practices

1. **For Direct Queries**: Use literal table names and let TypeScript infer types
   ```typescript
   await supabase.from('attendances').select()  // ✅ Fully typed
   ```

2. **For Insert/Update chains**: Use `.overrideTypes<T>()` with explicit type casting
3. **For Reusable Code**: Create table-specific action functions instead of generic helpers
4. **Never use generic table name parameters** unless you handle type casting explicitly

## Database Types

Ensure `lib/types/database.types.ts` is up-to-date:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/types/database.types.ts
```

This generates accurate Row, Insert, and Update types for every table.

## See Also

- [Supabase TypeScript Support Docs](https://supabase.com/docs/reference/javascript/typescript-support)
- `.overrideTypes()` method for type overrides
