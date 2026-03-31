-- Add user_id to history_logs table for audit trail
ALTER TABLE history_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_history_logs_user_id ON history_logs(user_id);

-- Update any existing records to note they were created before user tracking was added
-- (keeping them as they are since we don't have user info for past operations)
