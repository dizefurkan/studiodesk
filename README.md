# StudioDesk

Multi-tenant management app for dance studios: students, instructors, courses and sessions,
attendance, packages and credits, cash register, instructor rates and earnings, activity history.

Each **store** (organization) has one or more **branches**. Stores and accounts are created by a
platform admin in **`/backoffice`**; public sign-up is closed.

## Stack

- Next.js 16 (App Router, Server Actions, `proxy.ts`) · React 19 · TypeScript
- Supabase: Postgres + Auth + Row-Level Security (project `studiodesk`, eu-central-1)
- shadcn/ui (radix-nova) + Tailwind CSS v4 tokens · TanStack Table · sonner · lottie-react
- next-intl: `tr` and `en`, every route is under `/[locale]/…`

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in the three Supabase values
npm run dev                         # http://localhost:3000/tr/login
```

A fresh Supabase project needs the migrations and a first admin: see [database/README.md](./database/README.md).

## Roles

| Who | Where | Can |
|-----|-------|-----|
| Platform admin (`platform_admins`) | `/backoffice` | Create/suspend stores, manage branches, members and accounts |
| `owner` | `/dashboard` | Everything in their store, incl. team and permissions |
| `manager` | `/dashboard` | Day-to-day operations; invites only if the owner allows it |
| `instructor`, `staff` | `/dashboard` | Restricted by RLS and role checks in the server actions |

A suspended store's members land on `/no-access`.

## Project layout

```
app/[locale]/
  (auth)/login         sign-in (register/onboarding redirect: sign-up is closed)
  backoffice/          platform admin: stores, branches, members, accounts
  dashboard/           store app (students, courses, attendance, settings/…)
  invited/[token]      accept a team invitation
components/
  ui/                  shadcn-owned, add with scripts/shadcn-add.sh
  common/ table/       shared app components (EmptyState, PageHeader, DataTable, ConfirmProvider…)
  brand/               Logo, empty-state Lottie
lib/
  actions/             server actions (all writes go through here)
  auth/                current user, organization, platform-admin guards
  supabase/            server / browser / admin (service role) clients
  types/database.types.ts   generated from the Supabase schema
supabase/migrations/   schema + RLS, the single source of truth
messages/              tr.json / en.json
```

## Commands

```bash
npm run dev        # dev server
npm run build      # production build
npm run lint       # eslint
npx tsc --noEmit   # type check
```

Working rules for code changes (UI components, colors, i18n, database) are in [CLAUDE.md](./CLAUDE.md).

## License

Proprietary.
