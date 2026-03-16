# PRODUCTION DEPLOYMENT CHECKLIST

## Quick Reference Guide for Implementation

---

## PRE-DEPLOYMENT PHASE

### Database Preparation
- [ ] Database backup created and verified
  - Location: Supabase > Database > Backups
  - Status: _______________
  - Timestamp: _______________
- [ ] Backup can be restored (test procedure documented)
- [ ] All team members notified of deployment window

### Code Review
- [ ] ARCHITECTURE_AUDIT.md reviewed by tech lead
- [ ] PRODUCTION_SCHEMA_ENHANCEMENTS.sql reviewed for syntax
- [ ] attendance-production.actions.ts reviewed for correctness
- [ ] All changes committed to git
  - [ ] Create feature branch: `git checkout -b feat/atomic-attendance`
  - [ ] Commit changes: `git commit -m "Production-ready attendance implementation"`
  - [ ] Push to remote: `git push origin feat/atomic-attendance`

### Testing Environment
- [ ] Staging environment available and clean
- [ ] Test database with sample data created
- [ ] All team members with database access notified

---

## PHASE 1: DATABASE MIGRATION (30 minutes)

### Add Schema Fields
- [ ] Run schema enhancement SQL
  ```sql
  ALTER TABLE packages ADD COLUMN IF NOT EXISTS validity_days INT DEFAULT 30;
  ALTER TABLE student_packages ADD COLUMN IF NOT EXISTS expire_date TIMESTAMPTZ GENERATED ...;
  ```
- [ ] Verify commands completed without error
- [ ] Check constraint creation:
  ```sql
  SELECT constraint_name FROM information_schema.table_constraints 
  WHERE table_name = 'student_packages';
  ```

### Create Atomic Function
- [ ] Copy `record_attendance_atomic()` function
- [ ] Paste into Supabase SQL Editor
- [ ] Click "Run" button
- [ ] Verify success message
- [ ] Test function works:
  ```sql
  SELECT record_attendance_atomic(
    '00000000-0000-0000-0000-000000000001'::UUID,
    '00000000-0000-0000-0000-000000000002'::UUID
  );
  ```

### Create Session Generator Function
- [ ] Copy `generate_course_sessions()` function
- [ ] Paste and run in SQL Editor
- [ ] Verify function created successfully

### Create Analytics Functions
- [ ] Copy `get_attendance_summary()` function
- [ ] Paste and run
- [ ] Copy all VIEW definitions:
  - [ ] `v_student_active_credits`
  - [ ] `v_instructor_earnings_summary`
  - [ ] `v_branch_revenue`
- [ ] Paste and run each

### Create Performance Indices
- [ ] Run all CREATE INDEX statements
- [ ] Monitor for completion (watch execution time)
- [ ] Verify all indices created:
  ```sql
  SELECT tablename, indexname FROM pg_stat_user_indexes 
  WHERE tablename IN ('attendances', 'instructor_earnings', 'student_packages')
  ORDER BY tablename;
  ```
  - Expected count: 8+

### Database Validation
- [ ] Run validation queries:
  ```sql
  -- Check functions exist
  SELECT proname FROM pg_proc 
  WHERE proname IN ('record_attendance_atomic', 'generate_course_sessions')
  ORDER BY proname;
  
  -- Check indices exist
  SELECT COUNT(*) AS index_count FROM pg_stat_user_indexes 
  WHERE tablename IN ('attendances', 'instructor_earnings', 'student_packages');
  
  -- Check constraints
  SELECT COUNT(*) AS constraint_count FROM information_schema.table_constraints 
  WHERE table_name = 'student_packages' AND constraint_type = 'CHECK';
  ```
- [ ] All validation queries pass
- [ ] Document results:
  - Functions found: _____
  - Indices found: _____
  - Constraints found: _____

---

## PHASE 2: NEXT.JS CODE UPDATE (30 minutes)

### Backup Current Code
- [ ] Backup current attendance.actions.ts:
  ```bash
  cp lib/actions/attendance.actions.ts lib/actions/attendance.actions.ts.backup
  ```
