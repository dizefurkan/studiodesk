-- =====================================================================
-- StudioDesk — Row Level Security (fresh project)
-- ---------------------------------------------------------------------
-- Replaces database/rls-policies.sql, the RLS part of
-- database/PRODUCTION_SCHEMA_ENHANCEMENTS.sql, database/invitations.sql
-- and supabase/migrations/20260419_add_history_logs_table.sql.
--
-- Notes
-- * Server code that uses the service-role client (createAdminClient)
--   bypasses RLS; these policies cover the user-session client.
-- * Membership checks go through SECURITY DEFINER helpers so policies
--   don't recurse into organization_users RLS and stay fast.
-- * Safe to re-run: every policy is dropped before being created.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_org_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.user_org_ids_with_role(roles TEXT[])
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT organization_id FROM public.organization_users
  WHERE user_id = auth.uid() AND role = ANY (roles);
$$;

CREATE OR REPLACE FUNCTION public.branch_org_id(p_branch_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT organization_id FROM public.branches WHERE id = p_branch_id;
$$;

CREATE OR REPLACE FUNCTION public.course_org_id(p_course_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT b.organization_id
  FROM public.courses c JOIN public.branches b ON b.id = c.branch_id
  WHERE c.id = p_course_id;
$$;

CREATE OR REPLACE FUNCTION public.session_org_id(p_session_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT b.organization_id
  FROM public.course_sessions s
  JOIN public.courses c  ON c.id = s.course_id
  JOIN public.branches b ON b.id = c.branch_id
  WHERE s.id = p_session_id;
$$;

CREATE OR REPLACE FUNCTION public.instructor_org_id(p_instructor_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT organization_id FROM public.instructors WHERE id = p_instructor_id;
$$;

CREATE OR REPLACE FUNCTION public.student_org_id(p_student_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT organization_id FROM public.students WHERE id = p_student_id;
$$;

-- user ids of everyone sharing an organization with the current user
CREATE OR REPLACE FUNCTION public.user_co_member_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT ou.user_id FROM public.organization_users ou
  WHERE ou.organization_id IN (
    SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()
  );
$$;

-- Old unused helper from rls-policies.sql (kept for compatibility)
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid() LIMIT 1;
$$;

REVOKE ALL ON FUNCTION
  public.user_org_ids(), public.user_org_ids_with_role(TEXT[]),
  public.branch_org_id(UUID), public.course_org_id(UUID), public.session_org_id(UUID),
  public.instructor_org_id(UUID), public.student_org_id(UUID), public.user_co_member_ids(), public.get_user_organization_id()
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION
  public.user_org_ids(), public.user_org_ids_with_role(TEXT[]),
  public.branch_org_id(UUID), public.course_org_id(UUID), public.session_org_id(UUID),
  public.instructor_org_id(UUID), public.student_org_id(UUID), public.user_co_member_ids(), public.get_user_organization_id()
TO authenticated, service_role;

-- ---------------------------------------------------------------------
-- Enable RLS on every table (studios was missing before!)
-- ---------------------------------------------------------------------
ALTER TABLE public.organizations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_users  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studios             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructors         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_instructors  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dance_types         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_rates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_instructors  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_students     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_packages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations         ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- Drop every existing policy on these tables (idempotent re-run,
-- and removes the old insecure ones if run on an existing DB)
-- ---------------------------------------------------------------------
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN (
      'organizations','profiles','organization_users','branches','studios',
      'instructors','branch_instructors','students','dance_types','instructor_rates',
      'courses','course_instructors','course_students','course_sessions',
      'session_instructors','packages','student_packages','attendances',
      'instructor_earnings','cash_transactions','history_logs','invitations')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- =====================================================================
-- ORGANIZATIONS
-- (insert is done with the service-role client during onboarding)
-- =====================================================================
CREATE POLICY "org: members read" ON public.organizations FOR SELECT TO authenticated
  USING (id IN (SELECT public.user_org_ids()));
CREATE POLICY "org: owners update" ON public.organizations FOR UPDATE TO authenticated
  USING      (id IN (SELECT public.user_org_ids_with_role(ARRAY['owner'])))
  WITH CHECK (id IN (SELECT public.user_org_ids_with_role(ARRAY['owner'])));

-- =====================================================================
-- PROFILES
-- =====================================================================
CREATE POLICY "profiles: read own or same org" ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR id IN (SELECT public.user_co_member_ids())
  );
CREATE POLICY "profiles: insert own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "profiles: update own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- =====================================================================
-- ORGANIZATION_USERS
-- Read-only for users. All writes go through the service-role client.
-- (Old policies allowed ANY user to insert themselves into ANY org as
--  owner, and to change their own role — removed.)
-- =====================================================================
CREATE POLICY "org_users: read own memberships" ON public.organization_users FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- =====================================================================
-- Org-scoped config tables: members read, owner/manager write
-- =====================================================================
-- BRANCHES
CREATE POLICY "branches: members read" ON public.branches FOR SELECT TO authenticated
  USING (organization_id IN (SELECT public.user_org_ids()));
CREATE POLICY "branches: managers insert" ON public.branches FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])));
CREATE POLICY "branches: managers update" ON public.branches FOR UPDATE TO authenticated
  USING      (organization_id IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])));

