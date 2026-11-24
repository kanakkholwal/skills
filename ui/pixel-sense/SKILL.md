---
name: pixel-sense
description: Design, build, review, audit and deslop web UI like a senior design engineer. Use for any page, component, landing page, dashboard or design system, picking colours, fonts or a visual style, adding animation, or UI that looks generic or AI-made. Covers optical alignment, spacing, concentric radii, typography, OKLCH colour and one-accent palettes, contrast and colour-blind checks, motion choreography and gestures, UX laws, WCAG 2.2, friction audits of flows, and a searchable catalogue of styles, palettes, font pairings and stack rules. Not for video rendering or shaders.
license: MIT and Apache-2.0 portions, see LICENSE
compatibility: Scripts need Node 18+ and no packages. Everything else is plain markdown.
---

# Pixel Sense

Design like a senior UI/UX engineer: decide deliberately, measure instead of describing, and
leave out everything that does not earn its place. Load only the reference the task needs.
Script and reference paths are relative to this skill's folder.

## Modes

| The user wants | Mode | Load |
| --- | --- | --- |
| New page, app or component with no set look | **Direction**, then Build | [craft/direction.md](references/craft/direction.md) |
| Build, restyle, "make it look good" | **Build** | Workflow below, then the craft file for each decision |
| Review a screen, screenshot or diff | **Review** | [craft/checklist.md](references/craft/checklist.md), [ux/index.md](references/ux/index.md) |
| Audit a site, app or design system | **Audit** | [craft/audit.md](references/craft/audit.md) |
| "Looks AI-made", "generic", deslop | **Deslop** | [craft/slop.md](references/craft/slop.md) |
| Where users stall, cognitive load, ADHD-friendly | **Friction** | [ux/friction-audit.md](references/ux/friction-audit.md) |
| Pick brand colours, accent, palette, dark theme | **Colour** | [craft/color.md](references/craft/color.md) |
| Measure tokens, contrast, colour blindness, gamut | **Colour audit** | [color-system/index.md](references/color-system/index.md) |
| Fonts, scale, tracking, numbers, wrapping | **Type** | [craft/rules.md](references/craft/rules.md), [craft/typography.md](references/craft/typography.md) |
| Which UX law applies, and what to build for it | **Laws** | [craft/laws.md](references/craft/laws.md) |
| Spacing, alignment, radius, viewport, hit areas | **Layout** | [craft/layout.md](references/craft/layout.md) |
| Borders, shadows, masks, images, UI states | **Surfaces** | [craft/surfaces.md](references/craft/surfaces.md) |
| Animate, review motion, jank, gestures, "what's it called" | **Motion** | [motion/index.md](references/motion/index.md), [motion/principles.md](references/motion/principles.md) |
| Forms, navigation, tables, search, onboarding, AI UI, i18n, a11y | **UX** | Routing table in [ux/index.md](references/ux/index.md) |
| Styles, palettes, fonts, landing patterns, stack rules | **Catalogue** | [catalog.md](references/catalog.md) |

Review, Audit, Deslop and Friction are read-only until the user approves the fixes.

## Mandatory

**Any time motion, a transition or an animation is involved (building, auditing or fixing it),
[motion/ux-principles.md](references/motion/ux-principles.md) applies in full: check all 20
principles and apply every one that fits.**

