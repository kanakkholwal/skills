# Phase 6: Shell and pages

## Shell (the "hybrid" that worked)

Desktop (lg+):
- Hatched side rails framing a centred column (`repeating-linear-gradient` hairlines at low opacity).
- Sticky left sidebar: pixel avatar, nav groups with counts (`projects 9`), a sliding active pill measured on
  the `li` (measuring the `a` puts it at the top), socials as IconRoll tiles, RollText labels.
- Top bar: breadcrumb (TextTransition), search button showing the shortcut, GitHub, X, accent picker, theme.
- Sections: number + lowercase pixel title with a full stop (`01 projects.`), optional description, dashed rule.

Mobile: top nav with grouped menu sheet, one column, no rails. Check alignment at 375 for every page.

Home: hero (name with RevealText, rotating role, location, 2 lines with Marker links) → activity card (contribution
calendar + "open to ..." line + primary CTA) → projects → experience → writing → open source → footer.

## Page primitives

`Page` (the `<main>` column), `PageHeader` (pixel h1, eyebrow, description), `Section` (number, title, meta,
action, dashed rule), `Meta` (mono xs muted), `Well` (card rim around a raised body), `PixelHeading`.
Pages render only `<Page>...</Page>`; layouts own the chrome.

## Lists

One row recipe for every list of links: dim-siblings on hover, title `font-medium`, description muted, meta in
mono, optional hover preview image rendered **in a portal** (inside a transformed parent it offsets).

## Command palette

baby-ui `command`, `launcher` variant (scope filters + key hints). Groups: pages, projects, writing, socials,
accent, theme, copy email.
Open it through a window event (`openCommandMenu()` dispatches, the menu listens), not React context: any
trigger rendered outside the provider (header, status frame) crashes with "must be used inside Provider".

## States

- Router defaults: `defaultPendingMs` / `defaultPendingMinMs` so fast navigations don't flash a loader,
  `defaultErrorComponent`, `defaultNotFoundComponent`.
- A thin nav progress bar at the top for pending navigations.
- Skeletons shaped like the content (`ProseSkeleton` with `role="status"`), never a centred spinner for >300 ms.
- Error page in the site's own layout: what happened in plain words, retry, home link. Raw error message only
  in DEV.
- Component-level `ErrorBoundary` around anything fed by third-party data (calendars, stats) so one failure
  doesn't blank the page.
- Empty states say what would appear and why it doesn't yet.

## Fan-out

Assign pages to subagents in batches with the design contract. After each batch: screenshot light/dark at
375 and 1280, compare to the reference page, fix drift yourself. Never trust "done" without the shot.

## Things users notice that audits miss

- Big cards shrinking on press (use the surface press scale).
- Text overlap in rotating text (fade variant) and icon bleed in rolls.
- Sticky elements and the sidebar lagging during the dark-mode reveal (gate VT names).
- Social links pointing at old handles; logos with broken URLs showing alt text.
- Horizontal scrollbars on wide widgets (hide the bar, add an edge fade).
