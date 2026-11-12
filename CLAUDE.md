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

## Theme
- Colors are tokens in `app/globals.css` (`primary`, `highlight`, `muted-foreground`, `border`, …).
  **No hardcoded hex / Tailwind gray|indigo classes** in components.
  Status colors (green/amber/red/blue) are fine for success/warning/error/info only.
- Brand: rose primary `#D9265F`, amber highlight `#FFC857`, warm stone neutrals.
  Logo: `components/brand/Logo.tsx` (`<Logo />`, `<LogoMark />`); static assets in `public/brand`, favicon `app/icon.svg`.

## Database
- Schema lives only in `supabase/migrations/` (see `database/README.md`). New change = new migration file.
- Supabase project: `studiodesk` (eu-central-1, ref `bymqrtvzlakwbdgyznxz`).
