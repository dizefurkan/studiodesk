-- =====================================================================
-- StudioDesk — baseline schema (fresh project)
-- ---------------------------------------------------------------------
-- Consolidates database/schema.sql + every incremental migration that
-- used to live in database/migrations and supabase/migrations
-- (soft delete, notes, ratio_per_class, currency, org settings,
-- history_logs.user_id, invitations, course_session unique, ...).
--
-- Run on an EMPTY Supabase project. Safe to re-run (idempotent).
-- Order: 20261110000000_initial_schema.sql -> 20261110000100_rls_policies.sql
-- =====================================================================

-- gen_random_uuid() is built into Postgres 13+, no extension needed.

-- ---------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================================================================
-- ORGANIZATIONS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      VARCHAR(255) NOT NULL,
  week_start_day            INT DEFAULT 1 CHECK (week_start_day BETWEEN 0 AND 6),
  timezone                  VARCHAR(50) DEFAULT 'Europe/Istanbul',
  currency                  VARCHAR(3) DEFAULT 'TRY',
  virtual_sessions_weeks    INT DEFAULT 12 CHECK (virtual_sessions_weeks > 0),
  attendance_per_week_limit INT DEFAULT 1 CHECK (attendance_per_week_limit > 0),
  allow_makeup_sessions     BOOLEAN DEFAULT true,
  allow_manager_invite      BOOLEAN DEFAULT false,
  allow_role_change         BOOLEAN DEFAULT false,
  allow_member_delete       BOOLEAN DEFAULT false,
  created_at                TIMESTAMPTZ DEFAULT now(),
  updated_at                TIMESTAMPTZ DEFAULT now()
);
COMMENT ON COLUMN public.organizations.currency IS 'ISO 4217 currency code (e.g., TRY, USD, EUR, BRL)';
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON public.organizations(created_at);

-- =====================================================================
-- PROFILES (1:1 with auth.users)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      VARCHAR(255),
  full_name  VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_email      ON public.profiles(email);

