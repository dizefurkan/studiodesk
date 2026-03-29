-- Migration: Add UNIQUE constraint to course_sessions
-- Purpose: Prevent race condition when creating sessions for same course on same date
-- Created: 2025-03-24
-- Severity: Low - adds constraint, no behavior change (logic already prevents duplicates)

-- Add UNIQUE constraint to course_sessions table
-- This prevents the rare race condition where two simultaneous recordBatchAttendance calls
-- could create duplicate (course_id, session_date) pairs

-- First, check if duplicates exist and remove them (keep first, delete rest)
DELETE FROM course_sessions a
WHERE a.id NOT IN (
  SELECT DISTINCT ON (course_id, session_date) id
  FROM course_sessions
  ORDER BY course_id, session_date, created_at ASC
);

-- Add the UNIQUE constraint
ALTER TABLE course_sessions
ADD CONSTRAINT unique_course_session_date UNIQUE(course_id, session_date);

-- Comment for clarity
COMMENT ON CONSTRAINT unique_course_session_date ON course_sessions IS 
'Ensures only one session per course per date. Prevents race conditions during on-demand session creation.';
