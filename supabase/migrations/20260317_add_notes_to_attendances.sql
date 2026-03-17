-- Add notes column to attendances table
-- This migration allows storing notes for student attendance records (both present and absent)

ALTER TABLE public.attendances
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index on notes for potential future queries
CREATE INDEX IF NOT EXISTS idx_attendances_notes ON public.attendances(notes) 
WHERE notes IS NOT NULL;
