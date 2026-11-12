-- Migration: Add notes column to course_sessions table
-- Date: 2026-05-08
-- Description: Allow instructors to add lesson notes when recording attendance

ALTER TABLE public.course_sessions
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for potential future search queries
CREATE INDEX IF NOT EXISTS idx_course_sessions_notes ON public.course_sessions(notes)
  WHERE notes IS NOT NULL;

COMMENT ON COLUMN public.course_sessions.notes IS 'Optional lesson note written by the instructor when taking attendance';
