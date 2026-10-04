# Phase 3: Foundation

## Branch and notes

- `git switch -c feat/<name>-revamp` from a clean tree. Never commit; the user does.
- The notes folder (`.notes/` or `.local/`) exists and is gitignored. The audit and the design contract live there.

## baby-ui via the shadcn CLI

```bash
export MSYS_NO_PATHCONV=1   # Git Bash on Windows, or @baby-ui/... gets mangled into a path
npx shadcn@latest add @baby-ui/tokens @baby-ui/theme --yes          # tokens carry the motion vars
npx shadcn@latest add @baby-ui/button @baby-ui/command @baby-ui/tooltip ... --yes
# Svelte port, same names and props:
npx shadcn-svelte@latest add https://baby-ui.pages.dev/svelte/r/button.json
```

Check an item exists before planning around it:
`curl -s -o /dev/null -w "%{http_code}" https://baby-ui.pages.dev/svelte/r/<name>.json`.

- Registry: React `https://baby-ui.pages.dev/r/{name}.json`, Svelte `https://baby-ui.pages.dev/svelte/r/{name}.json`.
  React files land in `src/components/{ui,blocks,charts,text}`; Svelte in the `components.json` aliases
  (usually `src/lib/components/...`). Interactive parts sit on Base UI (React) or bits-ui (Svelte).
- `components.json`: aliases must match tsconfig. If `@/` points at a root folder but the CLI writes to `src/`,
  move the folder into `src/` and repoint `@/*` → `./src/*` in tsconfig and the bundler config.
- The CLI writes component CSS to the file named in `components.json` (`src/styles/registry.css`); import it
  from the global stylesheet.
- **Known gap:** the CLI merges only theme *extensions*. Copy baby-ui `theme.css`'s full `@theme inline` block
  into the global stylesheet, or `bg-popover`, `text-popover-foreground` and friends resolve to nothing
  (symptom: transparent command dialog).
- **Known registry bug:** blocks import `@/components/charts/<x>/<x>`; rewrite to `@/components/charts/<x>`.
- Pro components: copy source directly from `../baby-ui` when the registry lacks them.
- Vendored dirs fail strict Biome rules (`noArrayIndexKey`, `useExhaustiveDependencies`): add a Biome override
  for `src/components/{ui,blocks,charts,text}` instead of editing vendored code. Log the bug upstream.

## Configs loaded outside the bundler

Files like `source.config.ts` (fumadocs) run outside Vite, so `@/` aliases don't resolve there. Anything they
import (e.g. an icon zod schema) must use relative imports only.

## Fonts

- Geist (body), Geist Mono (dates, counts, eyebrows), Geist Pixel (display: name, section titles).
  `@fontsource-variable/*` packages, imported once in the global stylesheet.
- Animate Pixel's `ELSH` axis via `@property --elsh` (registered `<number>`) so it can transition.
- Drop every face used in one place only.

## Icons

One family pair: Solar (line-duotone / linear) + Simple Icons for brands. Generate React components from a
manifest (`src/components/icons/icons.json` → `scripts/generate-icons.mjs` → `<Icon name="..." />`).
Remove lucide-react, react-icons and inline SVG copies.

## Delete first

Removing legacy before building avoids half-migrated pages:
- Style systems/variants, story modes, background effects, Lenis, framer-motion, recharts (baby-ui charts
  replace it), Radix/vaul (Base UI underneath baby-ui), magicui/kibo/`animated/*`, tw-animate-css.
- `bun remove ...` then typecheck to find every importer.

## Design contract for subagents

Before fanning pages out, write `<notes>/design-contract.md` from
[design-contract-template.md](design-contract-template.md): reference implementation files, allowed imports,
banned imports, layout primitives, visual rules, motion rules, code rules, verify commands. Every page agent
gets it verbatim and must match the reference page. Review each page's output yourself with screenshots.
