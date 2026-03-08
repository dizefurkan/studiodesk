# 🛠️ Developer Quick Reference

## How Everything Works Together

### 1️⃣ Authentication Flow

```
User visits /login
    ↓
Types email + password
    ↓
Submits form → lib/actions/auth.actions.ts → login()
    ↓
Supabase verifies credentials
    ↓
Check if user has organization (organization_users table)
    ↓
If has org: Set cookie + redirect /dashboard
If no org: Redirect /onboarding
```

### 2️⃣ Onboarding Flow

```
User on /onboarding
    ↓
Types organization name + branch name
    ↓
Submits → createOrganizationWithBranch()
    ↓
Create organizations record
    ↓
Create organization_users record (role=owner)
    ↓
Create branches record
    ↓
Set organization_id cookie
    ↓
Redirect /dashboard
```

### 3️⃣ Data Access Pattern

```
User makes request on page
    ↓
Middleware checks auth (middleware.ts)
    ↓
Server Action/Component queries database
    ↓
RLS Policy checks: Does user belong to organization?
    ↓
RLS Policy checks: Does organization own this data?
    ↓
If both ✅: Return data
If either ❌: Return empty (no error, for security)
```

### 4️⃣ Creating a New Feature

Example: Adding "Create Student" button

```typescript
// 1. Create server action (lib/actions/students.actions.ts)
'use server'
export async function createStudent(data) {
  // Admin client validates ownership
  // Insert to students table
  // RLS enforces organization isolation
}

// 2. Use in component
import { createStudent } from '@/lib/actions/students.actions'

export function CreateStudentButton() {
  return (
    <form action={createStudent}>
      <input name="firstName" />
      <button type="submit">Create</button>
    </form>
  )
}

// 3. Automatic protection
// ✅ RLS policy ensures user can only create in their org
// ✅ No API code needed
// ✅ Type-safe end-to-end
```

---

## Key Patterns Used

### Pattern 1: Server Actions
For mutations (create, update, delete):

```typescript
'use server'
export async function doSomething(data) {
  const supabase = await createServerSupabaseClient()
  // Use supabase client here
  return result
}
```

### Pattern 2: Organization Scoping
All queries filtered by organization:

```typescript
const { data } = await supabase
  .from('students')
  .select('*')
  .eq('organization_id', currentOrgId) // Always include this
```

### Pattern 3: RLS Enforcement
Even if query doesn't filter by org_id, RLS blocks it:

```sql
CREATE POLICY "Users can read students"
ON students FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_users 
    WHERE user_id = auth.uid()
  )
);
```

### Pattern 4: Type Safety
Database types auto-imported:

```typescript
import type { Database } from '@/lib/types/database.types'

// Use types from database schema
type Student = Database['public']['Tables']['students']['Row']
```

---

## File Structure Navigation

### Need to... | Go to...
|---|---|
| Change authentication | `lib/auth/` or `lib/actions/auth.actions.ts` |
| Add new server action | `lib/actions/[feature].actions.ts` |
| Create a form | Use `react-hook-form` + `zod` validators |
| Access database | Use `supabase` client (auto-scoped by RLS) |
| Add new route | Create folder in `app/(dashboard)/[feature]/` |
| Use colors | Import from `config/design-system.ts` |
| Format dates | Import from `lib/utils/date.ts` |
| Format currency | Import from `lib/utils/format.ts` |
| Add validation | Use pre-made schemas from `lib/utils/validators.ts` |

---

## Common Code Snippets

### Get Current User
```typescript
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

const user = await getCurrentUser()
```

### Get Organization Context
```typescript
import { getOrganization } from '@/lib/auth/getOrganization'

const org = await getOrganization()
```

### Query Data (Server Component)
```typescript
const supabase = await createServerSupabaseClient()
const { data: students } = await supabase
  .from('students')
  .select('*')
  .eq('organization_id', org.id)
```

### Call Server Action (Client Component)
```typescript
import { createStudent } from '@/lib/actions/students.actions'

<form action={createStudent}>
  <input name="firstName" required />
  <button type="submit">Create</button>
</form>
```

