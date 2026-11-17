# Direction: deciding what it should look like

A direction is a decision the user owns. Find an existing one or offer options; never pick
silently.

## Contents

- [1. Find an existing direction](#1-find-an-existing-direction)
- [2. Brief](#2-brief)
- [3. Offer options](#3-offer-options)
- [4. Lock it](#4-lock-it)
- [Genre and texture catalogue](#genre-and-texture-catalogue)
- [Rules for any texture](#rules-for-any-texture)

## 1. Find an existing direction

Check before asking: `DESIGN.md` or a design contract, `design-system/*/MASTER.md`, token files
(CSS custom properties, Tailwind theme, `tokens.json`), brand assets (logo, fonts), the live site,
and notes folders (`.local/`, `.notes/`). Existing owner decisions win.

- **Found**: follow it. Still offer 2-3 suggestions that extend it (a texture that suits it, an
  accent it lacks), clearly marked optional.
- **Not found**: run the brief, then offer options.

## 2. Brief

Ask only what the code and context cannot answer:

- Who is it for, and the one thing they must do on this screen?
- Three adjectives for the brand; three it must not be.
- Nearest competitors or references the user likes.
- Constraints: stack, existing component library, dark mode, accessibility level, performance
  budget, content that already exists (photos, screenshots, copy).

`node scripts/search.mjs "<product> <industry> <adjectives>" --design-system` gives a data-backed
seed (product category, landing pattern, palette, type pair). Treat it as raw material: re-check
its picks against [slop.md](slop.md) and [color.md](color.md).

## 3. Offer options

Always ask, with **3 to 6** options so the user has real choice. Each option states:

- Name and one-line mood
- Palette: base family + the one accent ([color.md](color.md#the-accent-rule))
- Type: display and body faces
- Genre or texture from the catalogue below, or "none"
- Layout idea, with a small ASCII sketch

Include at least one quiet option (no texture, typography-led) and one bold option. Use the
agent's question tool with previews when it has one; otherwise print a numbered list and wait
for the answer. Do not build before the pick.

```
Option B: "Field notes"            paper texture, ink + orchid accent, serif display
┌──────────────────────────────────────┐
│  Logo                     Docs  Login │
│                                       │
│  Invoices your accountant             │
│  can import           [ Start free ]  │
│  ┌────────────── product shot ─────┐  │
│  └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

## 4. Lock it

Record the pick where the repo keeps design decisions (an existing `DESIGN.md`, the token file's
header, or the notes folder). Optionally persist the seed:
`node scripts/search.mjs "<query>" --design-system --persist -p "<Project>"`.
From here on, every screen follows the locked direction; deviations need the user's say-so.

## Genre and texture catalogue

| Genre                   | Reads as                      | Fits                                        | Avoid for                         | Build with                                                  |
| ----------------------- | ----------------------------- | ------------------------------------------- | --------------------------------- | ----------------------------------------------------------- |
| Felt texture            | Tactile, warm, crafted        | Kids, wellness, handmade goods, games       | Dense data                        | Photo texture tile or SVG `feTurbulence` + lighting         |
| Fluid glass             | Liquid, premium, OS-like      | Consumer apps, music, launches              | Text-heavy pages, low-end devices | `backdrop-filter` + SVG displacement, solid fallback        |
| Thermal gradients       | Heat map, energy              | Climate, energy, analytics, AI              | Conservative finance              | Blurred radial gradients in OKLCH, or a shader              |
| Water ripples           | Calm, reflective              | Wellness, travel, audio                     | Productivity tools                | WebGL shader or animated `feTurbulence`; pauses off-screen  |
| Speckled graphite       | Matte, pencil, thoughtful     | Writing, notebooks, dev tools, architecture | Children's products               | Noise overlay on a dark tinted neutral                      |
| Single-hue landscapes   | Calm, branded, editorial      | Brand-led SaaS, publishing                  | Multi-category data               | Layered shapes from one OKLCH hue ramp                      |
| Blueprint grids         | Engineered, precise           | Dev tools, hardware, infra, APIs            | Lifestyle                         | `repeating-linear-gradient` grid, annotation lines          |
| Halftone                | Print, pop, editorial         | Media, music, zines, streetwear             | Medical, legal                    | Radial-gradient dots + mask, or canvas for images           |
| Grainy gradients        | Soft, analogue                | Creative tools, music, consumer AI          | Dense dashboards                  | OKLCH gradient + 3-8% SVG noise overlay                     |
| Grass texture           | Organic, outdoor              | Sport, agriculture, sustainability          | Fintech                           | Photo texture or shader, hero only                          |
| Dithered images         | Retro computing, lo-fi        | Dev tools, indie games, terminals           | Luxury                            | Ordered (Bayer) dither via canvas or shader, 1-2 colours    |
| Paper texture           | Literary, crafted             | Publishing, education, journals             | High-tech infra                   | Warm off-white + subtle noise                               |
| Contour lines           | Topographic, exploratory      | Maps, outdoor, research, data               | Product catalogues                | Generated SVG paths in one hue, thin strokes                |
| Cloud sky               | Airy, optimistic              | Consumer, travel, weather, assistants       | Security, enterprise              | Photography or soft shader, light blue to white             |
| Pixel mosaics           | Playful, nostalgic digital    | Games, creator tools, kids' coding          | Luxury, legal                     | CSS grid squares, `image-rendering: pixelated`              |
| Lens distortion         | Optical, cinematic            | Camera, photo, agencies, fashion            | Utility apps                      | WebGL or SVG displacement on hover, sparingly               |
| Stippled gradients      | Illustrative, scientific      | Biotech, research, editorial                | Fast commerce                     | Dot-density SVG pattern or shader                           |
| Square dot grids        | Structured, notebook          | Productivity, planners, design tools        | Luxury                            | `radial-gradient` background, 16-24px pitch, 6-10% alpha    |
| Blurred photos          | Atmospheric, foreground focus | Events, hospitality, music, portfolios      | Data products                     | Real photo + blur + scrim; measure text contrast            |
| Iridescent shapes       | Futuristic, holographic       | Beauty, fashion, AI launches                | Healthcare, government            | Conic gradients `in oklch longer hue`, soft 3D blobs        |
| Impressionist paintings | Cultural, humane              | Museums, wine, hospitality, wellness        | Dev tools                         | Public-domain art (pre-1929), cropped, credited             |
| ASCII and pixels        | Terminal, honest, hacker      | CLIs, dev tools, infra, security            | Consumer lifestyle                | `<pre>` with generated ASCII or a canvas character renderer |

More named styles (bento, brutalism, claymorphism, editorial and 80 others):
`node scripts/search.mjs "<style words>" -d style`.

## Rules for any texture

- One genre per product, applied everywhere it appears. Mixing two is slop.
- Text never sits directly on a busy texture: add a solid or scrimmed surface, then measure.
- Cheapest tech first: CSS, then SVG, then canvas, then WebGL. Static before animated.
- Animated textures pause off-screen and stop under `prefers-reduced-motion`.
- Budget: a texture must not move LCP. Lazy-load shaders after first paint.
