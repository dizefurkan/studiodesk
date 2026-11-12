-- Migration: Change instructor_rates from price_per_class to ratio_per_class
-- Date: 2026-03-23

BEGIN;

-- Rename the column from price_per_class to ratio_per_class
ALTER TABLE instructor_rates
RENAME COLUMN price_per_class TO ratio_per_class;

-- Update the column constraint to match the new range (0-100 for percentages)
-- Note: We're using ALTER COLUMN to modify the type if needed
ALTER TABLE instructor_rates
ALTER COLUMN ratio_per_class TYPE NUMERIC(5, 2);

COMMIT;
