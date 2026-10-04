# Phase 4: Colour and tokens

Load `auditing-design-systems` and use its `color-audit.mjs` for every pair below.

## Model

- **Neutrals never move.** Page `--background`, `--foreground`, `--muted-foreground`, `--border`, `--card`.
- **One brand role**, mapped to `--primary`. If colours are tied to `--foreground` everywhere, that's the bug:
  brand moments (CTA fill, active nav pill, marker underline, focus ring, chart series 1) move to `--primary`.
- **Fill vs ink.** A fill (`--accent`, label `--accent-fg`) and an ink for text, strokes and rings
  (`--accent-ink`). Usually equal; a light hue like amber needs a darker ink to pass on white.

## Presets

Default **neutral**, plus blue, violet, green, amber, rose, teal from baby-ui's ramps:

```css
html[data-accent="blue"] { --accent: oklch(55% 0.18 255); --accent-fg: oklch(99% 0 0); --accent-ink: oklch(55% 0.18 255); }
html.dark[data-accent="blue"] { --accent: oklch(70% 0.15 255); --accent-fg: #151515; --accent-ink: oklch(70% 0.15 255); }
```

Gates per preset, light and dark: fill vs label ≥ 4.5:1, ink vs background ≥ 4.5:1 for text and ≥ 3:1 for
rings. Record the measured numbers in a table in the notes folder.

## Applying without a flash

- `<html data-accent="neutral">` server-rendered as the default.
- A tiny inline boot script in `<head>` reads `localStorage` and sets `data-accent` before paint (same pattern
  as the theme). Wrap storage access in try/catch.
- `setAccent()` wraps the attribute change in `document.startViewTransition` with
  `html[data-theme-reveal="accent"]` so the whole page crossfades as one snapshot (see motion reference).
- Expose the picker in the top bar and as a command palette group.

## Charts and data

`--chart-1..5` from tokens; series 1 follows the accent. A calendar heatmap uses an accent ramp
(`color-mix(in oklch, var(--accent-ink) N%, transparent)`) with an edge fade mask, not a fixed green.

## Surfaces

No shadows except token ones (`--surface-shadow`, `--overlay-shadow`). No gradients, glows, dot grids, noise.
Hover fills `bg-foreground/[0.03]` for rows, `/[0.06]` for controls, gated with `hoverable:` / `pointer-fine:`.
