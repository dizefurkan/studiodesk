-- Supabase advisor fixes (security + performance). Idempotent.

-- 1) auth.uid() evaluated once per query instead of per row (lint 0003 auth_rls_initplan)
ALTER POLICY "profiles: insert own" ON public.profiles
  WITH CHECK (id = (SELECT auth.uid()));

ALTER POLICY "profiles: read own or same org" ON public.profiles
  USING (id = (SELECT auth.uid()) OR id IN (SELECT public.user_co_member_ids()));

ALTER POLICY "profiles: update own" ON public.profiles
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

ALTER POLICY "org_users: read own memberships" ON public.organization_users
  USING (user_id = (SELECT auth.uid()));

ALTER POLICY "history: members insert" ON public.history_logs
  WITH CHECK (
    organization_id IN (SELECT public.user_org_ids())
    AND (user_id IS NULL OR user_id = (SELECT auth.uid()))
  );

ALTER POLICY "invitations: managers insert" ON public.invitations
  WITH CHECK (
    organization_id IN (SELECT public.user_org_ids_with_role(ARRAY['owner', 'manager']))
    AND invited_by = (SELECT auth.uid())
  );

-- 2) Missing FK index (lint 0001)
CREATE INDEX IF NOT EXISTS idx_invitations_invited_by ON public.invitations (invited_by);

-- 3) Supabase's own ensure_rls event-trigger function should not be callable over the API
DO $$
BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;

-- platform_admins: RLS on with no policies is intentional; only the service role reads it.
COMMENT ON TABLE public.platform_admins IS
  'Backoffice admins. RLS enabled with no policies on purpose: accessed only via the service role.';