-- STUDIOS
CREATE POLICY "studios: members read" ON public.studios FOR SELECT TO authenticated
  USING (public.branch_org_id(branch_id) IN (SELECT public.user_org_ids()));
CREATE POLICY "studios: managers insert" ON public.studios FOR INSERT TO authenticated
  WITH CHECK (public.branch_org_id(branch_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])));
CREATE POLICY "studios: managers update" ON public.studios FOR UPDATE TO authenticated
  USING      (public.branch_org_id(branch_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])))
  WITH CHECK (public.branch_org_id(branch_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])));
CREATE POLICY "studios: managers delete" ON public.studios FOR DELETE TO authenticated
  USING (public.branch_org_id(branch_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])));

-- INSTRUCTORS
CREATE POLICY "instructors: members read" ON public.instructors FOR SELECT TO authenticated
  USING (organization_id IN (SELECT public.user_org_ids()));
CREATE POLICY "instructors: managers insert" ON public.instructors FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])));
CREATE POLICY "instructors: managers update" ON public.instructors FOR UPDATE TO authenticated
  USING      (organization_id IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])));

-- BRANCH_INSTRUCTORS
CREATE POLICY "branch_instructors: members read" ON public.branch_instructors FOR SELECT TO authenticated
  USING (public.branch_org_id(branch_id) IN (SELECT public.user_org_ids()));
CREATE POLICY "branch_instructors: managers insert" ON public.branch_instructors FOR INSERT TO authenticated
  WITH CHECK (public.branch_org_id(branch_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])));
CREATE POLICY "branch_instructors: managers delete" ON public.branch_instructors FOR DELETE TO authenticated
  USING (public.branch_org_id(branch_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])));

-- DANCE_TYPES (UPDATE was missing -> edit / soft delete silently did nothing)
CREATE POLICY "dance_types: members read" ON public.dance_types FOR SELECT TO authenticated
  USING (organization_id IN (SELECT public.user_org_ids()));
CREATE POLICY "dance_types: managers insert" ON public.dance_types FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])));
CREATE POLICY "dance_types: managers update" ON public.dance_types FOR UPDATE TO authenticated
  USING      (organization_id IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])));

-- PACKAGES (UPDATE was missing -> edit / soft delete silently did nothing)
CREATE POLICY "packages: members read" ON public.packages FOR SELECT TO authenticated
  USING (organization_id IN (SELECT public.user_org_ids()));
CREATE POLICY "packages: managers insert" ON public.packages FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])));
CREATE POLICY "packages: managers update" ON public.packages FOR UPDATE TO authenticated
  USING      (organization_id IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])));

-- INSTRUCTOR_RATES (app writes with service role; policies for completeness)
CREATE POLICY "instructor_rates: members read" ON public.instructor_rates FOR SELECT TO authenticated
  USING (public.instructor_org_id(instructor_id) IN (SELECT public.user_org_ids()));
CREATE POLICY "instructor_rates: managers insert" ON public.instructor_rates FOR INSERT TO authenticated
  WITH CHECK (public.instructor_org_id(instructor_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])));
CREATE POLICY "instructor_rates: managers update" ON public.instructor_rates FOR UPDATE TO authenticated
  USING      (public.instructor_org_id(instructor_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])))
  WITH CHECK (public.instructor_org_id(instructor_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])));
