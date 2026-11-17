# Surfaces, depth, imagery and states

## Contents

- [Borders and shadows](#borders-and-shadows)
- [Masks and fades](#masks-and-fades)
- [Product shots and blending](#product-shots-and-blending)
- [Interaction states](#interaction-states)
- [Loading, empty, error, success](#loading-empty-error-success)
- [Optimistic updates](#optimistic-updates)

## Borders and shadows

- Choose one edge strategy per surface: a defined edge (alpha border) or soft elevation
  (shadow). A hairline border plus a wide soft shadow is a tell.
- Layered shadows read as real light: a tight ambient shadow plus a softer key shadow, both tinted
  toward the surface hue, never pure black at high opacity.

  ```css
  --shadow-2:
    0 1px 2px oklch(0.2 0.02 250 / 0.06),
    0 4px 12px oklch(0.2 0.02 250 / 0.08);
  ```
- A crisp edge: semi-transparent border plus shadow, e.g. `box-shadow: 0 0 0 1px var(--border),
  var(--shadow-2)`. The ring sits outside layout, so states can change it without shifting.
- In dark mode, depth comes from lighter surfaces, not shadows ([color.md](color.md#dark-mode)).
- Do not box everything. Most groups need spacing, not a container.

## Masks and fades

- Fade carousel and scroll-container edges with a mask so content does not hard-clip:

  ```css
  .rail {
    mask-image: linear-gradient(to right, transparent, #000 48px, #000 calc(100% - 48px), transparent);
  }
  ```
- Only fade the edge that has more content; drive it with scroll-driven animation or `:has()` on
  scroll state where supported.
- Masks (and `clip-path`) are also the cleanest reveal and colour-change tool in motion: animate
  the mask, not the element's size ([../motion/standards.md](../motion/standards.md)).

## Product shots and blending

- Show the actual product: a real screenshot, a live component, or real output.
- Product photos on a white background placed on a tinted surface: `mix-blend-mode: multiply`
  removes the white. It only works on light surfaces; on dark mode the image goes dark and muddy.
  Ship a transparent cut-out (PNG/WebP/AVIF with alpha) for anything that appears in dark mode.
- Screenshots get the same radius and edge treatment as cards, a subtle border, and real data.
- Decorative images are `alt=""` and lazy; the hero image is eager with `fetchpriority="high"`.

## Interaction states

Every interactive element has: default, hover (fine pointers only), active/pressed,
focus-visible, disabled, loading. Selected and invalid where they apply.

- States **raise contrast**: hover darkens or lightens toward stronger contrast, never fades.
- Press: `scale(0.97)` on `:active`, 100-160ms ease-out.
- Focus ring: 2px, offset 2px, 3:1 against both the control and the background.
- Disabled keeps its label readable and says why nearby. Prefer not disabling submit at all;
  validate on submit instead.
- `cursor: pointer` on everything clickable that is not a native link or button style.

## Loading, empty, error, success

| State                       | Pattern                                                                      |
| --------------------------- | ---------------------------------------------------------------------------- |
| Loading under ~300ms        | Show nothing (avoid flashes)                                                 |
| Loading up to a few seconds | Skeleton that mirrors the final layout                                       |
| Loading long or uncertain   | Progress with cancel                                                         |
| Button submit               | Spinner inside the button, label kept, width fixed                           |
| Empty                       | What goes here, plus the one action that fills it                            |
| Error                       | What happened, what to do, retry; keep the user's input                      |
| Success                     | Inline confirmation or a pulse on the changed item; toast only if off-screen |

## Optimistic updates

For likely-to-succeed, reversible actions (like, rename, reorder, toggle): apply the change
immediately, send the request, reconcile on response, and on failure roll back with a visible
message and retry. Never optimistic for payments, deletes without undo, or anything the server
may reject for business rules.
