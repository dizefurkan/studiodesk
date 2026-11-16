-- Student active / passive status. A passive student (left, on a break) keeps their history,
-- packages and course enrolments, but is left out of attendance sheets, enrolment pickers and
-- the active-student counts. Idempotent.
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.students.is_active IS 'false = passive: hidden from attendance and enrolment, kept in history';
COMMENT ON COLUMN public.students.status_changed_at IS 'When is_active last changed';

CREATE INDEX IF NOT EXISTS idx_students_org_active ON public.students(organization_id, is_active);
