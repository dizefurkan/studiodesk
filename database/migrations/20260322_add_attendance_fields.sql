-- Migration: Add is_present and deduct_credits fields to attendances table
-- Date: 2026-03-22
-- Description: Store attendance presence status and credit deduction flag

-- Add is_present column if it doesn't exist
ALTER TABLE attendances 
ADD COLUMN IF NOT EXISTS is_present BOOLEAN DEFAULT true NOT NULL;

-- Add deduct_credits column if it doesn't exist
ALTER TABLE attendances 
ADD COLUMN IF NOT EXISTS deduct_credits BOOLEAN DEFAULT true NOT NULL;

-- Add index for deduct_credits queries
CREATE INDEX IF NOT EXISTS idx_attendances_deduct_credits ON attendances(deduct_credits);

-- Add comment for documentation
COMMENT ON COLUMN attendances.is_present IS 'Whether the student was present (true) or absent (false)';
COMMENT ON COLUMN attendances.deduct_credits IS 'Whether to deduct credits from the student package (true) or not (false)';
