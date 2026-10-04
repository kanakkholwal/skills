# <Project> design contract (baby-ui based)

Given verbatim to every page subagent. Fill each `<...>`; delete lines that don't apply.

Reference implementation: `<home route file>` + `<shell and primitive folders>`. Read them first and match them.

## Stack rules
- Components: baby-ui only, installed under `<ui path>`. Install more with
  `<npx shadcn@latest add @baby-ui/<name> --yes | npx shadcn-svelte@latest add https://baby-ui.pages.dev/svelte/r/<name>.json>`.
- Never import: `<legacy motion libs, old icon sets, Radix/vaul, legacy component folders, style-system hooks>`.
- Icons: `<Icon name="..." />` from `<icons module>`; names in `<manifest>`. To add one, add an entry and run
  `<generator command>`.
- Class merge helper `cn` from `<path>`. Links: `<internal Link>`, `<ButtonLink/ArrowLink/TextLink>`.
- Layout primitives: `Page`, `PageHeader`, `Section`, `Meta`, `Well`, `PixelHeading` from `<path>`.
- Lists: reuse `<ProjectList/PostList>` row recipe for every list of links.
- The root layout renders header, footer, command menu and toaster. Pages render only `<Page>...</Page>`.

## Visual rules
- One column at `Page` width. Wide data breaks out with negative margin only when it must.
- Surfaces: `bg-background`; grouped content in `Well` or `rounded-xl border border-border`. Token shadows only.
  No gradients, glows, dot grids, noise.
- Type: body `text-base` muted for prose, `text-sm` in lists; titles `font-medium text-foreground`. Display only
  via `PixelHeading`. Sizes xs/sm/base/lg/2xl/4xl/6xl only. No `text-[Npx]`.
- Colour: neutral tokens; brand moments on `--primary` / `--accent-ink`; status colours only for real status;
  charts `--chart-1..5`.
- Hover fills `bg-foreground/[0.03]` rows, `[0.06]` controls, gated `hoverable:` / `pointer-fine:`.
- Copy: no em or en dashes, no buzzwords. Lowercase pixel titles end with a full stop (`projects.`).

## Motion rules
- CSS only. `duration-(--duration-instant|fast|base|slow)`, `ease-(--ease-out)`, presses
  `active:scale-(--press-scale|-row|-sm|-surface)`.
- Entrances: `rise` + `--i` on top-level blocks only. Nothing else animates on scroll except counters.
- Disclosure: grid-rows 0fr → 1fr. Never conditional-mount content that animates out.
- Shared transition elements set `--vt-name` (applied by global CSS outside the theme reveal). Unique per page.
- Reduced motion: opacity only.

## Code rules
- Comments max 2 lines, only for non-obvious facts. No file headers, no JSX narration.
- Strict types, no `any`. Shape time-dependent data on the server (hydration).
- Verify: `<typecheck command>` filtered to your files; screenshot
  `node <skill>/scripts/shot.mjs <base> <outdir> <route>` (dev server on `<port>`).
