---
name: site-redesign
description: End-to-end redesign of an existing web app or portfolio as a senior design engineer. Audit, pick one direction, rebuild on baby-ui tokens and motion, rewrite copy, then SEO, caching and CI gates. Use when asked to "revamp", "redesign", "audit and rebuild" a site, move it onto baby-ui, or write a redesign brief (redesign.md) for a repo.
---

# Site Redesign

The workflow behind the kanakkholwal.eu.org revamp (Oct 2026): one audit, one design, everything rebuilt on
[baby-ui](https://baby-ui.pages.dev), then content, SEO, performance and CI brought up to the same bar.
It is a sequence of phases with user checkpoints, not a one-shot rewrite.

## Hard rules

1. **Plans and notes live in the repo's gitignored notes folder**: an existing `.notes/` or `.local/`, else
   create `.local/` and gitignore it. Never publish artifacts.
2. **Never commit or push.** The user commits. Never print or commit secrets; `.env.example` keys stay empty.
3. **Writing rules everywhere** (UI copy, comments, docs, replies): no em or en dashes, no buzzwords, specific
   and plain. Comments max 2 lines, only for facts the code can't say. Replies short, bullets.
4. **One design.** Delete style switchers, variants, background effects. If two looks exist, pick one.
5. **Measure, don't adjective.** Contrast ratios, durations, request counts, bundle size, before/after shots.
6. **Primary sources beat secondary ones.** A thesis PDF beats the repo README; the live API beats the docs.
7. **Nothing is done without gate output pasted**: typecheck, lint, comment gate, build, screenshots.
8. **Existing owner decisions win.** Read the repo's briefs, DESIGN.md and notes first. Fixed fonts, a chosen
   accent or banned patterns override this skill's defaults. The portfolio's rail shell and CSS-only motion
   are approved for reuse in any project, including sibling products.

## Companion skills (load at the phase that needs them)

| Phase | Load |
| --- | --- |
| Audit, colour, tokens | `auditing-design-systems`, `ui-ux-pro-max` |
| Motion | `emil-design-eng`, `apple-design`, `improve-animations` (audit mode only) |
| Modern CSS/APIs (view transitions, `@property`, popover) | `modern-web-guidance` |
| Workers, caching | `workers-best-practices` |
| Svelte targets | `svelte-core-bestpractices` and the matching `svelte-*` skill |
| Copy cleanup | `deslop` |

## Workflow

Each phase has a reference file. Read it when you enter the phase, not before.

1. **Recon + audit** → [references/01-audit.md](references/01-audit.md)
   Baseline screenshots, inventory (component sources, icon sets, fonts, motion libs, token model), four-part
   audit (system, visual, motion, UX). Write `<notes>/redesign-audit.md`.
2. **Direction (checkpoint)** → same file. Study the user's reference sites, offer 2 to 3 concrete directions
   with ASCII mockups via AskUserQuestion. Log the pick in the decisions log. Do not build before this.
3. **Foundation** → [references/02-foundation.md](references/02-foundation.md)
   Branch, baby-ui via shadcn CLI, alias fixes, theme mapping gap, fonts, icon manifest, delete legacy deps,
   write `<notes>/design-contract.md` for subagents.
4. **Colour + tokens** → [references/03-tokens-color.md](references/03-tokens-color.md)
   Neutral base, accent presets on `--primary` with measured ink, boot script, crossfade on switch.
5. **Motion** → [references/04-motion.md](references/04-motion.md)
   Token durations only, view transitions with gated names, `rise` stagger, text effects, intro timeline,
   reduced motion.
6. **Shell + pages** → [references/05-shell-pages.md](references/05-shell-pages.md)
   Shell, page primitives, list rows, command palette, loading/error/404 states, mobile. Fan pages out to
   subagents with the design contract; review every page yourself.
7. **Content** → [references/06-content.md](references/06-content.md)
   Rewrite copy in the owner's voice, restructure case studies, verify every fact, credit references.
8. **OG + SEO** → [references/07-og-seo.md](references/07-og-seo.md)
   One OG card template with a version param, `seo()` helper, JSON-LD graph, sitemap, robots, crawl script.
9. **Data + performance** → [references/08-data-perf.md](references/08-data-perf.md)
   Server-only fetches, batched upstream calls, edge cache, response cache headers, router stale times.
10. **Verify + ship** → [references/09-verify-ship.md](references/09-verify-ship.md)
    Gates, screenshot matrix, state shots, CI parity (generated sources, empty test suites), handoff.

Upstream bugs found in baby-ui go to `../baby-ui/TODO.md` with repro and fix location, not into the reply.

## Writing a redesign brief instead

When asked for `redesign.md` in another repo: read its existing notes and briefs, run phase 1 read-only (one
survey subagent per repo, in parallel), spot-check the survey's key claims yourself, then fill
[references/redesign-brief-template.md](references/redesign-brief-template.md) with that repo's real stack,
routes, debt counts and a phased checklist. Every claim cites a path. The brief must be executable by an
agent with no memory of this session.

## Scripts

- `scripts/shot.mjs`: screenshot matrix (themes × widths × routes) with page/console errors logged.
- `scripts/states.mjs`: slow-network, server-error and 404 screenshots.
- `scripts/seo-crawl.mjs`: per-route status, title, description length, canonical, OG image, h1 and JSON-LD counts.
- `scripts/check-comments.mjs`: comment gate (max 2 lines, no headers, banners or blank comment lines).

All need `playwright` (or nothing, for the crawl) and a running dev server.

## Reply shape

Lead with the result. One line per change, then what the user must do (keys, ids, commits), then risks.
Findings and long notes go in the notes folder, the reply gets the one-line version.
