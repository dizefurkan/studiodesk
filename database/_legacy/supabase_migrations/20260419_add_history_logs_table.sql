-- Create history_logs table for audit logging
CREATE TABLE IF NOT EXISTS history_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  entity VARCHAR(255) NOT NULL,
  entity_id UUID NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_history_logs_org_id ON history_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_history_logs_user_id ON history_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_history_logs_action ON history_logs(action);
CREATE INDEX IF NOT EXISTS idx_history_logs_entity ON history_logs(entity);
CREATE INDEX IF NOT EXISTS idx_history_logs_entity_id ON history_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_history_logs_created_at ON history_logs(created_at);

-- Enable RLS on history_logs table
ALTER TABLE history_logs ENABLE ROW LEVEL SECURITY;

-- Note: History logs are immutable - no DELETE policies defined
-- This ensures audit trail integrity

-- Create RLS policy for reading history logs
CREATE POLICY "Users can read history logs in their organization"
ON history_logs FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
  )
);

-- Create RLS policy for inserting history logs
CREATE POLICY "Users can insert history logs in their organization"
ON history_logs FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
  )
);
