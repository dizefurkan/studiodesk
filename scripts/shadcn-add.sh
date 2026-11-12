#!/usr/bin/env bash
# Add shadcn/ui components safely from the Linux VM (Claude) or any machine.
#   scripts/shadcn-add.sh radio-group switch ...
#   scripts/shadcn-add.sh --overwrite calendar   # replace the named components with the registry version
# - runs the CLI in a throwaway copy, so a Linux `npm install` never touches the Mac node_modules
# - never overwrites existing components/ui files
# - rewrites the registry's bare `from "cn"` import to the project alias
# - installs new npm deps for macOS arm64 (the dev machine)
set -euo pipefail
OVERWRITE=0
if [ "${1:-}" = "--overwrite" ]; then OVERWRITE=1; shift; fi
[ $# -gt 0 ] || { echo "usage: $0 <component> [...]"; exit 1; }
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$ROOT"
cp package.json package-lock.json components.json tsconfig.json "$TMP"/
mkdir -p "$TMP/app" "$TMP/components" "$TMP/lib" "$TMP/hooks"
cp app/globals.css "$TMP/app/"; cp -r components/ui "$TMP/components/"; cp lib/utils.ts "$TMP/lib/"
if [ "$OVERWRITE" = 1 ]; then for n in "$@"; do rm -f "$TMP/components/ui/$n.tsx"; done; fi
cd "$TMP"
npx -y shadcn@latest add "$@" --yes < <(yes n) >"$TMP/shadcn.log" 2>&1 || { cat "$TMP/shadcn.log"; exit 1; }
grep -rl 'from "cn"' components/ui hooks 2>/dev/null | xargs -r sed -i.bak 's#from "cn"#from "@/lib/utils"#' ; find . -name '*.bak' -delete
added=()
for f in components/ui/*.tsx hooks/*.ts hooks/*.tsx; do
  [ -f "$f" ] || continue
  name="$(basename "$f" .tsx)"
  forced=0; if [ "$OVERWRITE" = 1 ]; then for n in "$@"; do [ "$n" = "$name" ] && forced=1; done; fi
  if [ ! -f "$ROOT/$f" ] || [ "$forced" = 1 ]; then mkdir -p "$ROOT/$(dirname "$f")"; cp "$f" "$ROOT/$f"; added+=("$f"); fi
done
# new runtime deps (ignore the bogus "cn" package the registry sometimes adds)
newdeps=$(node -e '
const a=require(process.argv[1]).dependencies||{}, b=require(process.argv[2]).dependencies||{};
console.log(Object.keys(b).filter(k=>!(k in a)&&k!=="cn").map(k=>k+"@"+b[k]).join(" "))' "$ROOT/package.json" "$TMP/package.json")
cd "$ROOT"
if [ -n "$newdeps" ]; then
  case "$(uname -s)" in Darwin) npm install $newdeps --no-audit --no-fund ;; *) npm install $newdeps --os=darwin --cpu=arm64 --no-audit --no-fund ;; esac
fi
echo "added: ${added[*]:-none}"; echo "deps: ${newdeps:-none}"
grep -iE "remember|wrap your app" "$TMP/shadcn.log" || true
