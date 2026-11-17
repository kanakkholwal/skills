# Design audit

One pass across system, visual craft, motion and UX, ending in ranked fixes. Read-only until
the user approves the fix list.

## Contents

- [Scope](#scope)
- [Steps](#steps)
- [Scorecard](#scorecard)
- [Report format](#report-format)

## Scope

| Asked for                                     | Run                                                            |
| --------------------------------------------- | -------------------------------------------------------------- |
| "Audit the design" / "why does this look off" | Steps 1-6                                                      |
| Design system or tokens only                  | Steps 1, 2, 3                                                  |
| One screen or a diff                          | Steps 1, 4, 5 on that surface                                  |
| A flow (sign-up, checkout)                    | Step 6 plus [../ux/friction-audit.md](../ux/friction-audit.md) |
| Motion only                                   | [../motion/audit.md](../motion/audit.md)                       |

## Steps

1. **Look at the real thing.** Screenshot at 375, 768 and 1440px, light and dark, plus loading,
   empty and error states. Reading code alone misses contrast, overflow and alignment.
2. **Inventory the system.** Count unique colours, font sizes, radii, shadows, spacing values and
   icon sets in use (grep the source). More than one scale of anything is drift.
3. **Measure colour.** `node scripts/color-audit.mjs tokens <file>` on every token file and app
   override. Contrast and CVD failures are findings with numbers, not adjectives.
4. **Scan for slop.** `node scripts/slop-scan.mjs <src>`. Then walk [slop.md](slop.md) by eye for
   the tells a regex cannot see (identical card grids, fake UI, verbose copy).
5. **Craft pass.** Walk [checklist.md](checklist.md): typography, layout and optical alignment,
   surfaces, states, motion.
6. **UX pass.** Heuristics and laws ([../ux/01-core-principles.md](../ux/01-core-principles.md),
   [../ux/02-laws-of-ux.md](../ux/02-laws-of-ux.md)), WCAG 2.2 AA
   ([../ux/03-accessibility.md](../ux/03-accessibility.md)), and the primary task with keyboard only.

## Scorecard

Score each 0-3 (0 broken, 1 weak, 2 sound, 3 distinctive). Report the scores, not an average.

| Area       | 3 looks like                                                   |
| ---------- | -------------------------------------------------------------- |
| Direction  | One clear point of view, applied everywhere                    |
| Colour     | One accent on what matters, measured contrast, OKLCH ramps     |
| Typography | Purposeful faces, real scale, tuned tracking, tabular figures  |
| Layout     | One spacing scale, grouping by proximity, optically aligned    |
| Surfaces   | Concentric radii, alpha borders, depth that works in dark mode |
| States     | Every async surface has loading, empty, error, success         |
| Motion     | Purposeful, fast, interruptible, reduced-motion safe           |
| UX         | Primary task obvious, accessible, low friction                 |
| Slop       | Zero `fix` hits; every `check` hit justified                   |

## Report format

Findings ranked by user impact, not by checklist order:

```
[Blocker|Major|Minor] <what is wrong>: <who it hurts and how>
  Where: <screen or file:line>
  Evidence: <number, screenshot, scan id>
  Fix: <concrete change>   Ref: <reference file#section>
```

Then a fix plan grouped into batches that can ship independently (tokens first, then
components, then pages). Long reports go in the notes folder; the reply gets the top findings and
the scorecard.
