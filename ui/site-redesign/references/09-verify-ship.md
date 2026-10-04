# Phase 10: Verify and ship

## Gates (paste the output in the reply)

```bash
bun run typecheck            # must regenerate generated sources first, see below
bunx biome check .           # 0 errors; warnings listed honestly
node scripts/check-comments.mjs --all
bun run build
```

Plus the language formatter for anything else touched (`cargo fmt --all --check`).
SvelteKit: `svelte-kit sync && svelte-check` replaces tsc (sync generates `.svelte-kit/types`, gitignored, so
CI needs it too). If the repo already has a gate script (`scripts/gate.mjs`, `pnpm verify`), run that instead.

## CI parity traps

- **Generated sources are gitignored.** fumadocs `.source/`, route trees, icon outputs: CI typecheck fails with
  "Cannot find module 'fumadocs-mdx:collections/server'" and a cascade of implicit-any errors. Fix:
  `"postinstall": "fumadocs-mdx"` and `"typecheck": "fumadocs-mdx && tsc --noEmit"`. Prove it by moving the
  generated folder away and running the script from clean.
- **Empty test suites fail.** `bun test` exits 1 with no test files after deleting legacy tests. Use
  `bun test --pass-with-no-tests` in the `test` script and call `bun run test` from CI.
- **Line endings.** With `core.autocrlf=true`, a checkout rewrites files to CRLF and Biome's formatter flags
  every file. `biome format --write` restores LF; `git diff` then shows only real changes even though
  `git status` lists many files. Suggest `git config core.autocrlf input` per repo.
- **Stale Vite dep cache** after mass reformatting: dev SSR 500s on a missing `deps_ssr/*.js`. Restart with
  `vite dev --force`.
- Workflow `paths-ignore: .github/**` skips CI for workflow-only commits; pair workflow edits with a code change.

## Screenshot matrix

`scripts/shot.mjs <base> <outDir> home projects ...` with `THEMES=light,dark WIDTHS=375,1280`. Compare to
`before/`. Then `scripts/states.mjs` for slow navigation (pending UI after `defaultPendingMs`), server error
(error component in layout), and a 404.

Also by hand: reduced motion (DevTools rendering emulation), keyboard-only pass (focus ring visible on every
control, palette opens with the shortcut), dark-mode toggle on a page with shared transition names.

## Route smoke test

Every route returns 200 (`scripts/seo-crawl.mjs` doubles as this), no `pageerror` or console errors in the
screenshot run, worker bundle size noted (gzip) against the plan limit.

## Handoff

- Update `<notes>/redesign-audit.md`: ticked checklist, decisions log, follow-ups (keys to set, ids to provide,
  upstream bugs filed).
- Reply: one line per area changed, the user's to-dos (secrets, ids, commit), known warnings, risks.
- Never commit or push; if push protection blocks the user, explain the unblock URL vs a history rewrite and
  let them choose.