- [ ] Backup components directory:
  ```bash
  cp -R components/attendance components/attendance.backup
  ```

### Update server actions
- [ ] Replace content of `lib/actions/attendance.actions.ts`
- [ ] Copy from `attendance-production.actions.ts`
- [ ] Run TypeScript check: `npm run build`
  - [ ] No TypeScript errors
  - [ ] All types resolve correctly

### Create UI Components
- [ ] Create `/components/attendance/StudentAttendanceTable.tsx`
  - [ ] Copy from ARCHITECTURE_AUDIT.md
  - [ ] Verify imports all exist
  - [ ] Run TypeScript check
- [ ] Create `/components/attendance/AttendanceDialog.tsx`
  - [ ] Copy from ARCHITECTURE_AUDIT.md
  - [ ] Verify imports all exist
  - [ ] Run TypeScript check

### Update Attendance Page
- [ ] Update `/app/dashboard/attendance/page.tsx`
  - [ ] Import new components
  - [ ] Integrate StudentAttendanceTable
  - [ ] Test page renders
- [ ] Check all imports are correct
  - [ ] No red squiggles in editor
- [ ] Run build: `npm run build`
  - [ ] Build succeeds without errors

### Code Validation
- [ ] Run linter: `npm run lint`
  - [ ] No critical errors
  - [ ] Any warnings are addressed
- [ ] Run type check: `npm run type-check`
  - [ ] All types valid
  - [ ] No implicit any types

---

## PHASE 3: LOCAL TESTING (30 minutes)

### Dev Environment Setup
- [ ] Start dev server: `npm run dev`
  - [ ] No build errors
  - [ ] Hot reload working
- [ ] Open browser to localhost:3000
  - [ ] No console errors
  - [ ] No red error boundaries

### Manual Testing
- [ ] Navigate to attendance page
  - [ ] Page loads without errors
  - [ ] Table displays students correctly
- [ ] Test marking attendance
  - [ ] Button click triggers action
  - [ ] Loading state shows
  - [ ] Success message displays
  - [ ] Table updates
- [ ] Test error scenarios
  - [ ] Student with no credits shows error
  - [ ] Duplicate attendance shows error
  - [ ] Non-existent student shows error
- [ ] Test remove attendance
  - [ ] Remove button appears
  - [ ] Confirmation dialog shows
  - [ ] Record removed on confirm
  - [ ] Credits restored

### Browser Console Check
- [ ] Open DevTools console (F12)
- [ ] No red error messages
- [ ] No TypeScript warnings
- [ ] All API calls succeed (200/201 status)

### Database Verification
- [ ] Check if test records created:
  ```sql
  SELECT COUNT(*) FROM attendances WHERE created_at > NOW() - INTERVAL '10 minutes';
  ```
- [ ] Verify credits deducted:
  ```sql
  SELECT remaining_credits FROM student_packages 
  WHERE id IN (SELECT student_package_id FROM attendances WHERE created_at > NOW() - INTERVAL '10 minutes');
  ```

---

## PHASE 4: STAGING DEPLOYMENT (1 hour)

### Deploy to Staging
- [ ] Commit all changes:
  ```bash
  git add .
  git commit -m "Atomic attendance implementation with production SQL"
  git push origin feat/atomic-attendance
  ```
- [ ] Create pull request on GitHub
- [ ] Request code review (at least 1 approval)
- [ ] Deploy to staging environment:
  ```bash
  vercel deploy --env staging
  ```
- [ ] Wait for deployment to complete
- [ ] Get staging URL from Vercel

### Staging Testing
- [ ] Open staging environment
- [ ] Verify all pages load
- [ ] Test attendance marking with real-like data:
  - [ ] 5 students marking - should succeed
  - [ ] 10th student (no credits) - should fail gracefully
  - [ ] Duplicate attendance - should fail with specific message
- [ ] Test bulk operations:
  - [ ] Mark 10 students at once
  - [ ] All succeed without partial failures

