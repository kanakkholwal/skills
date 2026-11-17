# Pre-ship checklist

Walk it before calling any UI done. Each line links to where the rule is explained.

## System

- [ ] Tokens exist for colour, type sizes, spacing, radius, shadow, duration, easing; no raw values in components
- [ ] One neutral ramp, one accent, status colours; no stray shades or opacities ([color.md](color.md#palette-shape))
- [ ] One icon set, stroke matched to text weight ([typography.md](typography.md#icons-beside-text))

## Colour

- [ ] Accent only on the primary action and what is being sold ([color.md](color.md#where-the-accent-goes))
- [ ] Body text 4.5:1, UI boundaries and focus 3:1, measured with `color-audit.mjs`
- [ ] Authored in OKLCH; gradients `in oklch`; borders alpha ([color.md](color.md#borders-tints-and-gradients))
- [ ] Dark mode depth from lighter surfaces; `color-scheme` and `theme-color` set

## Typography

- [ ] Scale ratio at least 1.25; tracking tuned by size ([typography.md](typography.md#tracking-and-leading-by-size))
- [ ] Headlines balanced, paragraphs `text-wrap: pretty`, no widows, 45-75ch measure
- [ ] `tabular-nums` on prices, stats, tables, timers
- [ ] Real `…`, curly quotes, non-breaking spaces in units and shortcuts; no headline periods

## Layout

- [ ] Spacing from one scale; groups separated by at least 2x their inner gap ([layout.md](layout.md#spacing-and-grouping))
- [ ] Inner radius = outer radius - padding ([layout.md](layout.md#concentric-radius))
- [ ] Optical alignment checked on icons, play buttons, headline edges, centred hero content
- [ ] Hit areas 24px minimum, 44px on touch; `dvh` not `vh`; safe-area insets on fixed bars
- [ ] No layout shift: media dimensions, matching skeletons, metric-matched font fallbacks

## Surfaces and states

- [ ] One edge strategy per surface; layered, tinted shadows ([surfaces.md](surfaces.md#borders-and-shadows))
- [ ] Hover, active, focus-visible, disabled and loading states on every control
- [ ] Loading, empty, error and success states on every async surface ([surfaces.md](surfaces.md#loading-empty-error-success))
- [ ] Carousels and scroll rails fade with a mask; product shots have transparent backgrounds for dark mode

## Motion

- [ ] Every animation has a named purpose and passes the frequency gate ([../motion/index.md](../motion/index.md))
- [ ] Enter ease-out, exits ~20% shorter, popovers from the trigger at 0.95 ([../motion/standards.md](../motion/standards.md#ui-choreography))
- [ ] `prefers-reduced-motion` handled; hover motion gated to fine pointers

## Slop

- [ ] `node scripts/slop-scan.mjs <src>` shows zero `fix` hits; every `check` hit is a deliberate choice
- [ ] Nothing from the ban list in [slop.md](slop.md) survives

## Verify

- [ ] Screenshots at 375 and 1440px, light and dark, and the loading, empty and error states
- [ ] Primary task completed with keyboard only
