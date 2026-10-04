# Phase 5: Motion

Load `emil-design-eng` and `apple-design`. Motion is CSS only on baby-ui's contract.

## Contract

- Durations only via tokens: `--duration-instant | fast | base | slow`. Easing `--ease-out` (enter, UI),
  `--ease-in-out` (on-screen movement). Never `ease-in` on UI.
- Press: `active:scale-(--press-scale)` (rows `--press-scale-row`, big surfaces `--press-scale-surface: 0.995`,
  otherwise large cards visibly shrink).
- Popovers scale from their trigger (`transform-origin: var(--transform-origin)`); modals stay centred.
- **Frequency rule:** command palette and keyboard actions do not animate open/close. Hovers stay subtle.
- Disclosure: `grid-template-rows: 0fr → 1fr`. Never conditional-mount content that must animate out.

## Entrances

One class, staggered once on load: `.rise` with `--i` per top-level block. Nothing else animates on scroll
except counters (`RollingDigits startOnView`).

## Page transitions (View Transitions API)

- Router: `defaultViewTransition: true` (TanStack). SvelteKit, in the root `+layout.svelte`:

```ts
onNavigate((navigation) => {
  if (!document.startViewTransition) return;
  return new Promise((resolve) => {
    document.startViewTransition(async () => {
      resolve();
      await navigation.complete;
    });
  });
});
```
- Root: old fades out with 2px blur in `fast`; new fades in with blur and a 6px lift in `slow`.
- Persistent chrome (header, sidebar, top bar) gets its own `view-transition-name` with `animation: none`, so
  it doesn't flicker or lag behind the content.
- Shared elements (project title list → detail) set the same name on both sides via a CSS var, and names are
  only applied outside the theme reveal:

```css
html:not([data-theme-reveal]) [style*="--vt-name"] { view-transition-name: var(--vt-name); }
```

Why: the dark-mode reveal is one whole-page snapshot. If named elements exist during it, they animate on their
own clock and the sidebar/nav visibly lag or flicker.

## Text effects (baby-ui `text/*`)

| Effect | Where |
| --- | --- |
| RevealText | hero name, 404 |
| TextLoop (variant `roll`, not fade: fade overlaps text) | rotating roles |
| RollText / IconRoll | nav rows, footer links, social icons, CTAs on hover |
| TextTransition | breadcrumb, live clock |
| RollingDigits | every stat |
| Marker | short inline links in prose (≤ ~28 chars), drawn on view |

IconRoll is not a registry item: it is a two-slot clip (icon above, copy below, translate -50% on hover) built
locally on RollText's timing. Pin its halves (`h-1/2! w-full!`) or the incoming icon bleeds.

## First-visit intro

Greeting words in a few languages, then the name, then a clip-path lift. Rules learned the hard way:
- **Pure CSS timeline from first paint.** Durations pass from TSX as custom properties; JS only removes the
  node at the end. A JS-driven sequence waits for hydration and sticks on the first word.
- A head boot script adds `html.intro-done` when `sessionStorage` says it was seen, so returning visitors never
  see a frame of it. Keydown or pointerdown skips.
- Page `.rise` entrances are delayed until the curtain lifts (`html:not(.intro-done) .rise`).
- Reduced motion: skip straight to done.

## Reduced motion

Opacity only. View transitions fall back to a short fade; `::view-transition-group(*)` gets `animation: none`;
text effects render final state.

## Verify

Slow-motion check in DevTools Animations panel at 10 %, a dark-mode toggle while on a page with shared names,
rapid hover across nav rows, and the intro on a throttled "Slow 4G" profile.