### Staging Database Checks
```sql
-- Check no corruption
SELECT COUNT(*) AS duplicate_attendance 
FROM attendances 
WHERE deleted_at IS NULL 
GROUP BY session_id, student_id 
HAVING COUNT(*) > 1;
-- Should return 0 rows

-- Check no negative credits
SELECT COUNT(*) 
FROM student_packages 
WHERE remaining_credits < 0;
-- Should return 0

-- Check performance
SELECT COUNT(*) AS function_calls 
FROM pg_stat_statements 
WHERE query LIKE '%record_attendance_atomic%';
-- Should be > 5 (you tested multiple times)
```

### Staging Approval
- [ ] Tech lead approves changes
- [ ] QA confirms no issues
- [ ] Product owner validates functionality
- [ ] All team members sign off

---

## PHASE 5: PRODUCTION DEPLOYMENT (30 minutes)

### Pre-Production
- [ ] Set deployment window (off-peak hours)
  - Date/Time: _______________
  - Expected duration: 15 minutes
  - Stakeholders notified: _______________
- [ ] Final backup confirmed:
  - [ ] Fresh backup created
  - [ ] Timestamp: _______________
  - [ ] Backup ID: _______________

### Deploy to Production
- [ ] Merge feature branch to main:
  ```bash
  git checkout main
  git pull origin main
  git merge feat/atomic-attendance
  git push origin main
  ```
- [ ] Trigger production deployment:
  ```bash
  vercel deploy --prod
  ```
- [ ] Monitor deployment progress
  - [ ] Build starts
  - [ ] Build completes
  - [ ] Deployment begins
  - [ ] Deployment completes
  - [ ] Production URL reachable

### Post-Deployment Verification
- [ ] Open production application
- [ ] Navigation works, no errors
- [ ] Attendance page loads correctly
- [ ] Can mark attendance without errors
- [ ] Database functions work:
  ```sql
  SELECT COUNT(*) FROM pg_proc 
  WHERE proname = 'record_attendance_atomic';
  -- Should return 1
  ```

### Production Smoke Tests
- [ ] Create test attendance record
- [ ] Verify credit deducted
- [ ] Verify earnings created
- [ ] Remove attendance record
- [ ] Verify credit restored
- [ ] Check performance is acceptable:
  - [ ] < 500ms per operation
  - [ ] < 200ms average

### Team Communication
- [ ] Announce deployment successful to team
- [ ] Share production URL
- [ ] Share any important notes
- [ ] Ask for feedback if issues found

---

## PHASE 6: MONITORING (Week 1)

### Daily Checks
**Monday through Friday (10 minutes each morning)**

- [ ] Check error tracking (Sentry/Vercel):
  ```
  Errors in last 24h: _________
  Critical errors: _________
  ```
- [ ] Check database health:
  ```sql
  SELECT COUNT(*) FROM pg_stat_statements 
  WHERE mean_exec_time > 500;
  ```
  - [ ] Should be minimal (0-1)
- [ ] Check application performance:
  - [ ] Vercel analytics
  - [ ] Average response time: _________ ms
  - [ ] Error rate: _________ %

### Weekly Comprehensive Check (Friday - 30 minutes)

**Week 1 - Friday**
- [ ] Review all errors from the week
  - [ ] No critical errors
  - [ ] All errors responded to
- [ ] Check data integrity:
  ```sql
  SELECT COUNT(*) FROM student_packages WHERE remaining_credits < 0;
  -- Must be 0
  
  SELECT COUNT(*) FROM attendances 
  WHERE deleted_at IS NULL 
  GROUP BY session_id, student_id 
  HAVING COUNT(*) > 1;
  -- Must be 0
  ```
- [ ] Performance trending:
  - [ ] Response times stable or improving
  - [ ] Database CPU < 50%
  - [ ] Connection pool healthy
- [ ] User feedback:
  - [ ] Any complaints or issues: _______________
  - [ ] Any feature requests: _______________

---

## PHASE 7: FINAL VALIDATION (Week 2-4)

### Real World Usage
- [ ] Week 2: 
  - [ ] 50+ attendance records created
  - [ ] Credits deducted correctly
  - [ ] Earnings calculated
  - [ ] No errors observed
  