CREATE POLICY "instructor_rates: managers delete" ON public.instructor_rates FOR DELETE TO authenticated
  USING (public.instructor_org_id(instructor_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])));

-- =====================================================================
-- COURSES & ENROLLMENT
-- =====================================================================
CREATE POLICY "courses: members read" ON public.courses FOR SELECT TO authenticated
  USING (public.branch_org_id(branch_id) IN (SELECT public.user_org_ids()));
CREATE POLICY "courses: managers insert" ON public.courses FOR INSERT TO authenticated
  WITH CHECK (public.branch_org_id(branch_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])));
CREATE POLICY "courses: managers update" ON public.courses FOR UPDATE TO authenticated
  USING      (public.branch_org_id(branch_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])))
  WITH CHECK (public.branch_org_id(branch_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])));

CREATE POLICY "course_instructors: members read" ON public.course_instructors FOR SELECT TO authenticated
  USING (public.course_org_id(course_id) IN (SELECT public.user_org_ids()));
CREATE POLICY "course_instructors: managers insert" ON public.course_instructors FOR INSERT TO authenticated
  WITH CHECK (public.course_org_id(course_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])));
CREATE POLICY "course_instructors: managers delete" ON public.course_instructors FOR DELETE TO authenticated
  USING (public.course_org_id(course_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])));

CREATE POLICY "course_students: members read" ON public.course_students FOR SELECT TO authenticated
  USING (public.course_org_id(course_id) IN (SELECT public.user_org_ids()));
CREATE POLICY "course_students: managers insert" ON public.course_students FOR INSERT TO authenticated
  WITH CHECK (public.course_org_id(course_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])));
CREATE POLICY "course_students: managers delete" ON public.course_students FOR DELETE TO authenticated
  USING (public.course_org_id(course_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])));

-- =====================================================================
-- SESSIONS & ATTENDANCE
-- Instructors take attendance and write lesson notes, so they can
-- insert/update sessions (before: managers only -> note update failed).
-- =====================================================================
CREATE POLICY "course_sessions: members read" ON public.course_sessions FOR SELECT TO authenticated
  USING (public.course_org_id(course_id) IN (SELECT public.user_org_ids()));