### Format Currency
```typescript
import { formatCurrency } from '@/lib/utils/format'

const price = formatCurrency(2000) // R$ 2.000,00
```

### Merge Classes
```typescript
import { cn } from '@/lib/utils/cn'

<div className={cn('base-class', isActive && 'active-class')}>
```

---

## Database Query Examples

### Get All Students in Organization
```typescript
const { data } = await supabase
  .from('students')
  .select('*')
  .eq('organization_id', orgId)
```

### Get Student with Packages
```typescript
const { data } = await supabase
  .from('students')
  .select(`
    *,
    student_packages (
      *,
      packages (*)
    )
  `)
  .eq('id', studentId)
  .single()
```

### Get Courses with Instructors
```typescript
const { data } = await supabase
  .from('courses')
  .select(`
    *,
    dance_types (name),
    course_instructors (
      instructors (first_name, last_name)
    )
  `)
  .eq('branch_id', branchId)
```

---

## Using shadcn/ui Components

After running `npx shadcn-ui@latest init`, use like:

```typescript
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export function Example() {
  return (
    <Card>
      <Input placeholder="Enter name" />
      <Button>Submit</Button>
    </Card>
  )
}
```

---

## Testing

### Test Auth Flow
1. Create account via /register
2. Should create user + profile + organization
3. Should redirect to dashboard
4. Organization cookie should be set

### Test RLS
1. Login as user A
2. Try to access user B's data via Supabase client
3. Should return empty (no error, for security)

### Test Server Actions
1. Call server action from any page
2. Should automatically validate organization access
3. If unauthorized, should fail gracefully

---

## Debugging Tips

### Check Auth State
```typescript
const { data: { user } } = await supabase.auth.getUser()
console.log('Current user:', user)
```

### Check Organization Context
```typescript
const org = await getOrganization()
console.log('Current org:', org)
```

### Check RLS is Working
1. Open Supabase Studio
2. Click "Auth" → "Users"
3. Use "User" dropdown to simulate different users
4. Query data - should see only their org's data

### Check Server Action
1. Add console.logs
2. Check terminal output when running `npm run dev`
3. Form actions show errors in browser

---

## Performance Tips

1. **Use indexes** - Already created on common columns
2. **Paginate large datasets** - Use `.range()` in Supabase queries
3. **Cache organization context** - Set in cookie
4. **Use React.lazy()** - For heavy components
5. **Revalidate smart** - Use next tags for ISR

---

## Security Checklist

- ✅ RLS policies enabled on all tables
- ✅ Organization isolation enforced
- ✅ Service role key never exposed to frontend
- ✅ Middleware protects routes
- ✅ Server actions validate org ownership
- ✅ Never trust client-provided org_id
- ✅ Always query through Supabase client
- ✅ CORS configured correctly

---

## Environment Variables

```env
# Public (safe to expose)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL

# Secret (never expose)
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
```

Never import secret vars in client components!

---

## Useful Commands

```bash
# Development
npm run dev          # Start dev server

# Build & Test
npm run build        # Build for production
npm run lint         # Run ESLint

# Supabase CLI (optional)
supabase login       # Login to Supabase
supabase link        # Link to project
supabase db pull     # Pull latest schema
```

---

## Common Error Solutions

| Error | Solution |
|-------|----------|
| "RLS policy prevents access" | User doesn't have access - check organization |
| "Anon key not working" | Check it's the public key, not service role |
| "Can't connect to Supabase" | Check `.env.local` URL is correct |
| "Organization context lost" | Cookie expired - user needs to login again |
| "Type errors in database query" | Regenerate types from `database.types.ts` |

---

## Next: Phase 2 Preview

Coming next: Auth pages with beautiful UI
- `/login` - Login form
- `/register` - Signup form
- `/onboarding` - Create org + branch
- All with shadcn/ui components
- Error handling & loading states
- Validation with Zod

---

Happy coding! 🚀
