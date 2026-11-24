# Mandatory rules

Every UI built, restyled or reviewed with this skill follows **every** rule here, every time. Each
rule is a heading with what it means, a UI example, and do's and don'ts. A rule is skipped only
if the user says so for that case, or the repo's own design system already decides it.

Values and curves for motion live in [../motion/standards.md](../motion/standards.md#ui-choreography).

## Contents

- Typography: [Reserve bold width](#reserve-bold-width), [Optical text centring](#optical-text-centring), [Underline offset](#underline-offset), [Sub and sup](#sub-and-sup), [Fluid headlines](#fluid-headlines), [Small caps for acronyms](#small-caps-for-acronyms), [Curly quotes](#curly-quotes), [Middle truncation](#middle-truncation), [Hyphenation](#hyphenation), [Line clamp](#line-clamp), [Tabular figures](#tabular-figures), [Text wrapping](#text-wrapping)
- Animation: [No scale from zero](#no-scale-from-zero), [Press feedback](#press-feedback), [Shake on wrong input](#shake-on-wrong-input), [Directional step transitions](#directional-step-transitions), [Animate height to auto](#animate-height-to-auto), [Transform over layout properties](#transform-over-layout-properties), [Theme switch without flash](#theme-switch-without-flash), [First tooltip delay only](#first-tooltip-delay-only), [Springs for flicks](#springs-for-flicks), [Rubber-band edges](#rubber-band-edges), [Shorter exits](#shorter-exits)
- [When rules clash](#when-rules-clash)

## Reserve bold width

**Means:** when a tab turns bold on selection, its text gets wider and pushes its neighbours.
**Example:** a tab row where clicking "Billing" makes it bold and shifts "Team" and "Security" a few
pixels sideways.

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

**Do:** hold the width of the bold state with a hidden bold copy of the label.
**Don't:** change weight on select with no reserved width.

## Optical text centring

**Means:** a font's line box includes room for descenders, so text in a button sits slightly low.
**Example:** a "Save" button whose label looks pushed toward the bottom edge even though the padding
is equal.
**Do:** `text-box: trim-both cap alphabetic` on the label, then equal padding.
**Don't:** nudge each button by hand with random `padding-top` values.

## Underline offset

**Means:** the default underline sits tight to the baseline, so letters with descenders (g, y, p)
cut gaps in it.
**Example:** a link reading "typography guide" with the underline chopped at every g, y and p.
**Do:** `text-underline-offset: 0.15em; text-decoration-thickness: 0.08em`.
**Don't:** leave browser-default underlines on body links.

## Sub and sup

**Means:** `<sub>` and `<sup>` push their line box taller, so rows containing them get uneven spacing.
**Example:** a chemistry table where the row with H<sub>2</sub>O is taller than the others.
**Do:** `sub, sup { line-height: 0 }`.
**Don't:** use them with the default styles in dense rows.

## Fluid headlines

**Means:** a headline size that scales smoothly with the viewport instead of jumping at breakpoints.
**Example:** a hero title that is 40px at 400px wide and 72px at 1280px, growing in between.
**Do:** `font-size: clamp(2.5rem, 1.5rem + 4vw, 4.5rem)`, with `rem` in the middle term so zoom still
works.
**Don't:** set a fixed size per breakpoint, or use `vw` alone (breaks user zoom).

## Small caps for acronyms

**Means:** all-caps acronyms in running text look loud; small caps keep the shape at body height.
**Example:** "The NASA and WHO guidelines" in a paragraph, with NASA and WHO in small caps.
**Do:** `font-variant-caps: all-small-caps` on an `<abbr>` or span (use a font that has real small
caps).
**Don't:** use all caps for labels and subtitles; those stay in sentence case.

## Curly quotes

**Means:** typographic quotes and apostrophes look set; straight ones look typed.
**Example:** "We’re live" with a curly apostrophe, and “quoted text”, in a hero or testimonial.
**Do:** use ’ “ ” ‘ in all visible copy (and `…`, not three periods).
**Don't:** leave `'` and `"` in rendered text.

## Middle truncation

**Means:** cut the middle of a long filename so the start and the extension both stay visible.
**Example:** `annual-report-final-draft-v2.pdf` shown as `annual-report-fi…-v2.pdf` in a file list.

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

**Do:** split at the extension (or last few characters) and keep the full name in `title` and the
accessible name.
**Don't:** truncate at the end; the extension is the part that matters.

## Hyphenation

**Means:** in a narrow column, long words leave huge gaps; hyphenation lets the browser split them.
**Example:** a three-column article where one line reads "Un- believably long".
**Do:** `hyphens: auto` on body text, with a correct `lang` on the element or page.
**Don't:** hyphenate headlines, names or code; use `hyphens: none` there.

## Line clamp

**Means:** cap a block to a fixed number of lines with an ellipsis so cards stay equal height.
**Example:** blog cards whose titles run from one to five lines, making the grid ragged.
**Do:** `line-clamp: 2` (with `-webkit-line-clamp` and `display: -webkit-box` as the fallback) in
lists and cards; full text on the detail view.
**Don't:** clamp content people must read in full.

## Tabular figures

**Means:** digits of equal width, so columns align and changing numbers do not jitter.
**Example:** a pricing table, a timer ticking 1:11 to 1:12, a stats row.
**Do:** `font-variant-numeric: tabular-nums` on anything that updates or aligns, and right-align
numeric columns.
**Don't:** use proportional figures where numbers change or compare.

## Text wrapping

**Means:** balance short blocks and avoid a single orphaned word on the last line.
**Example:** a headline wrapping as "Invoices your accountant can / import" versus a balanced split.
**Do:** `text-wrap: balance` on headlines, `text-wrap: pretty` on paragraphs.
**Don't:** hard-break headlines with `<br>` at one viewport width.

## No scale from zero

**Means:** nothing in the real world appears from nothing; elements start slightly small, not at 0.
**Example:** a menu that opens from `scale(0.97)` and opacity 0, not from a dot.
**Do:** start at `scale(0.97)` (popovers 0.95) plus `opacity: 0`.
**Don't:** use `scale(0)`.

## Press feedback

**Means:** a pressed control gives immediate physical feedback.
**Example:** a "Pay now" button that shrinks to 97% while held and springs back on release.

```css
button {
	transition: scale 140ms var(--ease-out);
}
button:active {
	scale: 0.97;
}
```

**Do:** apply to every pressable element, 100-160ms, ease-out.
**Don't:** use a larger scale than 0.95, or animate layout.

## Shake on wrong input

**Means:** a wrong password turns the field red and shakes it so the failure cannot be missed.
**Example:** after "Wrong password", the field shakes 4-6px for about 350ms, once, and gets an error
message below it.
**Do:** colour change plus a short horizontal shake plus a text message; honour reduced motion
(colour and text only).
**Don't:** rely on colour alone, repeat the shake, or shake on every keystroke.

## Directional step transitions

**Means:** moving between steps should show direction, so people keep their place.
**Example:** in a three-step signup, Next slides the new step in from the right and the old one out
to the left; Back reverses it.
**Do:** slide in the direction of travel; flip in RTL; reduced motion becomes a short fade.
**Don't:** crossfade steps in place, or slide the same way for Next and Back.

## Animate height to auto

**Means:** `height: auto` could not be transitioned before; `interpolate-size` fixes it.
**Example:** an FAQ accordion that opens smoothly to the height of its answer.

```css
:root {
	interpolate-size: allow-keywords;
}
.panel {
	height: 0;
	overflow: clip;
	transition: height 220ms var(--ease-out);
}
.panel[data-open] {
	height: auto;
}
```

**Do:** use it for accordions and disclosures; fall back to `grid-template-rows: 0fr` to `1fr`
where unsupported.
**Don't:** animate `height` with fixed pixel guesses, or for anything but accordions.

## Transform over layout properties

**Means:** animating `top` or `left` forces the browser to re-layout and repaint every frame;
`transform` runs on the compositor.
**Example:** a sliding drawer moved with `translateX` stays smooth under load; the same drawer
moved with `left` stutters.
**Do:** move with `transform` and fade with `opacity`.
**Don't:** animate `top`, `left`, `right`, `bottom`, `width`, `margin` or `padding` for motion.

## Theme switch without flash

**Means:** changing theme tokens triggers every transition at once, which looks glitchy.
**Example:** clicking the dark-mode toggle makes cards, text and borders all fade at different speeds.

```js
const style = document.createElement("style");
style.textContent = "*,*::before,*::after{transition:none!important}";
document.head.append(style);
document.documentElement.dataset.theme = next;
getComputedStyle(document.documentElement).opacity; // flush styles
requestAnimationFrame(() => requestAnimationFrame(() => style.remove()));
```

**Do:** disable transitions for the swap, then restore them; or use one View Transition.
**Don't:** let per-element transitions run on a global token change.

## First tooltip delay only

**Means:** the first tooltip waits so it does not flash on mouse-through; once one is open, the
next opens at once.
**Example:** hovering across a toolbar: the first icon shows its label after about 400ms, the rest
show instantly with no animation.
**Do:** delay the first, skip delay and animation for peers within a short grace period.
**Don't:** delay every tooltip, or open tooltips on touch.

## Springs for flicks

**Means:** a fixed-duration tween ignores how fast the user flicked; a spring carries the release
velocity.
**Example:** a bottom sheet flicked down continues at that speed to dismiss; a gentle drag settles
back.
**Do:** use a spring (bounce 0 to 0.2) for drag release and flicks, passing in the gesture velocity.
**Don't:** use a fixed 300ms ease for a gesture release, or high bounce on everyday UI.

## Rubber-band edges

**Means:** dragging past a limit meets rising resistance, then springs back, instead of a hard wall.
**Example:** pulling a carousel past its last slide moves it a fraction of the finger distance, and
it eases back on release.
**Do:** damp the drag past the bound and spring back on release.
**Don't:** stop dead at the edge or let content fly off.

## Shorter exits

**Means:** leaving should be quicker than arriving; the user's attention has already moved on.
**Example:** a menu that opens in 240ms closes in about 190ms.
**Do:** exits one half to one third of the entry time (250ms in, 100-150ms out), ease-out, with a reduced-motion variant for both.
**Don't:** make exits slower than entrances.

## When rules clash

All the rules above apply. A clash only happens in a specific situation: for example a press scale on
a control used hundreds of times a day, a brand font with no small caps or tabular figures, a repo
type scale that conflicts with fluid headlines, or reduced motion versus a slide.

In that case **stop and ask the user**: name the two rules and the situation, offer 2-3 options
with what each costs, give your pick in one line, and wait. Never resolve it silently.
