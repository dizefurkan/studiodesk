# StudioDesk — working rules

## UI components: shadcn only
- **Never hand-write basic UI components** (button, input, select, dialog, badge, switch,
  toast, field, empty state, dropdown, tabs, etc.). Use shadcn/ui. If a component is missing, add it with:
  ```bash
  scripts/shadcn-add.sh <name> [<name> ...]          # never overwrites existing files
  scripts/shadcn-add.sh --overwrite <name>           # replace with the registry version
  ```
  (wraps `npx shadcn@latest add`; runs in a temp copy, fixes the registry's bare `cn` import,
  installs new deps for macOS arm64). Use the shadcn MCP server (`.mcp.json`) to search the
  registry and read examples (`get_item_examples_from_registries`) first.
- `components/ui/*` is shadcn-owned. Don't edit those files for one-off styling; compose instead.
- Destructive confirmations → `AlertDialog`. Feedback → `sonner` toast. No `window.confirm/alert`.
- Forms → `Field` + `Input`/`Select`/`Switch`/`Checkbox`/`RadioGroup`. No raw `<select>`, `<input>`,
  `<button>`, `<label>`, `<table>`: use `Select` (or `NativeSelect` inside plain HTML forms), `Input`,
  `Button`, `Label`/`FieldLabel`, `Table`.
- Confirm prompts: `const confirm = useConfirm()` (components/common/ConfirmProvider) →
  `if (!(await confirm({ title, destructive: true }))) return`. Server action + toast: `hooks/useServerAction`.
- Modals → `Dialog` / `Sheet` / `AlertDialog`. Menus → `DropdownMenu`. Never `fixed inset-0` overlays.
- Installing any npm package from the Linux VM against this Mac checkout:
  `npm install <pkg> --os=darwin --cpu=arm64` (don't let Linux binaries land in node_modules).

## Tables, empty states, i18n
- Lists → `components/table/data-table` (shadcn DataTable). Column headers are translated:
  `header: () => <ColumnHeader k="name" />` (keys under `table.*`).
- No records yet → `EmptyState` (Lottie + one create action) and **no** header create button;
  with records or active filters → `PageHeader` action + DataTable.
- No hardcoded UI text: every string goes into `messages/tr.json` **and** `messages/en.json`
  (same keys, valid ICU — plurals as `{count, plural, one {…} other {…}}`). That includes
  placeholders, aria-labels, toasts, zod messages (build the schema with `makeXSchema(t)`)
  and **server action errors**: `return { error: await actionError('key') }` (`lib/i18n/actionError`,
  keys under `serverErrors`). Never compare against a translated message; return a flag instead.
- Dates/days in the app locale: `<FormattedDate value=… />`, `useLocaleNames()` (weekday/month
  names), `useDateFnsLocale()` for date-fns `format`, `weekdayNames(locale)` on the server.
  Money: `formatCurrency(value, organization.currency)` — never a hardcoded `₺`/`$`.
- Turkish tone: buttons/labels/placeholders stay neutral ("Kaydet", "Öğrenci ekle", "Şube seç").
  Sentences address the user as "siz" with the plain imperative: "Lütfen bir şube seçin",
  "Şifrenizi girin", "Yetkiniz yok". Never "sen" forms ("seç", "şifreni", "yetkin yok") and
  never the bureaucratic "-iniz" imperative ("giriniz", "seçiniz").
- Navigation: `Link`, `useRouter`, `redirect` from `@/i18n/navigation` (locale is added automatically;
  write hrefs without it). Not `next/link` / `next/navigation` (except `notFound`, `useSearchParams`, `usePathname`).
  Refresh server data with `router.refresh()`, never `window.location.reload()`.

## Theme
- Colors are tokens in `app/globals.css` (`primary`, `highlight`, `muted-foreground`, `border`, …).
  **No hardcoded hex / Tailwind gray|indigo classes** in components.
  Status colors (green/amber/red/blue) are fine for success/warning/error/info only.
- Brand: ink-green primary `#1E2A14` (buttons, links, active), lime highlight `#C6F432` (CTAs, badges; ink text on it),
  green-tinted ink `#1C2114`. App screens on white; the public site on `bg-canvas`. Status: `success` / `warning` / `danger` tokens.
  Logo: `components/brand/Logo.tsx` (`<Logo />`, `<LogoMark />`); static assets in `public/brand`, favicon `app/icon.svg`.

## Database
- Schema lives only in `supabase/migrations/` (see `database/README.md`). New change = new migration file.
- Supabase project: `studiodesk` (eu-central-1, ref `bymqrtvzlakwbdgyznxz`).
- After a schema change regenerate `lib/types/database.types.ts` and check the Supabase advisors.
- Writes go through server actions in `lib/actions/*` with a role check; never trust a client-sent
  organization id. Service-role client (`lib/supabase/admin`) only on the server.
- The service-role client bypasses RLS, so **every** admin query is scoped to `getOrganization().id`
  in the query itself (`.eq('organization_id', …)` or an `!inner` join + `.eq('branches.organization_id', …)`),
  or runs only after an RLS-client lookup proved access. Never filter other tenants out in JS.
  Prefer the RLS client (`createServerSupabaseClient`) when it can do the job.
- `getOrganization()` only honours the `organization_id` cookie when the user is a member.
- No `any`: use the generated types (`Tables<'x'>`, `TablesUpdate<'x'>`), let Supabase infer select
  results, and type UI props from the action with `ActionData<typeof action>` (`lib/types/actions`).
- User search terms interpolated into `.or()` / `ilike` go through `sanitizeSearch` (`lib/utils/search`).
- `proxy.ts` (Next 16 middleware) runs next-intl and refreshes the Supabase session cookies — keep both.
- In `catch` blocks of server code that reads cookies/headers, call `unstable_rethrow(err)` first.
