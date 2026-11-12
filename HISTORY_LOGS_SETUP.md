# History Logs Setup Guide

## Overview
The history logs feature provides a comprehensive audit trail for all entity changes (students, courses, instructors, branches, etc.). This document explains how to set up and use the feature.

## What's New

Activity timelines have been added to detail pages:
- **Student Detail Page**: Shows all changes to a student record
- **Course Detail Page**: Shows all changes to a course
- **Instructor Detail Page**: Shows all changes to an instructor
- **Branch Detail Page**: Shows all changes to a branch

## Database Setup Required

The history logs feature requires database schema updates. Follow these steps:

### Step 1: Apply the Migration

Run the Supabase migration to create the `history_logs` table and RLS policies:

```bash
# Using Supabase CLI
supabase migration up

# Or push the schema directly to develop environment
supabase push
```

Alternatively, you can manually run the migration SQL from:
```
supabase/migrations/20261110000000_initial_schema.sql
```

### Step 2: Verify the Migration

Check that the following were created in your Supabase database:

1. **Table**: `history_logs`
   - Columns: id, organization_id, user_id, action, entity, entity_id, data, created_at
   - Indexes on: org_id, user_id, action, entity, entity_id, created_at

2. **RLS Policies**:
   - "Users can read history_logs" - SELECT policy
   - "Service role can insert history_logs" - INSERT policy (for backend)

3. **Row-Level Security**: Enabled on history_logs table

### Step 3: Test the Feature

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to a detail page (e.g., `/dashboard/students/[id]`)

3. Scroll to the bottom to see "Activity Timeline"

4. If the table doesn't exist yet, you'll see console logs guiding you to run the migration

## Architecture

### Database Schema (`history_logs` table)
- **id**: UUID primary key
- **organization_id**: Foreign key to organizations (enables RLS)
- **user_id**: Which user made the change
- **action**: Type of action (create, update, delete, etc.)
- **entity**: Entity type (student, course, instructor, etc.)
- **entity_id**: Which entity was changed
- **data**: JSONB containing change details
- **created_at**: When the change was made

### Query Functions (`lib/actions/history.actions.ts`)
1. **getHistoryLogs(limit)**: Organization-wide history
2. **getEntityHistory(entity, entityId, limit)**: Entity-specific history
3. **getHistoryByEntity(entity, limit)**: Filter by entity type

### React Component (`components/history/HistoryComponent.tsx`)
- Displays activity timeline
- Color-coded entity badges
- Action emojis  
- Responsive layout
- Full i18n support

## Error Handling

If you see errors about missing history logs:

**Error**: "[Get Entity History Error] code: 42P01 - relation 'history_logs' does not exist"
**Solution**: Run the migration: `supabase push` or manually run the SQL migration

**Error**: "[Get Entity History] RLS policy violation"
**Solution**: Check that RLS policies are correctly applied to the history_logs table

**Error**: Empty timeline shows but no history
**Solution**: History logs are only created when code explicitly logs actions (feature in progress)

## Next Steps

### Create History Log Entries
To make the audit trail functional, you need to add logging calls when entities change:

```typescript
// Example: When creating a student
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key, { auth: { persistSession: false } })

// After student is created
await supabase.from('history_logs').insert({
  organization_id: organizationId,
  user_id: userId,
  action: 'create',
  entity: 'student',
  entity_id: studentId,
  data: { name: studentName, email: studentEmail }
})
```

### Locations to Add Logging
- Student create/update/delete actions
- Course create/update/delete actions
- Instructor create/update/delete actions
- Attendance mark/unmark actions
- Package purchase/cancel actions

## File Locations

- Migration: `supabase/migrations/20261110000000_initial_schema.sql`
- Actions: `lib/actions/history.actions.ts`
- Component: `components/history/HistoryComponent.tsx`
- Utilities: `lib/utils/history.ts`
- Detail Pages:
  - `app/[locale]/dashboard/students/[id]/page.tsx`
  - `app/[locale]/dashboard/courses/[id]/page.tsx`
  - `app/[locale]/dashboard/instructors/[id]/page.tsx`
  - `app/[locale]/dashboard/branches/[id]/edit/page.tsx`

## Internationalization

History messages are fully translated. Add translations for new action types in:
- `messages/en.json` - English translations
- `messages/tr.json` - Turkish translations

## Debugging

Check the browser console and server logs for these debug messages:
- `[Get Entity History] Starting with:` - Shows parameters
- `[Get Entity History] Organization:` - Shows organization ID
- `[Get History Logs] Response received` - Shows if data was fetched
- `[Get Entity History Error]` - Shows any database errors

## Performance Notes

- Queries are indexed on: organization_id, user_id, entity, created_at
- Limit default is 20 items (configurable)
- RLS already filters by organization, so performance scales well with multi-tenancy
