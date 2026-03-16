# PRODUCTION DEPLOYMENT GUIDE

## Dance Studio Management SaaS - Production Readiness Implementation

---

## PHASE 1: PRE-DEPLOYMENT CHECKLIST

### Database Backup
```bash
# 1. Backup your current Supabase database
# In Supabase console:
# ✓ Database > Backups > Create Manual Backup
# ✓ Wait for backup to complete
# ✓ Note the backup timestamp

# Verify backup exists before proceeding
```

### Code Review
- [ ] Review ARCHITECTURE_AUDIT.md - understand all changes
- [ ] Review PRODUCTION_SCHEMA_ENHANCEMENTS.sql - all SQL
- [ ] Review attendance-production.actions.ts - all TypeScript
- [ ] Review changes in git: `git diff main`

### Testing
- [ ] Run local tests with sample data
- [ ] Test atomic attendance function with concurrent requests
- [ ] Test edge cases (no credits, expired packages, etc.)

---

## PHASE 2: DATABASE MIGRATION

### Step 1: Apply Schema Enhancements (10 minutes)

```sql
-- 1. BACKUP: Create a savepoint in case we need to rollback
BEGIN;

-- 2. Add missing fields to packages
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS validity_days INT DEFAULT 30
CHECK (validity_days > 0);

-- 3. Add computed expire_date to student_packages
ALTER TABLE student_packages
ADD COLUMN IF NOT EXISTS expire_date TIMESTAMPTZ
GENERATED ALWAYS AS (purchase_date + (validity_days || ' days')::INTERVAL) STORED;

-- 4. Add constraints
ALTER TABLE student_packages
ADD CONSTRAINT check_remaining_credits_nonnegative
  CHECK (remaining_credits >= 0);

ALTER TABLE student_packages
ADD CONSTRAINT check_expire_date_valid
  CHECK (expire_date IS NULL OR expire_date > purchase_date);

-- 5. VERIFY: Check constraints were added
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'student_packages';

-- 6. COMMIT if all looks good
COMMIT;
```

**In Supabase Dashboard:**
1. Open SQL Editor
2. Copy-paste the SQL above
3. Click "Run" button
4. Verify success message

### Step 2: Create Atomic Function (5 minutes)

In Supabase SQL Editor, paste the entire `record_attendance_atomic()` function from `PRODUCTION_SCHEMA_ENHANCEMENTS.sql`

```sql
CREATE OR REPLACE FUNCTION record_attendance_atomic(
  p_session_id UUID,
  p_student_id UUID
)
RETURNS jsonb AS $$
-- ... full function body ...
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION record_attendance_atomic(UUID, UUID) TO authenticated;
```

**Verify Success:**
```sql
SELECT proname, pronargs
FROM pg_proc
WHERE proname = 'record_attendance_atomic';
-- Should return: record_attendance_atomic | 2
```

### Step 3: Create Session Generation Function (5 minutes)

Paste the `generate_course_sessions()` function:

```sql
CREATE OR REPLACE FUNCTION generate_course_sessions(
  p_course_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS jsonb AS $$
-- ... full function body ...
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION generate_course_sessions(UUID, DATE, DATE) TO authenticated;
```

### Step 4: Create Analytics Functions (5 minutes)

Paste all the VIEW and FUNCTION definitions from PRODUCTION_SCHEMA_ENHANCEMENTS.sql:
- `get_attendance_summary()`
- Analytics views: `v_student_active_credits`, `v_instructor_earnings_summary`, `v_branch_revenue`

### Step 5: Create Indices (10 minutes)

Run all CREATE INDEX statements from PRODUCTION_SCHEMA_ENHANCEMENTS.sql:

```sql
-- These should all complete without errors
CREATE INDEX IF NOT EXISTS idx_attendances_created_at_desc
ON attendances(created_at DESC)
INCLUDE (session_id, student_id, student_package_id);

-- ... rest of indices ...
```

**Monitor Progress:**
```sql
SELECT schemaname, tableName, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE tablename IN ('attendances', 'instructor_earnings', 'student_packages')
ORDER BY tablename;
```

### Step 6: Validate Migration (5 minutes)

Run validation queries:

```sql
-- 1. Check all functions exist
SELECT proname FROM pg_proc
WHERE proname IN ('record_attendance_atomic', 'generate_course_sessions', 'get_attendance_summary')
ORDER BY proname;
-- Should return 3 rows

-- 2. Check all indices exist
SELECT tablename, indexname FROM pg_stat_user_indexes
WHERE tablename IN ('attendances', 'instructor_earnings', 'student_packages')
ORDER BY tablename, indexname;
-- Should return 8+ rows

-- 3. Check constraints exist
SELECT constraint_name FROM information_schema.table_constraints
WHERE table_name = 'student_packages'
AND constraint_type = 'CHECK';
-- Should return 2 rows

-- 4. Verify no packages missing validity_days
SELECT COUNT(*) AS missing_validity_days FROM packages WHERE validity_days IS NULL;
-- Should return 0
```

---

## PHASE 3: UPDATE NEXT.JS CODE

### Step 1: Replace Attendance Actions File

```bash
# 1. Backup old file
cp lib/actions/attendance.actions.ts lib/actions/attendance.actions.ts.backup

# 2. Either:
# Option A: Update existing file with new implementation from attendance-production.actions.ts
# Option B: Use new file if you're refactoring module names
```

### Step 2: Update Component Imports

If using new file path:
```typescript
// Old:
import { markAttendance } from '@/lib/actions/attendance.actions'

// New:
import { markAttendance } from '@/lib/actions/attendance-production.actions'
```

### Step 3: Update Attendance UI Components

Replace or create these components using the shadcn/ui patterns from ARCHITECTURE_AUDIT.md:

Files to create/update:
- [ ] `/components/attendance/StudentAttendanceTable.tsx`
- [ ] `/components/attendance/AttendanceDialog.tsx`
- [ ] `/app/dashboard/attendance/page.tsx` (update to use new components)

Example usage:
```typescript
'use client'

import { markAttendance } from '@/lib/actions/attendance-production.actions'
import { StudentAttendanceTable } from '@/components/attendance/StudentAttendanceTable'

export default function AttendancePage() {
  return (
    <StudentAttendanceTable
      sessionId={sessionId}
      students={students}
      marked={marked}
      onAttendanceChange={handleRefresh}
    />
  )
}
```

### Step 4: Test Locally

```bash
# 1. Start dev server
npm run dev

# 2. Navigate to attendance page
# 3. Test marking attendance with:
#    - Valid student with credits
#    - Student with no credits (should fail gracefully)
#    - Duplicate attempt (should show already marked)

# 4. Check browser console for errors
# 5. Check server logs for function calls
```

---

## PHASE 4: PRODUCTION DEPLOYMENT

### Step 1: Test on Staging

```bash
# 1. Deploy to staging environment
npm run build  # Verify build succeeds
vercel deploy --prod

# 2. In staging Supabase:
#    - Ensure all functions are deployed
#    - Test with real-world data

# 3. Test scenarios:
#    ✓ Mark attendance 1 student
#    ✓ Mark attendance 10 students bulk
#    ✓ Remove attendance and restore credits
#    ✓ Generate sessions for 2-week period
#    ✓ Check earnings are calculated
```

### Step 2: Production Deployment

```bash
# 1. Final code review
git log --oneline -5
git diff staging...prod

# 2. Update package.json version
# Example: "1.0.0" -> "1.0.1"
npm version patch

# 3. Build and test production build locally
npm run build

# 4. Deploy to production
vercel deploy --prod

# 5. Verify deployment
# - Check Vercel dashboard for successful deployment
# - Run smoke test in production
# - Monitor error tracking service (Sentry, etc.)
```

### Step 3: Production Validation

```bash
# In production Supabase SQL Editor:

-- 1. Test atomic function
SELECT record_attendance_atomic(
  '00000000-0000-0000-0000-000000000001'::UUID,
  '00000000-0000-0000-0000-000000000002'::UUID
);
-- Should return success=false and appropriate error

-- 2. Check function execution permissions
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'record_attendance_atomic';

-- 3. Monitor for slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## PHASE 5: PERFORMANCE OPTIMIZATION

### Monitor Initial Performance

```sql
-- After 1 day in production, check:

-- 1. Most frequently used queries
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat%'
ORDER BY calls DESC
LIMIT 20;

-- 2. Slow queries that need optimization
SELECT query, mean_exec_time, max_exec_time, stddev_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- > 100ms
ORDER BY mean_exec_time DESC
LIMIT 10;

-- 3. Table sizes (identify bloat)
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS bytes
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 4. Index effectiveness
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  ROUND(100 * idx_tup_fetch::NUMERIC / NULLIF(idx_tup_read, 0), 2) AS efficiency
FROM pg_stat_user_indexes
WHERE idx_scan > 0
ORDER BY idx_scan DESC;
```

### Add Missing Indices if Needed

```sql
-- Example: If you find authentication queries are slow
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id
ON profiles(auth_user_id)
WHERE deleted_at IS NULL;