-- =====================================================================
-- ORGANIZATION_USERS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.organization_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            VARCHAR(50) NOT NULL DEFAULT 'staff'
                  CHECK (role IN ('owner', 'manager', 'instructor', 'staff')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (organization_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_organization_users_org_id  ON public.organization_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_users_user_id ON public.organization_users(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_users_role    ON public.organization_users(role);

-- =====================================================================
-- BRANCHES
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.branches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  address         TEXT,
  phone           VARCHAR(20),
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID REFERENCES public.profiles(id),
  deleted_reason  TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_branches_org_id     ON public.branches(organization_id);
CREATE INDEX IF NOT EXISTS idx_branches_created_at ON public.branches(created_at);
CREATE INDEX IF NOT EXISTS idx_branches_deleted_at ON public.branches(deleted_at);
CREATE INDEX IF NOT EXISTS idx_branches_deleted_by ON public.branches(deleted_by);

-- =====================================================================
-- STUDIOS (rooms per branch)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.studios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id   UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  capacity    INT,
  image_url   VARCHAR(500),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_studios_branch_id  ON public.studios(branch_id);
CREATE INDEX IF NOT EXISTS idx_studios_created_at ON public.studios(created_at);

-- =====================================================================
-- INSTRUCTORS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.instructors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  first_name      VARCHAR(255) NOT NULL,
  last_name       VARCHAR(255) NOT NULL,
  phone           VARCHAR(20),
  email           VARCHAR(255) NOT NULL,
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID REFERENCES public.profiles(id),
  deleted_reason  TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_instructors_org_id     ON public.instructors(organization_id);
CREATE INDEX IF NOT EXISTS idx_instructors_email      ON public.instructors(email);
CREATE INDEX IF NOT EXISTS idx_instructors_created_at ON public.instructors(created_at);
CREATE INDEX IF NOT EXISTS idx_instructors_deleted_at ON public.instructors(deleted_at);
CREATE INDEX IF NOT EXISTS idx_instructors_deleted_by ON public.instructors(deleted_by);

-- =====================================================================
-- BRANCH_INSTRUCTORS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.branch_instructors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id     UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (branch_id, instructor_id)
);
CREATE INDEX IF NOT EXISTS idx_branch_instructors_branch_id     ON public.branch_instructors(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_instructors_instructor_id ON public.branch_instructors(instructor_id);

-- =====================================================================
-- STUDENTS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.students (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  first_name      VARCHAR(255) NOT NULL,
  last_name       VARCHAR(255) NOT NULL,
  phone           VARCHAR(20),
  email           VARCHAR(255) NOT NULL,
  notes           TEXT,
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID REFERENCES public.profiles(id),
  deleted_reason  TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_students_org_id     ON public.students(organization_id);
CREATE INDEX IF NOT EXISTS idx_students_email      ON public.students(email);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON public.students(created_at);
CREATE INDEX IF NOT EXISTS idx_students_deleted_at ON public.students(deleted_at);
CREATE INDEX IF NOT EXISTS idx_students_deleted_by ON public.students(deleted_by);

-- =====================================================================
-- DANCE_TYPES
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.dance_types (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID REFERENCES public.profiles(id),
  deleted_reason  TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dance_types_org_id     ON public.dance_types(organization_id);
CREATE INDEX IF NOT EXISTS idx_dance_types_created_at ON public.dance_types(created_at);
CREATE INDEX IF NOT EXISTS idx_dance_types_deleted_at ON public.dance_types(deleted_at);
CREATE INDEX IF NOT EXISTS idx_dance_types_deleted_by ON public.dance_types(deleted_by);

-- =====================================================================
-- INSTRUCTOR_RATES (ratio_per_class = percentage 0-100)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.instructor_rates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id   UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  branch_id       UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  dance_type_id   UUID NOT NULL REFERENCES public.dance_types(id) ON DELETE CASCADE,
  ratio_per_class NUMERIC(5, 2) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (instructor_id, branch_id, dance_type_id)
);
CREATE INDEX IF NOT EXISTS idx_instructor_rates_instructor_id ON public.instructor_rates(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_rates_branch_id     ON public.instructor_rates(branch_id);
CREATE INDEX IF NOT EXISTS idx_instructor_rates_dance_type_id ON public.instructor_rates(dance_type_id);

-- =====================================================================
-- COURSES
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id      UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  dance_type_id  UUID NOT NULL REFERENCES public.dance_types(id) ON DELETE CASCADE,
  name           VARCHAR(255) NOT NULL,
  day_of_week    INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time     TIME NOT NULL,
  end_time       TIME NOT NULL,
  deleted_at     TIMESTAMPTZ,
  deleted_by     UUID REFERENCES public.profiles(id),
  deleted_reason TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_courses_branch_id     ON public.courses(branch_id);
CREATE INDEX IF NOT EXISTS idx_courses_dance_type_id ON public.courses(dance_type_id);
CREATE INDEX IF NOT EXISTS idx_courses_day_of_week   ON public.courses(day_of_week);
CREATE INDEX IF NOT EXISTS idx_courses_created_at    ON public.courses(created_at);
CREATE INDEX IF NOT EXISTS idx_courses_deleted_at    ON public.courses(deleted_at);
CREATE INDEX IF NOT EXISTS idx_courses_deleted_by    ON public.courses(deleted_by);

-- =====================================================================
-- COURSE_INSTRUCTORS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.course_instructors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (course_id, instructor_id)
);
CREATE INDEX IF NOT EXISTS idx_course_instructors_course_id     ON public.course_instructors(course_id);
CREATE INDEX IF NOT EXISTS idx_course_instructors_instructor_id ON public.course_instructors(instructor_id);

-- =====================================================================
-- COURSE_STUDENTS (enrollment)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.course_students (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id  UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (course_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_course_students_course_id  ON public.course_students(course_id);
CREATE INDEX IF NOT EXISTS idx_course_students_student_id ON public.course_students(student_id);
CREATE INDEX IF NOT EXISTS idx_course_students_joined_at  ON public.course_students(joined_at);

-- =====================================================================
-- COURSE_SESSIONS (one per course per date)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.course_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_course_session_date UNIQUE (course_id, session_date)
);
COMMENT ON COLUMN public.course_sessions.notes IS 'Optional lesson note written by the instructor when taking attendance';
CREATE INDEX IF NOT EXISTS idx_course_sessions_course_id    ON public.course_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_course_sessions_session_date ON public.course_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_course_sessions_created_at   ON public.course_sessions(created_at);

-- =====================================================================
-- SESSION_INSTRUCTORS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.session_instructors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES public.course_sessions(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (session_id, instructor_id)
);
CREATE INDEX IF NOT EXISTS idx_session_instructors_session_id    ON public.session_instructors(session_id);
CREATE INDEX IF NOT EXISTS idx_session_instructors_instructor_id ON public.session_instructors(instructor_id);

-- =====================================================================
-- PACKAGES
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.packages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  dance_type_id   UUID NOT NULL REFERENCES public.dance_types(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  total_credits   INT NOT NULL,
  price           NUMERIC(10, 2) NOT NULL,
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID REFERENCES public.profiles(id),
  deleted_reason  TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_packages_org_id        ON public.packages(organization_id);
CREATE INDEX IF NOT EXISTS idx_packages_dance_type_id ON public.packages(dance_type_id);
CREATE INDEX IF NOT EXISTS idx_packages_created_at    ON public.packages(created_at);
CREATE INDEX IF NOT EXISTS idx_packages_deleted_at    ON public.packages(deleted_at);
CREATE INDEX IF NOT EXISTS idx_packages_deleted_by    ON public.packages(deleted_by);

-- =====================================================================
-- STUDENT_PACKAGES
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.student_packages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  package_id        UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  remaining_credits INT NOT NULL,
  purchase_date     TIMESTAMPTZ NOT NULL DEFAULT now(),
  expire_date       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_student_packages_student_id  ON public.student_packages(student_id);
CREATE INDEX IF NOT EXISTS idx_student_packages_package_id  ON public.student_packages(package_id);
CREATE INDEX IF NOT EXISTS idx_student_packages_expire_date ON public.student_packages(expire_date);
CREATE INDEX IF NOT EXISTS idx_student_packages_created_at  ON public.student_packages(created_at);

-- =====================================================================
-- ATTENDANCES
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.attendances (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         UUID NOT NULL REFERENCES public.course_sessions(id) ON DELETE CASCADE,
  student_id         UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  student_package_id UUID NOT NULL REFERENCES public.student_packages(id) ON DELETE CASCADE,
  studio_id          UUID REFERENCES public.studios(id) ON DELETE SET NULL,
  is_present         BOOLEAN NOT NULL DEFAULT true,
  deduct_credits     BOOLEAN NOT NULL DEFAULT true,
  notes              TEXT,
  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now(),
  UNIQUE (session_id, student_id)
);
COMMENT ON COLUMN public.attendances.is_present     IS 'Whether the student was present (true) or absent (false)';
COMMENT ON COLUMN public.attendances.deduct_credits IS 'Whether to deduct credits from the student package (true) or not (false)';
-- NOTE: the old btree index on attendances(notes) / course_sessions(notes) is
-- intentionally NOT recreated: a btree on free text fails inserts once a note
-- exceeds ~2.7KB and no query filters on notes.
CREATE INDEX IF NOT EXISTS idx_attendances_session_id         ON public.attendances(session_id);
CREATE INDEX IF NOT EXISTS idx_attendances_student_id         ON public.attendances(student_id);
CREATE INDEX IF NOT EXISTS idx_attendances_student_package_id ON public.attendances(student_package_id);
CREATE INDEX IF NOT EXISTS idx_attendances_studio_id          ON public.attendances(studio_id);
CREATE INDEX IF NOT EXISTS idx_attendances_deduct_credits     ON public.attendances(deduct_credits);
CREATE INDEX IF NOT EXISTS idx_attendances_created_at         ON public.attendances(created_at);

-- =====================================================================
-- INSTRUCTOR_EARNINGS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.instructor_earnings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  session_id    UUID NOT NULL REFERENCES public.course_sessions(id) ON DELETE CASCADE,
  amount        NUMERIC(10, 2) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (instructor_id, session_id)
);
CREATE INDEX IF NOT EXISTS idx_instructor_earnings_instructor_id ON public.instructor_earnings(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_earnings_session_id    ON public.instructor_earnings(session_id);
CREATE INDEX IF NOT EXISTS idx_instructor_earnings_created_at    ON public.instructor_earnings(created_at);

-- =====================================================================
-- CASH_TRANSACTIONS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.cash_transactions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id          UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  type               VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
  amount             NUMERIC(10, 2) NOT NULL,
  description        TEXT NOT NULL,
  student_package_id UUID REFERENCES public.student_packages(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_branch_id          ON public.cash_transactions(branch_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_type               ON public.cash_transactions(type);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_student_package_id ON public.cash_transactions(student_package_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_created_at         ON public.cash_transactions(created_at);

-- =====================================================================
-- HISTORY_LOGS (append-only audit trail)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.history_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action          VARCHAR(255) NOT NULL,
  entity          VARCHAR(255) NOT NULL,
  entity_id       UUID NOT NULL,
  data            JSONB,
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_history_logs_org_id     ON public.history_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_history_logs_user_id    ON public.history_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_history_logs_action     ON public.history_logs(action);
CREATE INDEX IF NOT EXISTS idx_history_logs_entity     ON public.history_logs(entity);
CREATE INDEX IF NOT EXISTS idx_history_logs_entity_id  ON public.history_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_history_logs_created_at ON public.history_logs(created_at);

-- =====================================================================
-- INVITATIONS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'staff',
  -- was NOT NULL + ON DELETE SET NULL (contradiction: deleting the inviter errored)
  invited_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  token           TEXT UNIQUE NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at     TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  CONSTRAINT valid_role   CHECK (role IN ('staff', 'instructor', 'manager')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'expired'))
);
CREATE INDEX IF NOT EXISTS idx_invitations_organization_id ON public.invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email           ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status          ON public.invitations(status);
-- token already indexed by its UNIQUE constraint

-- =====================================================================
-- updated_at TRIGGERS
-- =====================================================================
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'organizations', 'profiles', 'organization_users', 'branches', 'studios',
    'instructors', 'branch_instructors', 'students', 'dance_types',
    'instructor_rates', 'courses', 'course_instructors', 'course_students',
    'course_sessions', 'session_instructors', 'packages', 'student_packages',
    'attendances', 'instructor_earnings', 'cash_transactions'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%1$s_updated_at ON public.%1$I', t);
    EXECUTE format(
      'CREATE TRIGGER update_%1$s_updated_at BEFORE UPDATE ON public.%1$I
         FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t);
  END LOOP;
END $$;
