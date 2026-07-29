# Colour Science for Design Systems

The physics behind why some palettes cannot be fixed by tuning.

## Contents

- [Gamut shape decides which hues can work](#gamut-shape-decides-which-hues-can-work)
- [Colour-blind separation](#colour-blind-separation)
- [Contrast floors and what they apply to](#contrast-floors-and-what-they-apply-to)
- [Dark mode](#dark-mode)
- [Attention and large surfaces](#attention-and-large-surfaces)
- [Practical measurement recipes](#practical-measurement-recipes)

---

## Gamut shape decides which hues can work

sRGB is not a uniform box. Each hue has a different maximum chroma at each lightness, and
the peak sits at a different lightness per hue.

**Yellow-greens (h ~90–140) peak bright.** Maximum chroma occurs around L 0.85–0.90. To
reach 4.5:1 on white a colour must drop to roughly L 0.55, where available chroma has
collapsed by a third and the colour reads as olive, not lime. A lime brand colour therefore
*cannot* be both legible on white and still look like lime. This is geometry, not taste.

**Blues and violets (h ~250–300) have deep chroma wells.** Chroma above 0.25 is available
down at L 0.48. The same hue holds its identity from L 0.45 to L 0.75, which is what lets
one hue serve both light and dark mode.

**Cyans and teals (h ~180–230) are chroma-poor.** Max chroma near L 0.52 is often below
0.15, so they can never look vivid at a legible lightness.

Test any candidate hue before committing:

```bash
node scripts/color-audit.mjs gamut 126
```

If the hue never reaches 4.5:1 on white while holding its chroma, it cannot be a light-mode
text or accent colour. Pick another hue — do not try to tune it.

**Always verify a chosen value is in-gamut.** An out-of-gamut `oklch()` is silently clipped
by the browser, so the rendered colour is not the specified one and drifts on wide-gamut
displays. The `gamut` command prints the ceiling per lightness.

## Colour-blind separation

Roughly 8% of men have red-green colour vision deficiency. Two facts matter:

**Hue-wheel distance is the wrong metric.** Red (h 25) and green (h 140) are 115 degrees
apart and collapse to near-identical tones under deuteranopia. Spacing hues "around the
wheel" does not make a set colour-blind safe.

**Measure it instead:**

```bash
node scripts/color-audit.mjs cvd "#90c600" "#ef4444"
```

Below ~0.10 OKLab dE in any row, two colours risk reading as one. Check specifically the
pair with the highest stakes — usually the primary action against the destructive action.

**Design consequences:**
- Never let colour alone carry meaning. Add a label, icon, shape, or position.
- If two controls must be distinguished, separate them by luminance (3:1) rather than hue.
  Luminance survives every form of CVD.
- A neutral (black/white) primary action separates from a red destructive action by
  luminance, which is why neutral-inverse CTAs are unusually safe.

## Contrast floors and what they apply to

| Target | Floor | Notes |
| --- | --- | --- |
| Body text | 4.5:1 | WCAG 1.4.3 |
| Large text (>=24px, or >=18.66px bold) | 3:1 | |
| UI component boundaries, focus rings, meaningful icons | 3:1 | WCAG 1.4.11 |
| Purely decorative hairlines | none | Exempt — do not over-report these |

**The common miss:** a text input identified only by a faint border or a faint fill. If
neither clears 3:1 against the surface, the control is not perceivable. Decorative dividers
are exempt; control boundaries are not. Give control boundaries their own token so the
decorative hairline can stay soft.

**Alpha compounds.** A token at 1.3:1 rendered at `/40` is far worse. Measure the composited
result, not the token.

## Dark mode

- Define accents per mode. One value cannot serve both.
- Keep the **hue** stable across modes and vary lightness/chroma, or the brand reads as two
  different colours.
- Highly saturated light colours on dark grounds are aggressive. If a token needs a rule like
  "stay under 8% when mixing," the token is too saturated.
- Check that a border is lighter than the surface it bounds. A border darker than its card
  reads as a seam, and usually indicates values copied from the light theme.

## Attention and large surfaces

Peak human luminance sensitivity is around 555nm — yellow-green. That hue carries maximum
perceived brightness per unit of chroma, which is why safety gear uses it and why it is the
worst choice for a repeated UI accent.

For tools that display user content (video, images, canvases, screenshots), the chrome must
recede. Rank surfaces by how much area they occupy:

- **Backdrops and large fills**: the least saturated thing in the product. Chroma <= 0.07.
- **Accents**: chroma <= 0.20, used at roughly 10% of surface area.
- **Content**: whatever the user brings — never compete with it.

A backdrop more saturated than the brand colour is inverted priority.

## Practical measurement recipes

**Is this hue viable as a light-mode accent?**
`gamut <hue>` — look for a row that clears 4.5:1 on white while keeping chroma > 0.12.

**Will these two buttons be confusable?**
`cvd <a> <b>` — need 3:1 luminance or >0.10 dE in every row.

**Is this palette internally duplicated?**
`palette <colours...>` — flags near-duplicates under 0.05 dE and chroma above 0.15.

**Does the whole token file pass?**
`tokens <file.css>` — inline `var()` references first; unresolved ones are skipped.