Every build, restyle and review follows **all** of [craft/rules.md](references/craft/rules.md) (typography,
animation, transitions), [motion/principles.md](references/motion/principles.md) (every motion principle
and technique) and every law in [craft/laws.md](references/craft/laws.md) that touches the
screen, plus [craft/checklist.md](references/craft/checklist.md). These are not suggestions and
not "when it fits". Skip one only when the user says so for that case or the repo's own design
system decides it. When two rules conflict, or a rule conflicts with the repo, **stop and ask the
user** with 2-3 concrete options and your pick; never resolve it silently. Details: [rules.md#when-rules-clash](references/craft/rules.md#when-rules-clash).

## Hard rules

1. **Owner decisions win.** Read `DESIGN.md`, tokens, brand assets and notes first. Match the
   existing design system even where your taste differs.
2. **The user picks the direction.** For new UI with no set look, offer 3-6 options and wait.
   Where a direction exists, follow it and offer extensions as optional suggestions.
3. **[slop.md](references/craft/slop.md) beats catalogue rows and older references**, including catalogue rows and older
   references (the "2026 trends" in ux/04 included).
4. **One of each**: one accent, one spacing scale, one radius scale, one icon set, one texture.
5. **Measure, never adjective.** Contrast ratios, scan hits, pixel values, screenshots.
6. **Look at the result.** Render and screenshot before calling anything done.
7. **Every state ships**: loading, empty, error, success, focus, reduced motion.
8. **Real content.** Real product shots, real copy with a specific headline, realistic data.

## Build workflow

1. **Context**: stack, component library, tokens, nearby screens. Reuse before inventing.
2. **Direction**: existing, or offered and picked ([direction.md](references/craft/direction.md)).
3. **Content and hierarchy**: the one thing this screen is for, enlarged; one primary action;
   grouping by spacing ([layout.md](references/craft/layout.md#hierarchy)).
4. **Tokens**: OKLCH colour with one accent, type scale, 4px spacing scale, radius, shadow,
   duration and easing. Extend the repo's tokens instead of adding a parallel set.
5. **Compose** with the craft rules: typography, layout, surfaces.
6. **States** for every control and async surface ([surfaces.md](references/craft/surfaces.md)).
7. **Motion** only after the frequency and purpose gate ([motion/index.md](references/motion/index.md)).
8. **Verify**: [rules.md](references/craft/rules.md) line by line, `slop-scan.mjs`, `color-audit.mjs`, screenshots at 375 and 1440px in light and
   dark, then [checklist.md](references/craft/checklist.md).

## Defaults

Starting values when the repo has none. Each is explained in the craft files.

```css
:root {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);        /* enter and exit */
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);    /* on-screen movement */
  --border: oklch(0 0 0 / 0.08);                     /* alpha, blends on any surface */
  --radius: 14px;                                    /* nested: calc(var(--radius) - padding) */
}
h1, h2 { text-wrap: balance; letter-spacing: -0.015em; line-height: 1.08; }
p { text-wrap: pretty; max-inline-size: 65ch; }
.num, td, .price { font-variant-numeric: tabular-nums; }
.hero { min-block-size: 100dvh; }
button { transition: scale 140ms var(--ease-out); }
button:active { scale: 0.97; }
.popover { transform-origin: var(--transform-origin); }  /* from the trigger, start at 0.95 */
.rail { mask-image: linear-gradient(to right, transparent, #000 48px calc(100% - 48px), transparent); }
.bg { background: linear-gradient(in oklch, var(--a), var(--b)); }
```

Dropdowns 150-250ms, exits one half to one third of the entry, list stagger 30ms, no bounce on everyday
UI. Body text 4.5:1, UI boundaries 3:1, targets 24px minimum and 44px on touch.

## Scripts

```bash
node scripts/slop-scan.mjs <src>                        # generated-UI tells; exit 1 on "fix" hits
node scripts/color-audit.mjs tokens <tokens.css>        # contrast and CVD for every token pair
node scripts/search.mjs "<product> <tone>" --design-system   # data-backed direction seed
node scripts/search.mjs "<keywords>" -d style|color|typography|google-fonts|landing|ux|chart
```

## Reply shape

- **Build**: the code, then a few lines: direction used, tokens added, what to check by eye.
- **Review/Audit**: ranked findings (`[Blocker|Major|Minor] what: who it hurts / Where / Fix`),
  the scorecard, then the fix plan. Long reports go in the repo's notes folder.
- **Direction**: the options, then stop and wait for the pick.

Sources and licences: [LICENSE](LICENSE).
