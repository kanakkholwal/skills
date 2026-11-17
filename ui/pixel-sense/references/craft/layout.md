# Layout, spacing and optical alignment

Align by eye, not by pixel. Geometry is the starting point; perception is the judge.

## Contents

- [Spacing and grouping](#spacing-and-grouping)
- [Hierarchy](#hierarchy)
- [Optical alignment](#optical-alignment)
- [Optical centre](#optical-centre)
- [Concentric radius](#concentric-radius)
- [Hit areas](#hit-areas)
- [Viewport units and safe areas](#viewport-units-and-safe-areas)
- [Layout shift](#layout-shift)

## Spacing and grouping

- One scale, 4px base: 4, 8, 12, 16, 24, 32, 48, 64, 96. Every margin, gap and padding comes
  from it.
- **Proximity carries grouping**: space inside a group is clearly smaller than space between
  groups (at least 2x). If you need a border to show what belongs together, the spacing is wrong.
- Vertical rhythm: section gap > block gap > element gap > line gap. Monotonous spacing (one
  value everywhere) flattens hierarchy.
- Padding inside a control: horizontal about 2x vertical (`12px 20px`), more for pill shapes.

## Hierarchy

- One dominant element per screen. Enlarge the main feature until it obviously leads.
- Squint test: blur the screenshot; the order you see blobs in is the reading order.
- Primary action is the only accent-filled control in its region. Secondary actions are quieter,
  not smaller copies.
- Show the product. A real screenshot at a generous size does more than three feature cards.

## Optical alignment

The eye judges mass, not bounding boxes. Correct where they disagree.

| Case                                     | Geometric result                              | Fix                                       |
| ---------------------------------------- | --------------------------------------------- | ----------------------------------------- |
| Play triangle in a circle                | Looks shifted left                            | Nudge right ~1/10 of its width            |
| Icon + label button                      | Icon side looks heavier                       | Reduce padding on the icon side by 2-4px  |
| Text in a box                            | Looks low (line box includes descender space) | `text-box: trim-both cap alphabetic`      |
| Round or pointed shapes beside flat ones | Look smaller                                  | Overshoot by 2-5% (as type does with "O") |
| Quote marks, bullets at a text edge      | Text looks indented                           | Hang them outside the edge                |
| Large headline beside body text          | Left edges misalign by the side bearing       | Pull the headline left 1-3px              |
| Icons in a row                           | Squares look bigger than circles              | Size by visual area, not box              |

Rule from Vercel's guidelines: adjust about 1px when perception beats geometry. Every element
still aligns to something deliberately (a grid line, a baseline, an edge or the optical centre).

## Optical centre

The perceived centre of a box sits slightly above the geometric centre. Content that is
mathematically centred in a hero, modal or empty state looks low. Shift it up 3-5% of the
container height: less padding on top than below (`padding-block: 20dvh 26dvh`), or
`translate: 0 -4%` on the content.

## Concentric radius

Nested rounded corners only look parallel when the inner radius equals the outer radius minus the
gap between them.

```css
.card {
	--r: 16px;
	--pad: 6px;
	border-radius: var(--r);
	padding: var(--pad);
}
.card > .inner {
	border-radius: calc(var(--r) - var(--pad));
} /* 10px */
```

If padding is larger than the outer radius, the inner corner becomes square (0), which is
correct. Same rule for buttons inside inputs, images inside cards, and segmented controls.

## Hit areas

- Targets at least 24x24 CSS px (WCAG 2.5.8), 44px on touch. Extend the hit area, not the visual:

  ```css
  .icon-btn { position: relative; }
  .icon-btn::after { content: ""; position: absolute; inset: -10px; }
  ```
- Fitts: frequent and important targets are bigger and closer to where the pointer or thumb
  already is. Edge and corner targets are effectively infinite on desktop.
- No dead zones between a checkbox and its label; the label is part of the target.

## Viewport units and safe areas

- `100vh` on mobile Safari includes the area under the collapsing toolbar, so full-height heroes
  jump or hide content. Use `100dvh` (tracks the toolbar), `100svh` (smallest, stable) for heroes
  that must not resize while scrolling.
- Respect notches and home indicators: `padding-bottom: max(16px, env(safe-area-inset-bottom))`
  with `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
- Mobile inputs at 16px or larger or iOS zooms the page on focus.

## Layout shift

- Reserve space for everything that loads: `width`/`height` or `aspect-ratio` on media,
  skeletons that match the final layout, min-heights on async regions.
- Fonts: metric-matched fallbacks ([typography.md](typography.md#loading-without-layout-shift)).
- Never insert content above what the user is reading; append or use a "new items" pill.
- Hover and selected states change colour or shadow, never border width or padding.
- `scrollbar-gutter: stable` so opening a modal does not shift the page.