- [ ] Week 3:
  - [ ] 200+ attendance records created
  - [ ] Test bulk operations with 20+ at once
  - [ ] Generate sessions for 2 weeks
  - [ ] Generate attendance reports
  
- [ ] Week 4:
  - [ ] Full month of usage
  - [ ] All features used as expected
  - [ ] Performance stable
  - [ ] Ready for scaling

### Success Criteria Met?
- [ ] ✅ All SQL functions working
- [ ] ✅ All indices created and used
- [ ] ✅ Next.js code deployed
- [ ] ✅ Attendance interface functional
- [ ] ✅ 100+ test records without errors
- [ ] ✅ No negative credits observed
- [ ] ✅ Earnings auto-calculating
- [ ] ✅ Performance < 1 second
- [ ] ✅ Monitoring active
- [ ] ✅ Team trained
- [ ] ✅ Backup strategy verified

---

## ROLLBACK PROCEDURES (If Needed)

### Immediate Rollback (Code Only - 5 minutes)
```bash
# Return to previous Vercel deployment
vercel deploy --prod  # Automatically redeploys previous version

# Or manually in Vercel dashboard:
# Deployments > Choose previous production deployment > Promote to Production
```

### Database Rollback (Contact Supabase - 1-24 hours)
```
1. In Supabase console: Database > Backups
2. Find backup timestamp before deployment
3. Click "Restore from backup"
4. Confirm you understand data loss
5. Wait for restore to complete
```

### Selective Recovery (Manual - Case by case)
```sql
-- Example: Remove corrupted attendance records
DELETE FROM attendances
WHERE created_at > '2024-01-15 10:30:00'
  AND session_id = '...specific session...';

-- Restore credits manually if needed
UPDATE student_packages
SET remaining_credits = remaining_credits + 1
WHERE id IN (
  SELECT student_package_id FROM attendances 
  WHERE id = '...'
);
```

---

## POST-DEPLOYMENT DOCUMENTATION

### Deployment Record
```
Deployment Date: _______________
Deployed By: _______________
Approved By: _______________
Deployment Duration: _______________
Rollback Used: YES / NO
Issues Encountered: _______________
Time to Resolution: _______________
```

### Performance Baseline (Post-Deployment)
```
Attendance Marking P50: _________ ms
Attendance Marking P95: _________ ms
Database CPU (peak): _________ %
Error Rate: _________ %
Users Impacted by Issues: _________
```

### Sign-Off
```
✓ Deployment successful: _______________ (Tech Lead)
✓ QA verified: _______________ (QA Engineer)
✓ Product approved: _______________ (Product Owner)
✓ Operations accepted: _______________ (DevOps)

Date: _______________
```

---

## TROUBLESHOOTING QUICK REFERENCE

| Problem | Solution | Time |
|---------|----------|------|
| Function not found | Check pg_proc table, recreate if missing | 10 min |
| Slow attendance marking | Check index usage with EXPLAIN ANALYZE | 15 min |
| "Not authenticated" errors | Verify auth session, check token expiry | 10 min |
| Credits not updating | Check constraints, verify trigger execution | 20 min |
| Duplicate attendance | Check UNIQUE index, verify transaction | 15 min |
| SyntaxError in SQL | Copy-paste carefully, check pg_stat_statements | 10 min |

---

## EMERGENCY CONTACTS

**In Case of Critical Issue:**

1. **Database Issue**: Supabase Support (support@supabase.io)
2. **Deployment Issue**: Vercel Support (support@vercel.com)
3. **Code Issue**: Tech Lead (_______________@example.com)
4. **Emergency Rollback**: DevOps Lead (_______________@example.com)

**Escalation Path:**
- First: Try solution in troubleshooting guide
- Second: Contact technical lead
- Third: Page on-call (if critical)
- Last: Activate rollback plan

---

**Checklist Version:** 1.0
**Last Updated:** 2024
**Status:** ✅ READY TO USE

Print this page for during deployment!
