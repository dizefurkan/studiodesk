-- Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'staff',
  invited_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  token text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, accepted, expired
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  
  CONSTRAINT valid_role CHECK (role IN ('staff', 'instructor', 'manager')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'expired'))
);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Organizations can view their invitations"
  ON public.invitations
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Only org users can create invitations"
  ON public.invitations
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_users 
      WHERE user_id = auth.uid()
    )
    AND invited_by = auth.uid()
  );

CREATE POLICY "Only org admins can update invitations"
  ON public.invitations
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users 
      WHERE user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_invitations_organization_id ON public.invitations(organization_id);
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_email ON public.invitations(email);
CREATE INDEX idx_invitations_status ON public.invitations(status);