CREATE POLICY "course_sessions: staff insert" ON public.course_sessions FOR INSERT TO authenticated
  WITH CHECK (public.course_org_id(course_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager','instructor'])));
CREATE POLICY "course_sessions: staff update" ON public.course_sessions FOR UPDATE TO authenticated
  USING      (public.course_org_id(course_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager','instructor'])))
  WITH CHECK (public.course_org_id(course_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager','instructor'])));
CREATE POLICY "course_sessions: managers delete" ON public.course_sessions FOR DELETE TO authenticated
  USING (public.course_org_id(course_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])));

CREATE POLICY "session_instructors: members read" ON public.session_instructors FOR SELECT TO authenticated
  USING (public.session_org_id(session_id) IN (SELECT public.user_org_ids()));
CREATE POLICY "session_instructors: members insert" ON public.session_instructors FOR INSERT TO authenticated
  WITH CHECK (public.session_org_id(session_id) IN (SELECT public.user_org_ids()));
CREATE POLICY "session_instructors: members delete" ON public.session_instructors FOR DELETE TO authenticated
  USING (public.session_org_id(session_id) IN (SELECT public.user_org_ids()));

-- ATTENDANCES (DELETE/UPDATE were missing -> removeAttendance restored the
-- credit but the attendance row stayed)
CREATE POLICY "attendances: members read" ON public.attendances FOR SELECT TO authenticated
  USING (public.session_org_id(session_id) IN (SELECT public.user_org_ids()));
CREATE POLICY "attendances: staff insert" ON public.attendances FOR INSERT TO authenticated
  WITH CHECK (public.session_org_id(session_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager','instructor'])));
CREATE POLICY "attendances: staff update" ON public.attendances FOR UPDATE TO authenticated
  USING      (public.session_org_id(session_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager','instructor'])))
  WITH CHECK (public.session_org_id(session_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager','instructor'])));
CREATE POLICY "attendances: staff delete" ON public.attendances FOR DELETE TO authenticated
  USING (public.session_org_id(session_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager','instructor'])));

-- INSTRUCTOR_EARNINGS
CREATE POLICY "instructor_earnings: members read" ON public.instructor_earnings FOR SELECT TO authenticated
  USING (public.instructor_org_id(instructor_id) IN (SELECT public.user_org_ids()));
CREATE POLICY "instructor_earnings: staff insert" ON public.instructor_earnings FOR INSERT TO authenticated
  WITH CHECK (
    public.instructor_org_id(instructor_id) IN (SELECT public.user_org_ids())
    AND public.session_org_id(session_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager','instructor']))
  );
CREATE POLICY "instructor_earnings: members update" ON public.instructor_earnings FOR UPDATE TO authenticated
  USING      (public.session_org_id(session_id) IN (SELECT public.user_org_ids()))
  WITH CHECK (public.session_org_id(session_id) IN (SELECT public.user_org_ids()));
CREATE POLICY "instructor_earnings: members delete" ON public.instructor_earnings FOR DELETE TO authenticated
  USING (public.session_org_id(session_id) IN (SELECT public.user_org_ids()));

-- =====================================================================
-- STUDENTS & PACKAGES SOLD (any member)
-- =====================================================================
CREATE POLICY "students: members read" ON public.students FOR SELECT TO authenticated
  USING (organization_id IN (SELECT public.user_org_ids()));
CREATE POLICY "students: members insert" ON public.students FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));
CREATE POLICY "students: members update" ON public.students FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT public.user_org_ids()))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

CREATE POLICY "student_packages: members read" ON public.student_packages FOR SELECT TO authenticated
  USING (public.student_org_id(student_id) IN (SELECT public.user_org_ids()));
CREATE POLICY "student_packages: members insert" ON public.student_packages FOR INSERT TO authenticated
  WITH CHECK (public.student_org_id(student_id) IN (SELECT public.user_org_ids()));
CREATE POLICY "student_packages: members update" ON public.student_packages FOR UPDATE TO authenticated
  USING (public.student_org_id(student_id) IN (SELECT public.user_org_ids()))
  WITH CHECK (public.student_org_id(student_id) IN (SELECT public.user_org_ids()));
CREATE POLICY "student_packages: members delete" ON public.student_packages FOR DELETE TO authenticated
  USING (public.student_org_id(student_id) IN (SELECT public.user_org_ids()));

-- =====================================================================
-- CASH_TRANSACTIONS
-- Any member may insert: selling a package (any role) writes an income
-- row with the user client. Before: managers only -> package sold by
-- staff/instructor had no cash record. Delete was missing entirely.
-- =====================================================================
CREATE POLICY "cash: members read" ON public.cash_transactions FOR SELECT TO authenticated
  USING (public.branch_org_id(branch_id) IN (SELECT public.user_org_ids()));
CREATE POLICY "cash: members insert" ON public.cash_transactions FOR INSERT TO authenticated
  WITH CHECK (public.branch_org_id(branch_id) IN (SELECT public.user_org_ids()));
CREATE POLICY "cash: managers update" ON public.cash_transactions FOR UPDATE TO authenticated
  USING      (public.branch_org_id(branch_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])))
  WITH CHECK (public.branch_org_id(branch_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])));
CREATE POLICY "cash: managers delete" ON public.cash_transactions FOR DELETE TO authenticated
  USING (public.branch_org_id(branch_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])));

-- =====================================================================
-- HISTORY_LOGS (append-only: no UPDATE / DELETE policies)
-- =====================================================================
CREATE POLICY "history: members read" ON public.history_logs FOR SELECT TO authenticated
  USING (organization_id IN (SELECT public.user_org_ids()));
CREATE POLICY "history: members insert" ON public.history_logs FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT public.user_org_ids())
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- =====================================================================
-- INVITATIONS (app uses the service role; policies for completeness)
-- =====================================================================
CREATE POLICY "invitations: members read" ON public.invitations FOR SELECT TO authenticated
  USING (organization_id IN (SELECT public.user_org_ids()));
CREATE POLICY "invitations: managers insert" ON public.invitations FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager']))
    AND invited_by = auth.uid()
  );
CREATE POLICY "invitations: managers update" ON public.invitations FOR UPDATE TO authenticated
  USING      (organization_id IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])))
  WITH CHECK (organization_id IN (SELECT public.user_org_ids_with_role(ARRAY['owner','manager'])));
