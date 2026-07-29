---
name: auditing-design-systems
description: Measurement-first audit and repair of design systems - colour tokens, contrast, colour-blind safety, gamut limits and preset palettes. Use when critiquing or changing a brand or primary colour, theme tokens, dark mode, or UI colour accessibility.
---

# Auditing Design Systems

Critique design systems with measured numbers, never adjectives. "This green feels harsh"
persuades nobody; "this green is 1.95:1 as a focus ring, so keyboard focus is invisible" ends it.

## Quick Start

```bash
node scripts/color-audit.mjs tokens path/to/tokens.css   # audit a whole token file
node scripts/color-audit.mjs gamut 126                   # can this hue ever be legible?
node scripts/color-audit.mjs cvd "#90c600" "#ef4444"     # colour-blind separation
```

Read the real token source and every app-level override before judging anything: docs drift,
and apps routinely patch the shared package. Audit the effective values a user sees.

## Gates, not opinions

| Thing | Floor |
| --- | --- |
| Body text on its surface | 4.5:1 |
| Focus ring, control boundary, meaningful icon | 3:1 |
| Two controls distinguished by colour | 3:1 luminance **or** >0.10 OKLab dE under CVD |

Hue-wheel distance is not colour-blind distance: red and green sit far apart on the wheel
yet collapse under deuteranopia. Decorative hairlines are exempt — do not over-report them.

## Root cause before hue

A bad colour is usually a bad token model. Check whether one token serves two jobs — the
button you press versus the state that is on. An overloaded token appears hundreds of times,
which is what forces "use sparingly" rules and drift sections into the docs. Fix the model
and the ratio enforces itself.

## Workflow

1. Read the real token source and every app override.
2. Measure. Dump every failing pair before forming an opinion.
3. Diagnose the token model; count usages of the suspect token.
4. Propose with numbers — a before/after table beats prose. Verify candidates are in-gamut.
5. Implement behind the gates, add a regression test, and add a legacy-value migration map
   whenever a re-tune would orphan saved data that stored the old value.
6. Verify with type-check, build, tests and a grep of the compiled output. Report honestly.

## References

- `references/audit-playbook.md` — phase-by-phase method and report format
- `references/colour-science.md` — gamut physics, CVD, dark mode, why hues fail
- `references/token-architecture.md` — role modelling, drift, migration safety
- `references/palette-recipes.md` — accents, neutrals, preset and backdrop sets
