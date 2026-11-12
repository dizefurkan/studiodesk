-- Migration: Add currency field to organizations table
-- Description: Adds currency support for multi-currency operations

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'TRY';

-- Add comment to the column
COMMENT ON COLUMN organizations.currency IS 'ISO 4217 currency code (e.g., TRY, USD, EUR, BRL)';

-- Create an index for potential future lookups
CREATE INDEX IF NOT EXISTS idx_organizations_currency ON organizations(currency);