-- Example: If branch lookups are slow
CREATE INDEX IF NOT EXISTS idx_organization_users_organization_branch
ON organization_users(organization_id, created_at DESC);
```

### Consider Materialized Views for Reporting

```sql
-- If attendance reporting is slow, create materialized view
CREATE MATERIALIZED VIEW mv_monthly_attendance_summary AS
SELECT
  DATE_TRUNC('month', a.created_at)::DATE AS month,
  c.id AS course_id,
  c.name AS course_name,
  COUNT(DISTINCT s.id) AS total_sessions,
  COUNT(DISTINCT a.id) AS total_attendance,
  ROUND(COUNT(DISTINCT a.id)::NUMERIC / COUNT(DISTINCT s.id) * 100, 1) AS attendance_rate
FROM courses c
LEFT JOIN course_sessions s ON s.course_id = c.id
LEFT JOIN attendances a ON a.session_id = s.id AND a.deleted_at IS NULL
WHERE a.created_at > NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('month', a.created_at), c.id, c.name;

-- Refresh the materialized view (run nightly via cron job)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_attendance_summary;
```

---

## PHASE 6: MONITORING & MAINTENANCE

### Set Up Error Tracking

```typescript
// In Next.js error handler
import * as Sentry from '@sentry/nextjs'

Sentry.captureException(error, {
  tags: {
    feature: 'attendance',
    action: 'markAttendance',
  },
})
```

### Monitor Database Performance

**Daily Check:**
```bash
# 1. Check replication lag (if using read replicas)
# 2. Monitor connection pool usage
# 3. Check for long-running queries
# 4. Verify backups completed
```

**Weekly Check:**
```bash
# 1. Review slow query logs
# 2. Vacuum analyze to update statistics
# 3. Check index bloat
# 4. Review error logs from Sentry
```

**Monthly Check:**
```bash
# 1. Full table analysis: ANALYZE;
# 2. Index maintenance and cleanup
# 3. Archive old attendance records (optional)
# 4. Performance tuning adjustments
```

### Create Monitoring Dashboard

```sql
-- Attendance monitoring queries
CREATE TEMP VIEW v_attendance_health AS
SELECT
  'Database' AS check_type,
  'Atomic function exists' AS check_name,
  CASE WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'record_attendance_atomic') 
    THEN 'PASS' ELSE 'FAIL' END AS status,
  'record_attendance_atomic should exist in pg_proc' AS details
UNION ALL
SELECT
  'Database',
  'All required indices exist',
  CASE WHEN (SELECT COUNT(*) FROM pg_stat_user_indexes WHERE tablename IN ('attendances', 'instructor_earnings')) >= 8
    THEN 'PASS' ELSE 'FAIL' END,
  'Check indices on performance tables'
UNION ALL
SELECT
  'Data',
  'No packages missing validity_days',
  CASE WHEN (SELECT COUNT(*) FROM packages WHERE validity_days IS NULL) = 0
    THEN 'PASS' ELSE 'FAIL' END,
  'All packages should have validity_days set'
UNION ALL
SELECT
  'Data',
  'No negative credits',
  CASE WHEN (SELECT COUNT(*) FROM student_packages WHERE remaining_credits < 0) = 0
    THEN 'PASS' ELSE 'FAIL' END,
  'CHECK constraint should prevent this'
UNION ALL
SELECT
  'Performance',
  'No slow attendance queries',
  CASE WHEN (SELECT COUNT(*) FROM pg_stat_statements WHERE query LIKE '%attendances%' AND mean_exec_time > 200) = 0
    THEN 'PASS' ELSE 'WARN' END,
  'Check slow query log for attendance operations';

SELECT * FROM v_attendance_health;
```

### Backup & Recovery Procedure

**Daily Automated Backup:**
- Supabase handles this automatically
- Backups available for 7 days

**Manual Backup Before Major Changes:**
```bash
# 1. In Supabase console: Database > Backups > Create Manual Backup
# 2. Note the backup ID and timestamp
# 3. Store backup ID in secure location
```

**Recovery Procedure (if needed):**
```sql
-- Contact Supabase support with:
-- 1. Backup timestamp
-- 2. Reason for recovery
-- 3. Confirmation that this is intentional

-- They will handle the restore process
-- This will rollback all changes since backup time
```

---

## PHASE 7: ROLLBACK PROCEDURE (Emergency Only)

If something goes wrong in production:

### Option 1: Code Rollback (Fast)

```bash
# 1. In Vercel dashboard:
#    - Go to Deployments
#    - Click the previous stable deployment
#    - Click "Promote to Production"
#    - This reverts Next.js code immediately

