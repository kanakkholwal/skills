# Palette Recipes

Concrete procedures for building the palettes a product actually needs.

## Contents

- [Choosing an accent hue](#choosing-an-accent-hue)
- [Building the accent pair](#building-the-accent-pair)
- [Neutral ramps](#neutral-ramps)
- [Status colours](#status-colours)
- [Categorical encoding sets](#categorical-encoding-sets)
- [Preset and backdrop palettes](#preset-and-backdrop-palettes)
- [Authoring in OKLCH, shipping hex](#authoring-in-oklch-shipping-hex)

---

## Choosing an accent hue

Constraints, in priority order:

1. **Survives both modes.** The hue must hold identity from roughly L 0.45 to L 0.75.
   Check with `gamut <hue>`.
2. **Separates from the destructive colour** under simulated CVD. Check with `cvd`.
3. **Clears 20+ degrees from every other hue in the system** — status, categorical, chart.
4. **Reaches 4.5:1 on white** at a lightness where it keeps chroma > 0.12.

Blues and violets (h ~250–300) satisfy all four most easily; that is a gamut fact, not a
fashion. Yellow-greens and teals routinely fail 1 and 4.

**Do not skip the category check.** Survey what competitors in the same category use. A hue
that is technically excellent but identical to the category leader buys no distinctiveness.
Conversely, "generic" is not a real objection for a *selection/focus* colour — matching the
platform convention there is a feature, because users read it pre-attentively.

## Building the accent pair

Pick one hue, two lightnesses:

- **Light mode**: L ~0.50–0.55, chroma near the gamut ceiling.
- **Dark mode**: L ~0.68–0.72, chroma at the ceiling for that lightness (usually lower).

Verify all four of these before shipping:

```
label on accent (light)     >= 4.5
accent as text on card      >= 4.5
focus ring vs background    >= 3
accent vs destructive       >= 3 luminance OR > 0.10 dE under CVD
```

Chroma will differ between the two modes because the ceiling differs. That is expected; keep
the **hue** identical.

## Neutral ramps

Space by lightness, not by hex intuition. A usable ramp for surfaces and text:

```
L 1.00  0.97  0.88  0.72  0.45  0.26  0.00
```

Add a very slight chroma (0.004) at a consistent hue for a warm or cool cast; keep it under
0.01 or it stops being neutral.

Give control boundaries their own token. Decorative hairlines can sit at 1.2:1; anything
that identifies an input, select, or checkbox needs 3:1 against its surface — typically
around L 0.62 on white and L 0.55 on a dark card.

## Status colours

- Reserve them for status. A status colour used decoratively destroys its meaning.
- Keep >= 20 degrees between warning and destructive, or they read as one orange-red.
- Keep the brand hue >= 20 degrees from success, or "branded" and "succeeded" look identical.
- **Measure status colours as text separately from status colours as fills.** A hue that
  works as a filled badge behind a light label often fails 4.5:1 as coloured body text.
  If both uses are needed, ship a separate darker `-ink` variant rather than compromising.

## Categorical encoding sets

For chart series, timeline lanes, tags:

- Spread hues around the wheel **and** verify pairwise CVD separation.
- Cap chroma below the accent's so the set supports the UI rather than competing.
- Never let hue be the only carrier — pair with a label, shape, or position.
- Re-check spacing against the accent hue whenever a member is added.

## Preset and backdrop palettes

Backdrops sit behind the user's content, so the governing question is: **does the content's
edge still read against it?**

Measure each candidate against representative content — a light UI (`#ffffff`) and a dark
IDE (`#1e1e1e`). Below ~1.3:1 against either, the framed content loses its edge.

Structure a preset set by role, not by prettiness:

| Tier | Chroma cap | Purpose |
| --- | --- | --- |
| Neutral | <= 0.015 | The workhorses. Most real usage. |
| Tinted | <= 0.07 | Subtle washes. |
| Vivid | <= 0.15 | Social crops and thumbnails. Fewest members. |

Rules that keep a set coherent:

- Sort by lightness within each tier.
- Gradients: hue span <= 40 degrees, lightness delta <= 0.25, so each reads as one surface
  rather than a rainbow sweep.
- No two members within 0.05 dE — audit with `palette`.
- Cover the workhorses first. A set with three near-identical navies and no mid-gray is
  optimised for the showroom, not for use.

**Handle the unavoidable failures instead of banning them.** Pure white and pure black are
legitimately wanted and cannot separate from light/dark content. Detect the condition and
enable a drop shadow automatically rather than shipping an invisible edge:

```
needsShadow(value) = min(contrast vs light content, contrast vs dark content) < 1.3
```

Enable only — never auto-disable, or an explicit user choice gets overridden. Return false
for values that cannot be measured (images, remote assets); guessing surprises people.

**Beware stock palettes.** Sets copied from gradient libraries and palette sites are tuned
to look good in a swatch grid, not to sit behind content. Signs: exact hex pairs findable
online, library names left as labels, chroma far above the brand colour, three warm gradients
and no neutral.

## Authoring in OKLCH, shipping hex

Author in OKLCH so lightness and chroma steps are even and intentional. Emit the format the
renderers actually parse — many custom shaders, gradient parsers, and export pipelines match
hex only, so an `oklch()` literal silently fails to parse there.

Keep the OKLCH intent in a comment or generator, and assert the emitted format in a test:

```
- every value matches the expected format (hex-only where required)
- every value is inside sRGB
- chroma is within the tier cap
- ids are unique
- every migration target still exists
```
