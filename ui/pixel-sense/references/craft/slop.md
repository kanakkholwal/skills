# Slop: tells, detection, fixes

Generated UI converges on the same moves. Each one is cheap to produce, so its presence reads as
"nobody decided this". This file wins over every other reference and over `data/` rows.

`node scripts/slop-scan.mjs <src>` catches the mechanical ones (id in brackets). The rest need eyes.

## Contents

- [Ban list](#ban-list)
- [Allowed when chosen](#allowed-when-chosen)
- [Deslop pass](#deslop-pass)
- [Copy tells](#copy-tells)

## Ban list

| Tell                                                                                | Detect                                 | Fix                                                        |
| ----------------------------------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------- |
| Eyebrow above the headline ("NEW IN BETA", "FEATURES")                              | `[eyebrow]`, tiny caps + wide tracking | Delete it, or put the fact in the headline                 |
| Decorative pills and tags                                                           | `[pill-chip]`                          | Keep pills only for filters, status, toggles, counts       |
| Italic accent word in a headline                                                    | `[italic-heading]`                     | Set it roman. Italic is for titles and terms, not emphasis |
| Instrument Serif (and other reflex faces: Space Grotesk, default Inter for display) | `[instrument-serif]`                   | Pick a face for the brand; `search.mjs -d google-fonts`    |
| Crushed display tracking (-0.04em and tighter)                                      | `[crushed-tracking]`                   | -0.01 to -0.02em on display sizes only                     |
| Excessive mono (labels, nav, body in mono)                                          | `[mono-overuse]`                       | Mono for code, IDs, keyboard keys, aligned figures         |
| All-caps subtitles and section kickers                                              | `[eyebrow]`                            | Sentence case; hierarchy from size and weight              |
| Full stop at the end of a headline                                                  | `[headline-period]`                    | Drop it. Headlines are labels, not sentences               |
| Section numbering (01, 02, 03)                                                      | `[section-number]`                     | Only when the sections are a real sequence                 |
| Code breadcrumbs as decoration (`~/about`, `// features`, `<Hero />`)               | eyes                                   | Real breadcrumbs only for real hierarchy                   |
| A border on every container, nested cards                                           | `[hex-border]`, eyes                   | Group with spacing; one surface level per region           |
| Divider between every block                                                         | eyes, count `<hr>` / `divide-y`        | Spacing first; a divider only between unlike groups        |
| Many shades and opacities of one colour                                             | eyes, count unique tokens              | 1 neutral ramp + 1 accent + status colours                 |
| Gradient page and section backgrounds                                               | `[gradient-bg]`                        | Solid surface; gradient only if it is the chosen direction |
| Gradient text on headings or metrics                                                | `[gradient-text]`                      | Solid colour; size and weight carry emphasis               |
| Purple/indigo/cyan defaults, coloured glows                                         | `[ai-purple]`, `[glow]`                | Brand-derived palette; depth from surface lightness        |
| Glassmorphism as decoration                                                         | `[glass]`                              | Only where a layer must show what is behind it             |
| Dithering, halftone, ASCII art as filler                                            | eyes                                   | Only as a chosen direction (see below)                     |
| Squircle icon tiles above every heading                                             | eyes                                   | Icon inline with the heading, or no icon                   |
| Identical 3-up feature cards (icon, title, two lines)                               | eyes                                   | Show the product; vary scale by importance                 |
| Hero metric row (big number, small label, x3)                                       | eyes                                   | Only real, sourced numbers, and only if they persuade      |
| Over-detailed fake UI and diagrams in the hero                                      | eyes                                   | A real screenshot or a live component                      |
| Emoji as icons                                                                      | `[emoji-icon]`                         | One SVG set, stroke matched to text weight                 |
| Hover lift and image zoom on cards                                                  | `[hover-lift]`                         | Contrast change; layout stays still                        |
| Bouncy or elastic easing on everyday UI                                             | `[bounce-ease]`                        | Strong ease-out; spring only for gestures                  |
| Card radius 24px+ everywhere                                                        | `[big-radius]`                         | 12-16px; nested radius = outer - padding                   |
| Verbose or redundant text, labels repeating the heading                             | eyes                                   | Cut it. If the icon or heading says it, the label goes     |
| Em and en dashes in copy                                                            | `[em-dash]`                            | Comma, colon, full stop, parentheses                       |

## Allowed when chosen

Dithering, halftone, ASCII, pixel mosaics, grain, gradients, glass and mono-heavy layouts are
genres, not defaults. They are fine when the user picked them in the direction step
([direction.md](direction.md)) and they are used everywhere consistently. One dithered image on an
otherwise clean SaaS page is slop; a whole site built on a dither system is a style.

## Deslop pass

Run in this order. Earlier steps remove things that later steps would otherwise polish.

1. **Delete**: filler badges, eyebrows, redundant labels, decorative dividers, dithering and
   embellishments that carry no information.
2. **Unstyle**: un-italicise random words, drop headline periods, mono back to the body face,
   all-caps back to sentence case.
3. **Systemise**: one spacing scale, one radius scale, one neutral ramp, one accent, one icon set.
   Use the repo's design system if one exists ([checklist.md](checklist.md) lists the tokens).
4. **Show the product**: a real screenshot, a live component or the actual output beats any
   illustration. Enlarge the main feature until it dominates the fold.
5. **Sharpen the words**: headline names who it is for and what changes for them; no slogan
   ([copy tells](#copy-tells)). Wrap with `text-wrap: balance`; no orphan on the last line.
6. **Hierarchy**: one primary CTA, emphasised by the accent and by isolation, not by size alone.
   Group with spacing (proximity), not with boxes.
7. **Precision**: concentric radii, alpha borders, optical alignment, tabular numbers, icon stroke
   matched to type weight, text contrast at 4.5:1 ([layout.md](layout.md), [typography.md](typography.md)).
8. **States**: loading, empty, error and success exist for every async surface; feedback animates
   only where it explains something ([../motion/standards.md](../motion/standards.md)).
9. Re-run `slop-scan.mjs` and screenshot at 375px and 1440px, light and dark.

## Copy tells

- Slogans with no noun ("Build faster. Ship smarter."). Replace with the specific outcome:
  "Invoices your accountant can import, sent in one click".
- Buzzwords: seamless, empower, unlock, supercharge, next-generation, world-class, effortless.
- Rebuttal cadence repeated per section ("Not X. Y."). Once is a style; three times is a template.
- Three-item lists everywhere. Use the real count.
- "Loading..." with three dots, "Click here", "Learn more" without an object.