# 2. This uses the old attendance.actions.ts
#    - Will fall back to non-atomic operations
#    - But will continue working

# 3. To identify the issue:
#    - Check Sentry for error patterns
#    - Check server logs
#    - Database is still safe (no changes)
```

### Option 2: Database Rollback (Caution)

```bash
# 1. Contact Supabase support IMMEDIATELY
# 2. Provide:
#    - Backup timestamp you want to restore to
#    - Explain what went wrong
#    - Confirm you understand what will be lost

# 3. They will restore the database
# 4. This rolls back all changes since that backup
#    - Be prepared to manually reapply safe changes
```

### Option 3: Selective Recovery (Best)

If only specific data is corrupted:

```sql
-- Restore specific attendance records from backup
-- Example: Undo attendance from corruption timestamp
DELETE FROM attendances
WHERE created_at > '2024-01-15 10:30:00'
  AND created_at < '2024-01-15 11:00:00';

-- Restore credits manually if needed
UPDATE student_packages SET remaining_credits = remaining_credits + 1
WHERE id IN (SELECT student_package_id FROM attendances WHERE id = 'xxx');
```

---

## PHASE 8: POST-DEPLOYMENT VALIDATION

### Week 1 Checks

- [ ] Attendance marking works for all scenarios
- [ ] Credits are properly deducted
- [ ] No duplicate attendance records
- [ ] Earnings calculated correctly
- [ ] No error spikes in monitoring
- [ ] Performance acceptable (< 500ms per operation)

### Week 2-4 Checks

- [ ] Run with real user load
- [ ] Monitor for race conditions (none should occur)
- [ ] Archive old test data if needed
- [ ] Gather user feedback
- [ ] Performance stable

### Month 1 Checks

- [ ] All systems stable
- [ ] Database size reasonable
- [ ] No data consistency issues
- [ ] Backup strategy working
- [ ] Ready for full production scale

---

## TROUBLESHOOTING GUIDE

### Issue: Function not found error

```sql
-- Check if function exists
SELECT * FROM information_schema.routines
WHERE routine_name = 'record_attendance_atomic';

-- If missing, recreate it:
-- 1. Go to Supabase SQL Editor
-- 2. Paste the full function definition
-- 3. Click Run
```

### Issue: "Not authenticated" errors

```typescript
// Ensure authentication is working
const user = await getCurrentUser()
console.log('Current user:', user?.id)

// Check auth session
const { data: { session } } = await supabase.auth.getSession()
console.log('Auth session:', session)
```

### Issue: Slow attendance marking

```sql
-- Check index usage
SELECT * FROM pg_stat_user_indexes
WHERE tablename = 'student_packages'
ORDER BY idx_scan DESC;

-- If idx_student_packages_active_credits has 0 scans, index not being used
-- Check query plan:
EXPLAIN ANALYZE
SELECT * FROM student_packages
WHERE student_id = '...'
  AND remaining_credits > 0;
```

### Issue: Credits not being deducted

```sql
-- Check trigger and updates
SELECT * FROM student_packages WHERE id = '...' \gx

-- Verify constraint allows updates
ALTER TABLE student_packages
DROP CONSTRAINT check_remaining_credits_nonnegative;
-- Then recreate if there's an issue

-- Check for deleted_at flag accidentally hiding records
SELECT * FROM student_packages WHERE deleted_at IS NOT NULL;
```

---

## SUPPORT & ESCALATION

If you encounter issues:

1. **Check error logs** - Sentry, Vercel, and Supabase
2. **Review SQL logs** - See what query actually executed
3. **Test in staging** - Reproduce with test data
4. **Contact Supabase support** - For database-level issues
5. **Consult architecture audit** - Review design decisions

---

## SUCCESS CRITERIA

✅ Production deployment is successful when:

- [ ] All SQL functions created and verified
- [ ] All indices created and used (confirmed in pg_stat_user_indexes)
- [ ] Next.js code deployed without errors
- [ ] Attendance interface functional
- [ ] 100+ test attendance records created without errors
- [ ] No negative credits observed
- [ ] Instructor earnings calculated automatically
- [ ] Performance acceptable (< 1 second per operation)
- [ ] Monitoring active (Sentry, query logs, etc.)
- [ ] Backup strategy verified
- [ ] Team trained on new system
- [ ] Documentation updated

---

**Deployment completed on:** _______________

**Deployed by:** _______________

**Verification signed off by:** _______________
