# Mandatory rules

Every UI built, restyled or reviewed with this skill follows every rule here, every time. They are
mechanical, so there is no "when it fits". A rule may be skipped only if the user says so for
that case, or if the repo's own design system already decides it (then follow the repo).

If two rules (or a rule and the repo) pull opposite ways, stop and ask the user, offering the
options and what each costs. Known conflicts are in [Conflicts](#conflicts). Never resolve one
silently.

## Contents

- [Typography](#typography)
- [Animation and transitions](#animation-and-transitions)
- [Surfaces and layout](#surfaces-and-layout)
- [Conflicts](#conflicts)

## Typography

| Rule                                   | Do                                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Reserve bold width on tabs and toggles | A hidden bold copy sets the width so selecting a tab does not shift its row (below)                           |
| Centre text optically in buttons       | Fonts leave room for descenders, so label text sits low. `text-box: trim-both cap alphabetic`                 |
| Underlines clear descenders            | Default underlines are chopped by g, y, p. `text-underline-offset: 0.15em; text-decoration-thickness: 0.08em` |
| Fix `sub` and `sup` spacing            | They stretch line boxes unevenly: `sub, sup { line-height: 0 }`                                               |
| Fluid headlines                        | `clamp()` instead of a size jump at each breakpoint                                                           |
| Acronyms in small caps                 | All-caps acronyms shout: `font-variant-caps: all-small-caps` (or `c2sc` plus `smcp`) on the acronym span      |
| Curly quotes and apostrophes           | Straight quotes read mechanical: " " ' ' ’, never `"` or `'` in visible copy                                  |
| Truncate filenames in the middle       | The extension carries the meaning; keep start and end: `report-q3-fina…v2.pdf` (below)                        |
| Hyphenate narrow columns               | Huge word gaps in narrow columns: `hyphens: auto` with a correct `lang` attribute                             |
| Clamp long titles in cards             | Equal card heights: `line-clamp: 2` (`-webkit-line-clamp` fallback)                                           |
| Tabular figures                        | `font-variant-numeric: tabular-nums` on any number that updates or aligns                                     |
| Balanced headlines, pretty paragraphs  | `text-wrap: balance` and `text-wrap: pretty`                                                                  |

Reserve bold width (no shift when a tab becomes active):

```css
.tab {
	display: inline-grid;
}
.tab::after {
	content: attr(data-label);
	font-weight: 600;
	height: 0;
	visibility: hidden;
	overflow: hidden;
	user-select: none;
	pointer-events: none;
}
.tab[aria-selected="true"] {
	font-weight: 600;
}
```

Middle truncation has no native CSS. Use two spans, the head shrinks with an ellipsis and the tail
never does:

```html
<span class="name"><span class="head">annual-report-final-draft</span><span class="tail">-v2.pdf</span></span>
```

```css
.name {
	display: flex;
	min-width: 0;
}
.head {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.tail {
	flex: none;
	white-space: nowrap;
}
```

Keep the full name in `title` and the accessible name.

## Animation and transitions

| Rule                                                      | Do                                                                                                                                                                                   |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Never scale from zero                                     | Enter from `scale(0.97)` (popovers 0.95) plus opacity 0                                                                                                                              |
| Press feedback                                            | `scale(0.97)` on `:active`, 100-160ms ease-out, on every pressable element                                                                                                           |
| Wrong input shakes                                        | A wrong password or invalid field: colour change and a 4-6px horizontal shake, 300-400ms, no repeat                                                                                  |
| Steppers slide, not fade                                  | New step enters from the direction of travel (next from the right, back from the left); old step exits the opposite way. RTL flips                                                   |
| Animate height auto                                       | `:root { interpolate-size: allow-keywords }` then transition `height` to `auto` (accordions, disclosures). Fall back to the `grid-template-rows: 0fr -> 1fr` trick where unsupported |
| Never animate `top`, `left`, `width`, `height` for motion | The browser repaints every frame. Animate `transform` and `opacity` (height only for accordions, via `interpolate-size`)                                                             |
| Switching themes                                          | Disable transitions for the swap, then restore (below)                                                                                                                               |
| Tooltips                                                  | Delay only the first one (about 300-500ms); once one is open, neighbours open instantly with no animation                                                                            |
| Flicks use springs                                        | A fixed-duration tween makes a flick feel mechanical; a spring keeps the release velocity                                                                                            |
| Carousel and list edges                                   | Dragging past the end adds rubber-band resistance, then springs back                                                                                                                 |
| Exits                                                     | About 20% shorter than the entrance; reduced-motion variant ships with every animation                                                                                               |

Theme switch without a flash of transitions:

```js
const style = document.createElement("style");
style.textContent = "*,*::before,*::after{transition:none!important}";
document.head.append(style);
document.documentElement.dataset.theme = next;
getComputedStyle(document.documentElement).opacity; // flush
requestAnimationFrame(() => requestAnimationFrame(() => style.remove()));
```

(Or a View Transition when the crossfade is wanted: `document.startViewTransition(() => setTheme(next))`.)

Values and curves live in [../motion/standards.md](../motion/standards.md#ui-choreography).

## Surfaces and layout

The craft files hold these; they are mandatory too: concentric radii, alpha borders, optical
alignment, `dvh`, safe areas, hit areas of 24px (44px touch), OKLCH colour with one accent, every
state shipped. See [checklist.md](checklist.md).

## Conflicts

Ask the user before choosing. Offer the options below, with the cost of each.

| Conflict                                                               | Options                                                                                        |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Press scale, stepper slide or shake on an action used 100+ times a day | Keep the feedback (cost: it adds friction on a hot path), or drop it for that control          |
| `prefers-reduced-motion` vs slide, shake, stretch                      | Default: replace movement with a fade or colour change. Ask only if the user wants zero motion |
| Small caps acronyms vs the ban on all-caps                             | Small caps for acronyms inside sentences stays. All-caps labels and subtitles stay banned      |
| Fluid `clamp()` headline vs a fixed size from the repo's type scale    | Follow the repo scale, or add fluid steps to it                                                |
| `hyphens: auto` vs headlines, names and codes                          | Hyphenate body only; headlines use `balance`; names and codes get `hyphens: none`              |
| `line-clamp` vs content users must read in full                        | Clamp in lists and cards only; full text on the detail view                                    |
| Instant tooltips after the first vs the "every state animates" rule    | Tooltip skips animation after the first; this is intended                                      |
| Spring on a flick vs "no spring bounce on everyday UI"                 | Spring with bounce 0 (critically damped) for flicks; bounce only if the product is playful     |
| Brand font lacks small caps or tabular figures                         | Pick a feature-complete font, or accept a fallback face for numbers. Ask                       |
| Repo design system contradicts any rule here                           | Repo wins for what it states; ask about the rest                                               |

When the choice is the user's, give two or three concrete options, name the one you would pick
and why in one line, and wait.
