-- The room (studio) a course is usually held in, for the room view of the calendar.
-- Optional; a room in another branch is rejected by the server actions. Idempotent.
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS studio_id UUID REFERENCES public.studios(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_courses_studio_id ON public.courses(studio_id);
COMMENT ON COLUMN public.courses.studio_id IS 'Room the course is usually held in (optional)';
