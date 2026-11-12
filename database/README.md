# Database

The single source of truth for the schema is **`supabase/migrations/`** (Supabase project
`studiodesk`, eu-central-1, ref `bymqrtvzlakwbdgyznxz`):

| File | What it does |
|------|--------------|
| `20261110000000_initial_schema.sql` | All tables, columns, constraints, indexes, `updated_at` triggers |
| `20261110000100_rls_policies.sql`   | RLS on every table + policies + helper functions |
| `20261110000200_cleanup_legacy.sql` | Drops leftovers of the old scripts (no-op on a fresh DB) |
| `20261112000000_backoffice.sql`     | `platform_admins`, `organizations.is_active`, suspended stores excluded from RLS |
| `20261113000000_advisor_fixes.sql`  | Supabase advisor fixes: `(select auth.uid())` in policies, FK index, revoke on `rls_auto_enable` |

All files are idempotent. Every schema change = a **new** timestamped file here; never edit the
database by hand in the dashboard.

`database/_legacy/` holds the old eu-west-1 scripts for reference only — **do not run them**.
`database/verify_schema.sql` dumps columns / constraints / functions / policies so two projects can be diffed.

## After a schema change

```bash
# regenerate the TypeScript types (or use the Supabase MCP "generate_typescript_types")
npx supabase gen types typescript --project-id bymqrtvzlakwbdgyznxz > lib/types/database.types.ts
```

Then run the security/performance advisors (Dashboard → Advisors) and fix anything new.

## Fresh project setup

**Supabase CLI**
```bash
npx supabase link --project-ref <project-ref>
npx supabase db push          # applies supabase/migrations in order
```
or paste the files into the SQL Editor in order.

Then:
1. Authentication → Sign In / Providers → turn **off** "Allow new users to sign up".
2. Authentication → Users → **Add user** for the first admin ("Auto confirm" on).
3. Make it a backoffice admin:
   ```sql
   INSERT INTO public.platform_admins (user_id)
   SELECT id FROM auth.users WHERE lower(email) = '<admin email>'
   ON CONFLICT DO NOTHING;
   ```
4. Authentication → URL Configuration: set the Site URL (production domain) and add
   `http://localhost:3000/**` to the redirect URLs.
5. Sign in → `/backoffice`: create accounts, then stores (store + first branch + owner).

## Notes

- Helper functions (`user_org_ids()`, `branch_org_id()`, …) are `SECURITY DEFINER` and callable by
  `authenticated` because the RLS policies use them; they only return ids (organization / co-member ids).
- `platform_admins` has RLS on with no policies on purpose: only the service role reads it.
- The current project's migrations were applied through the Supabase MCP, so the remote
  migration history has different version numbers. Before the first `supabase db push`, run
  `npx supabase migration list` and mark the existing files as applied with
  `npx supabase migration repair --status applied <version> …`.
