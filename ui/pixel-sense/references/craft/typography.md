# Typography craft

The details that separate set type from typed text. Basics (16px body, contrast floors, fluid
type) are in [../ux/04-visual-design.md](../ux/04-visual-design.md).

## Contents

- [Choosing faces](#choosing-faces)
- [Scale and hierarchy](#scale-and-hierarchy)
- [Tracking and leading by size](#tracking-and-leading-by-size)
- [Measure, wrapping, widows](#measure-wrapping-widows)
- [Numbers](#numbers)
- [Small marks](#small-marks)
- [Icons beside text](#icons-beside-text)
- [Loading without layout shift](#loading-without-layout-shift)

## Choosing faces

- One family is enough for product UI. Pair a second only when it has a job (display vs body).
- Pair by **x-height** and proportions, not by name. Faces with similar x-heights sit together on
  a line; a small x-height serif next to a large x-height sans looks like a size mistake.
- Contrast the pair in one dimension (serif vs sans, or width) and match the rest.
- Prefer variable fonts; use `font-optical-sizing: auto` so display sizes get the tighter cut.
- Find faces with `node scripts/search.mjs "<mood>" -d google-fonts` or `-d typography` for pairs.
  Never reach for the reflex list in [slop.md](slop.md).

## Scale and hierarchy

- Ratio of at least 1.25 between steps (1.2 is too flat for headings). 5-7 sizes total.
- Hierarchy from size, weight and colour together; never more than two of them changing between
  adjacent levels.
- Big headline, medium everything else beats evenly stepped sizes.

## Tracking and leading by size

| Size               | Tracking          | Leading   |
| ------------------ | ----------------- | --------- |
| Display (48px+)    | -0.01 to -0.02em  | 1.0-1.1   |
| Headings (24-40px) | -0.005 to -0.01em | 1.15-1.25 |
| Body (15-18px)     | 0                 | 1.45-1.6  |
| Small (11-13px)    | +0.01 to +0.02em  | 1.4-1.5   |
| All caps (any)     | +0.04 to +0.08em  | n/a       |
- Large type looks loose because spacing scales with size; small type looks cramped. Tracking
  compensates in both directions. Crushing display type to -0.05em is a slop tell.
- `font-kerning: normal` (default on, but resets kill it). Kern optically at display sizes:
  pairs like "AV", "To", "Ly" may need manual `letter-spacing` on a span.
- Dark text on light reads heavier than light on dark: in dark mode drop body weight one step
  (or use the `GRAD` axis) and add +0.01em tracking.

## Measure, wrapping, widows

- Line length 45-75 characters (`max-inline-size: 65ch`).
- `text-wrap: balance` on headlines and short blocks; `text-wrap: pretty` on paragraphs to avoid
  a single word (widow) on the last line.
- Break headlines on meaning, not on width: "Invoices your accountant / can import" not
  "Invoices your / accountant can import". Use `<br>` or `&nbsp;` between words that must stay.
- `hanging-punctuation: first` so opening quotes hang outside the text edge.
- Left-align body text. Centre only short headlines and single lines.

## Numbers

- `font-variant-numeric: tabular-nums` on anything that updates, compares or aligns: tables,
  prices, timers, counters, stats. Proportional figures make columns ragged and counters jitter.
- `slashed-zero` for IDs and codes; `oldstyle-nums` only in running editorial text.
- Right-align numeric table columns; align decimals.
- Format with `Intl.NumberFormat`; `10&nbsp;MB`, `⌘&nbsp;K` so units never wrap alone.

## Small marks

- Real ellipsis `…`, curly quotes `" "` and `' '`, multiplication `×`, minus `−` in maths.
- No full stop at the end of headlines, button labels or single-sentence card titles.
- Italic for titles, terms and voice, never for random emphasis inside a headline.
- All caps only for very short labels, tracked out; never for sentences or subtitles.
- Mono only for code, IDs, keyboard keys and aligned figures.

## Icons beside text

- **Match stroke to font weight**: a 1px icon next to 600-weight text looks sloppy. Roughly:
  regular text 1.5px stroke at 20px icon, semibold 2px. Lucide/Phosphor expose stroke width.
- Size icons to the cap height or x-height of the adjacent text (about 1.2-1.4em), not to a
  round number.
- Centre icons on the text's optical middle: `text-box: trim-both cap alphabetic` on the label,
  or nudge 1px. Line-box centring sits icons visibly low next to caps.
- One icon set per product. Mixed filled and outline styles read as two products.

## Loading without layout shift

- Preload only the critical weights. `font-display: swap` for body, `optional` for display faces
  that should not swap late.
- Match the fallback metrics so the swap does not reflow:

  ```css
  @font-face {
    font-family: "Brand Fallback";
    src: local("Arial");
    size-adjust: 104%;
    ascent-override: 92%;
  }
  ```
