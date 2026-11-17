# Colour: choosing, not just measuring

How to pick a palette that has a point of view. Measuring it (contrast, colour blindness, gamut)
lives in [../color-system/index.md](../color-system/index.md); run `scripts/color-audit.mjs` on
anything you pick here.

## Contents

- [The accent rule](#the-accent-rule)
- [Worked pairs](#worked-pairs)
- [Where the accent goes](#where-the-accent-goes)
- [Palette shape](#palette-shape)
- [OKLCH, not HSL](#oklch-not-hsl)
- [Borders, tints and gradients](#borders-tints-and-gradients)
- [Dark mode](#dark-mode)
- [Brand colour and logo](#brand-colour-and-logo)

## The accent rule

A calm base family plus **one** accent from the far side of the colour wheel.

1. **Base family**: neutrals plus one or two analogous hues (within ~40 degrees). Clean, coherent,
   and on its own forgettable.
2. **Accent**: 120-180 degrees away in OKLCH hue (complementary or split-complementary), high
   chroma, used on 5-10% of the surface. It tells the eye where to look.
3. **Test in greyscale**: if the accent disappears, its lightness matches its surroundings. Move
   its lightness, not its hue.

One accent. A second saturated hue turns emphasis into noise. Status colours (success, warning,
danger) are not accents and stay muted until they fire.

## Worked pairs

| Base                          | Problem                    | Add                 | Why it works                             |
| ----------------------------- | -------------------------- | ------------------- | ---------------------------------------- |
| Deep teal, glacier blue, navy | Clean, but nowhere to look | One touch of lemon  | Warm against an all-cool family          |
| Deep teal, cream              | Coffee brand looks cold    | A little orange     | Teal's complement reads as heat          |
| Cream, ink                    | Washed out                 | Orchid pink         | Saturation pop on a desaturated base     |
| Cobalt, black, white          | Could be any brand         | Hot pink            | Ownable pairing, still corporate-safe    |
| Warm red or orange, black     | Good but generic           | One touch of cobalt | Cool counterweight signals precision     |
| Deep violet, white            | Plain                      | Electric lime lines | Violet's complement makes layers legible |

The pattern: name the base mood, find what it lacks (warmth, energy, focus, identity), and take
that from the opposite side of the wheel.

## Where the accent goes

On whatever the product sells or the user must do next:

- The primary CTA, and only the primary one.
- The price, the key number, the active state, the selected item.
- The product itself in a shot (a lemon UI chip on a navy page, not lemon section headers).

Never on decoration, dividers, icons in a list, or every link. If everything is accented, nothing is.

## Palette shape

| Group        | Steps | Notes                                                                  |
| ------------ | ----- | ---------------------------------------------------------------------- |
| Neutral ramp | 10-12 | Tinted 0.005-0.02 chroma toward the brand hue; surfaces, text, borders |
| Accent       | 3     | Base, hover/pressed, subtle background. Measure ink on each            |
| Status       | 4 x 2 | success, warning, danger, info; each a background and a foreground     |

60-30-10 as a sanity check: ~60% neutral surface, ~30% text and secondary surfaces, ~10% accent.
Product UI usually runs nearer 5% accent. More shades or opacities than this table is drift; see
[../color-system/token-architecture.md](../color-system/token-architecture.md).

## OKLCH, not HSL

HSL lightness is not perceived lightness: `hsl(60 100% 50%)` yellow and `hsl(240 100% 50%)` blue
share L=50% yet differ hugely in brightness. OKLCH's L tracks perception, so a ramp built by
stepping L looks even, and two hues at the same L have similar contrast.

```css
--neutral-50: oklch(0.985 0.004 250);
--neutral-900: oklch(0.21 0.012 250);
--accent: oklch(0.72 0.19 45);           /* orange against a teal base */
--accent-ink: oklch(0.22 0.04 45);       /* text on the accent, measured 4.5:1 */
```

Not every hue reaches high chroma at every lightness: yellow only saturates when light, blue only
when dark. Check with `color-audit.mjs gamut <hue>` before committing to a hue.

## Borders, tints and gradients

- **Alpha borders** blend into any surface; solid hex borders turn muddy on tinted or dark
  backgrounds.

  ```css
  --border: oklch(0 0 0 / 0.08);                    /* light */
  --border: oklch(1 0 0 / 0.10);                    /* dark */
  ```
- **Tint toward the background**: borders, shadows and grey text take a little of the surface hue.
  Pure grey on a warm cream page looks dirty.
- **Gradients in OKLCH** stay vivid through the middle; sRGB interpolation greys out between
  complementary stops.

  ```css
  background: linear-gradient(in oklch, var(--teal), var(--orange));
  background: linear-gradient(in oklch longer hue, red, red);   /* full spectrum */
  ```
- Dark gradients band. Add a 2-4% opacity noise layer, or use an image.

## Dark mode

- Not an inversion. Build the dark ramp separately and test it separately.
- **Depth comes from lighter surfaces**, because shadows barely show on dark backgrounds: base
  L 0.15-0.18, raised L +0.03-0.04 per level. Keep a faint shadow for edge definition only.
- Avoid `#000` with `#fff` text (halation, smearing on OLED). Background L ~0.15-0.2, body text
  L ~0.92-0.96.
- Drop accent chroma slightly and raise its lightness so it does not vibrate.
- Set `color-scheme: dark` and a matching `<meta name="theme-color">`.

## Brand colour and logo

- **Pick the hue from a gap**: list the 5 nearest competitors' primary hues on the wheel; choose
  where they are not, unless category convention matters more (finance blue, health green).
- **Meaning before taste**: name 3 adjectives for the brand, pick the base mood from them, then
  the accent from the opposite side.
- **Logo clear space** equals the height of the mark's x-height or cap height on every side.
  Define a minimum size and a one-colour version before using it anywhere small.
- **Logo rows** (customer logos, partners) are sized by visual area, not equal width: a wide
  wordmark at the same width as a square mark looks twice as heavy. Set them all to one colour.
- **Favicon** is a simplified mark, not the scaled-down lockup.
