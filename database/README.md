# Database

The single source of truth for the schema is **`supabase/migrations/`**:

| File | What it does |
|------|--------------|
| `20261110000000_initial_schema.sql` | All tables, columns, constraints, indexes, `updated_at` triggers |
| `20261110000100_rls_policies.sql`   | RLS on every table + policies + helper functions |
| `20261110000200_cleanup_legacy.sql` | Drops leftovers of the old scripts (no-op on a fresh DB) |
| `20261112000000_backoffice.sql`     | `platform_admins`, `organizations.is_active`, suspended stores excluded from RLS |

All files are idempotent and were tested on an empty Postgres 16 (run twice, plus RLS checks per role).
Every future schema change = a **new** timestamped file in `supabase/migrations/` (never edit the DB by hand in the dashboard).

`database/_legacy/` holds the old, conflicting scripts (`schema.sql`, `rls-policies.sql`,
`PRODUCTION_SCHEMA_ENHANCEMENTS.sql`, the old incremental migrations). They are kept only for reference —
**do not run them**; everything in them is folded into the baseline above.

`database/verify_schema.sql` dumps columns / constraints / functions / policies so you can diff two projects.

---

## Fresh project setup

**Option A — Supabase CLI**
```bash
npx supabase init            # creates supabase/config.toml, keeps existing migrations
npx supabase link --project-ref <new-project-ref>
npx supabase db push         # applies supabase/migrations in order
```

**Option B — SQL Editor**: paste and run the files in order.

### After the migrations
1. Authentication → Sign In / Providers → turn **off** "Allow new users to sign up"
   (public sign-up is closed; accounts are created in `/backoffice`).
2. Authentication → Users → **Add user** for the first admin (dizefurkan@gmail.com, "Auto confirm" on).
3. Make it a backoffice admin:
   ```sql
   INSERT INTO public.platform_admins (user_id)
   SELECT id FROM auth.users WHERE lower(email) = 'dizefurkan@gmail.com'
   ON CONFLICT DO NOTHING;
   ```
4. Sign in → you land on `/backoffice`: create accounts, then stores (store + first branch + owner).

---

## Moving production eu-west-1 → eu-central-1 (with data)

Supabase can't change a project's region, so: new project + dump/restore.
Dump/restore copies schema, data **and `auth.users`** exactly as they are in production.
Requires the Supabase CLI and `psql` (Postgres client).

```bash
OLD="postgresql://postgres:<old-pw>@db.<old-ref>.supabase.co:5432/postgres"
NEW="postgresql://postgres:<new-pw>@db.<new-ref>.supabase.co:5432/postgres"

# 1) dump the old project
npx supabase db dump --db-url "$OLD" -f roles.sql  --role-only
npx supabase db dump --db-url "$OLD" -f schema.sql
npx supabase db dump --db-url "$OLD" -f data.sql   --use-copy --data-only

# 2) restore into the new (empty) project
psql --single-transaction --variable ON_ERROR_STOP=1 \
  --file roles.sql --file schema.sql \
  --command 'SET session_replication_role = replica' \
  --file data.sql --dbname "$NEW"
```

Then, on the new project:

1. **Apply the fixes** — run `supabase/migrations/20261110000100_rls_policies.sql`
   then `20261110000200_cleanup_legacy.sql` (drops all old policies, recreates the
   correct ones, removes broken leftovers; safe on restored data).
2. **Check for drift** — run `database/verify_schema.sql` on both projects and diff.
   If the old prod has something the migrations don't, add a new migration for it.
3. **Mark migrations as applied** (only if using the CLI), so `db push` won't try to re-create tables:
   ```bash
   npx supabase migration repair --status applied 20261110000000 20261110000100 20261110000200
   ```
4. **Auth settings** are not in the dump — copy them by hand in the dashboard:
   Site URL + Redirect URLs, Email confirmation on/off (signup inserts the profile
   with the user session, so keep it the same as the old project), SMTP, email templates.
5. **Update env vars** (`.env.local` + Vercel): `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`.
   Keys change with the new project → every user has to log in again.
6. Storage: the app doesn't use Supabase Storage, nothing to copy.

Tip: put the app in maintenance (or just avoid writes) between step 1 of the dump and the env switch,
otherwise rows written to the old project in that window are lost.

### Starting empty instead
If you don't need the old data: create the project and use "Fresh project setup" above.
