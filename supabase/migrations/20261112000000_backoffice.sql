-- =====================================================================
-- Backoffice: platform admins + store (organization) activation
-- =====================================================================

-- ---------------------------------------------------------------------
-- PLATFORM_ADMINS: users allowed into /backoffice
-- Only reachable with the service-role client (RLS on, no policies).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_admins FROM anon, authenticated;

-- ---------------------------------------------------------------------
-- ORGANIZATIONS.is_active: a suspended store's users lose access
-- ---------------------------------------------------------------------
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
COMMENT ON COLUMN public.organizations.is_active IS
  'false = store suspended from the backoffice; its members cannot read or write its data';
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON public.organizations(is_active);

-- ---------------------------------------------------------------------
-- Membership helpers now ignore suspended stores, so RLS blocks every
-- table of a suspended store at the database level too.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_org_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT ou.organization_id
  FROM public.organization_users ou
  JOIN public.organizations o ON o.id = ou.organization_id AND o.is_active
  WHERE ou.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.user_org_ids_with_role(roles TEXT[])
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT ou.organization_id
  FROM public.organization_users ou
  JOIN public.organizations o ON o.id = ou.organization_id AND o.is_active
  WHERE ou.user_id = auth.uid() AND ou.role = ANY (roles);
$$;

CREATE OR REPLACE FUNCTION public.user_co_member_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT ou.user_id FROM public.organization_users ou
  WHERE ou.organization_id IN (SELECT public.user_org_ids());
$$;

-- ---------------------------------------------------------------------
-- First admin: inserted only if the account already exists
-- (create it in Authentication > Users first, then re-run this block).
-- ---------------------------------------------------------------------
INSERT INTO public.platform_admins (user_id)
SELECT id FROM auth.users WHERE lower(email) = 'dizefurkan@gmail.com'
ON CONFLICT DO NOTHING;
