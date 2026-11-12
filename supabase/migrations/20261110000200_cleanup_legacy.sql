-- =====================================================================
-- Cleanup of objects the old scripts may have left in production.
-- No-op on a fresh project; useful after a dump/restore of the old DB.
-- =====================================================================

-- btree on free-text notes: breaks inserts once a note exceeds ~2.7KB, never queried
DROP INDEX IF EXISTS public.idx_attendances_notes;
DROP INDEX IF EXISTS public.idx_course_sessions_notes;

-- duplicate of the UNIQUE(token) index
DROP INDEX IF EXISTS public.idx_invitations_token;

-- From database/PRODUCTION_SCHEMA_ENHANCEMENTS.sql — unused by the app and
-- broken (reference price_per_class / deleted_at / transaction_type columns
-- that don't exist).
DROP TRIGGER  IF EXISTS trg_attendance_payment ON public.attendances;
DROP FUNCTION IF EXISTS public.handle_attendance_payment();
DROP FUNCTION IF EXISTS public.record_attendance_atomic(UUID, UUID);
DROP FUNCTION IF EXISTS public.generate_course_sessions(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS public.get_attendance_summary(DATE, DATE, UUID);
DROP VIEW     IF EXISTS public.v_student_active_credits;
DROP VIEW     IF EXISTS public.v_instructor_earnings_summary;
DROP VIEW     IF EXISTS public.v_branch_revenue;
