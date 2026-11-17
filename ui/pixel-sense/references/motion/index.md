# Motion Design

One bar for every motion task: Emil Kowalski's design-engineering philosophy, Apple's fluid-interface
principles, and library specifics for Motion and GSAP. Pick the mode, load only its reference, and
take every value from [standards.md](standards.md). Never approximate a curve or duration.

## Modes

| The user wants                                                       | Mode              | Load                                                                                                   |
| -------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------ |
| Animate something, add motion, build a transition                    | **Build**         | this file; full sequence in [build.md](build.md), components in [recipes.md](recipes.md)               |
| UI polish, component craft, "why does this feel off"                 | **Craft**         | [design-engineering.md](design-engineering.md) (Emil Kowalski, complete)                               |
| Review motion in a diff, PR or file                                  | **Review**        | [review.md](review.md) + [standards.md](standards.md)                                                  |
| Audit a codebase's motion and write fix plans                        | **Audit**         | [audit.md](audit.md), [audit-categories.md](audit-categories.md), [plan-template.md](plan-template.md) |
| "What could animate here?"                                           | **Opportunities** | [opportunities.md](opportunities.md)                                                                   |
| Jank, stutter, dropped frames, `will-change`                         | **Performance**   | [performance.md](performance.md)                                                                       |
| Drag, swipe, sheets, springs, momentum, materials, Apple feel        | **Fluid**         | [apple.md](apple.md)                                                                                   |
| "What's it called when..."                                           | **Name**          | [vocabulary.md](vocabulary.md), answer with the term only                                              |
| Motion for React specifics (`AnimatePresence`, `layoutId`, variants) | **Library**       | [framer-motion.md](framer-motion.md)                                                                   |
| GSAP tweens, eases, `matchMedia`                                     | **Library**       | [gsap.md](gsap.md)                                                                                     |

Review, Audit and Opportunities are read-only on source code. Build writes code.

## Hard rules

1. **Gate first.** Frequency and purpose decide whether anything animates. "No animation" is a valid result.
2. **No invented values.** Curves, durations and springs come from the tables here or in standards.md.
3. **Extend the repo's tokens.** If `--ease-out` or a duration scale exists, use it. A parallel system is a defect.
4. **Reduced motion and hover gating ship with the animation**, never as a follow-up.
5. **Cheapest tool that works.** No library for a fade.
6. **Make the call.** Never present motion options as a menu; pick, state the reason in one line, build.

## Build sequence

### 1. Should it animate?

| Frequency                                   | Decision                      |
| ------------------------------------------- | ----------------------------- |
| 100+ times/day (shortcuts, command palette) | No animation. Stop.           |
| Tens of times/day (hover, list navigation)  | Near-imperceptible or nothing |
| Occasional (modals, drawers, toasts)        | Standard animation            |
| Rare or first-time (onboarding, success)    | Delight budget lives here     |

Keyboard-initiated actions never animate.

### 2. Name the purpose

Feedback, spatial consistency, state indication, preventing a jarring change, explanation (marketing and
onboarding only), or delight (rare tier only). Can't name one: don't build it. Data the user is reading
or acting on does not move for style.

### 3. Pick the tool

| Need                                                                        | Tool                            |
| --------------------------------------------------------------------------- | ------------------------------- |
| Hover, press, colour, class or attribute toggle                             | CSS transition                  |
| Entry on mount, no JS state                                                 | CSS `@starting-style`           |
| Predetermined motion that must stay smooth while the page is busy           | CSS animation (off main thread) |
| Programmatic control, no library                                            | WAAPI `element.animate()`       |
| Springs, layout and exit animations, gesture-driven values in React         | Motion (`motion/react`)         |
| Long timelines, scroll-scrubbed sequences, SVG morphing, framework-agnostic | GSAP                            |

If the task needs a component (toast, drawer, command menu, dropdown), use an established, accessible
library (Radix, Base UI, Bits UI, Sonner, Vaul) instead of hand-rolling focus management.

### 4. Properties

- `transform` and `opacity` only; `clip-path` is the sanctioned fourth. `height` only for accordions.
- Never `scale(0)`. Start at `scale(0.9-0.97)` with `opacity: 0`.
- Popovers, menus and tooltips scale from the trigger (`var(--transform-origin)` in Base UI,
  `var(--radix-popover-content-transform-origin)` in Radix). Modals stay centred.
- `translate()` percentages are relative to the element's own size; prefer them to fixed pixels.
- In Motion under load, use the full `transform` string, not `x`/`y`/`scale` shorthands.
- Never drive a child's transform through a CSS variable on its parent.

### 5. Easing, duration or spring

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);     /* enter, exit, default */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1); /* moving or morphing on screen */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);  /* iOS-like sheet */
```

- Hover and colour changes use `ease`; constant motion uses `linear`. Never `ease-in` on UI.
- Button press 100-160ms, tooltips 125-200ms, dropdowns 150-250ms, modals and drawers 200-500ms.
  UI stays under 300ms; marketing can run longer.
- Springs for drag with momentum, interruptible gestures, "alive" elements and decorative pointer
  tracking: `{ type: "spring", duration: 0.5, bounce: 0.2 }`. Bounce 0.1-0.3, and only where playful.

### 6. Interruption and exit

- Transitions, not keyframes, for anything fired rapidly; they retarget instead of restarting.
- Springs for gestures, since they carry velocity through an interruption.
- Exit the way it entered. Slow where the user decides (hold-to-confirm 2s linear), fast where the
  system responds (release 200ms ease-out).

### 7. Reduced motion and pointer gating

```css
@media (prefers-reduced-motion: reduce) {
	.el {
		animation: fade 0.2s ease;
	} /* keep opacity and colour, drop movement */
}
@media (hover: hover) and (pointer: fine) {
	.el:hover {
		transform: scale(1.05);
	} /* touch fires hover on tap */
}
```

Reduced motion means fewer and gentler animations, not zero.

## Never ship

| Never                                                           | Instead                               |
| --------------------------------------------------------------- | ------------------------------------- |
| `transition: all`                                               | Name the properties                   |
| `scale(0)` entrance                                             | `scale(0.95)` + `opacity: 0`          |
| `ease-in`, or a built-in ease on a deliberate animation         | `--ease-out`                          |
| Motion on a keyboard or 100+/day action                         | Nothing                               |
| UI duration over 300ms without a reason                         | 150-250ms                             |
| `transform-origin: center` on an anchored popover               | Trigger origin (modals exempt)        |
| Keyframes on toasts or toggles                                  | Transitions                           |
| Animating `width`, `height`, `margin`, `padding`, `top`, `left` | `transform`, `opacity`                |
| Ungated `:hover` motion, missing reduced motion                 | The media queries above               |
| A group appearing all at once                                   | 30-80ms stagger, never blocking input |

## Output (build mode)

Write the code, then at most a few lines: the gate result (tier and purpose, plus anything rejected),
the ingredients (tool, properties, curve, duration or spring), and what to feel-check when feel can't be
judged from code (2-5x slow motion, frame-by-frame in DevTools, real device for gestures).

Sources and licences: [LICENSE](../../LICENSE).
