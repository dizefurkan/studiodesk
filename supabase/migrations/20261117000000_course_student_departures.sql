-- Students who left a class (removed, or moved to another class). course_students only holds
-- current enrollments; this keeps who used to be in the class for the "Former students" list.
-- Service-role only (server actions check the organization). Idempotent.
CREATE TABLE IF NOT EXISTS public.course_student_departures (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id          UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id         UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  joined_at          TIMESTAMPTZ,
  left_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason             TEXT NOT NULL DEFAULT 'removed' CHECK (reason IN ('removed', 'moved')),
  moved_to_course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  left_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_course_student_departures_course ON public.course_student_departures(course_id, left_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_student_departures_student ON public.course_student_departures(student_id);
CREATE INDEX IF NOT EXISTS idx_course_student_departures_moved_to ON public.course_student_departures(moved_to_course_id);
CREATE INDEX IF NOT EXISTS idx_course_student_departures_left_by ON public.course_student_departures(left_by);
ALTER TABLE public.course_student_departures ENABLE ROW LEVEL SECURITY;
