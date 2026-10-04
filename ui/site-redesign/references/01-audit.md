# Phase 1 + 2: Recon, audit, direction

## Recon (read-only)

Inventory with counts. Counts persuade; adjectives don't.

```bash
# component sources, icon sets, motion libs (adapt globs to the repo)
grep -rl "framer-motion\|from \"motion" src | wc -l
grep -rl "lucide-react\|react-icons" src | wc -l
grep -rhoE "@radix-ui/[a-z-]+" src | sort | uniq -c
grep -rhoE "duration-\[[0-9.]+m?s\]|duration: ?0?\.[0-9]+" src | sort | uniq -c
grep -rhoE "text-\[[0-9]+px\]|text-2xs" src | wc -l
```

Record:
- Framework, router, deploy target, package manager, lint/format tools, CI steps.
- Token model: where CSS vars live, colour space, dark mode strategy, how many themes or "styles".
- Fonts loaded and where each is actually used (a font for one wordmark is a font to drop).
- Component sources (shadcn/Radix, magicui, kibo, bespoke `animated/*`), dead components.
- Routes, including duplicates (`/journey` and `/journey-v2`), and what nav exposes vs what hides in the footer.

## Baseline screenshots

Run `scripts/shot.mjs` before touching anything: light and dark, 375 and 1280, every top-level route.
Save under the scratchpad `before/`. You will compare against these at the end.

## The four-part audit

Write `<notes>/redesign-audit.md` with these sections. Each bullet: observation, evidence (file, count, ratio).

1. **System**: parallel designs, token model mismatch, font count, component sources, icon sets, motion libs,
   scroll hijacking (Lenis), dead code.
2. **Visual** (per key page, light, 1280): focal point (one or many?), visual load (boxed everything, dot grids,
   chips), hierarchy of lists (flagship vs side project indistinguishable?), broken assets, body text size and
   contrast, measure.
3. **Motion**: what animates and why, durations/easings in use (list the distinct values), route changes snap or
   transition, animations on high-frequency actions, reduced-motion coverage.
4. **UX**: where the primary action lives, nav vs footer-only pages, duplicate routes, dead ends, mobile nav.

Close with a short **Direction** paragraph and an **Information architecture** sketch (nav groups, home section
order).

## Reference sites

When the user names references, fetch each and extract concrete traits, not vibes:
- Shell: rails, sidebar, top bar, numbered sections, dashed rules, breadcrumbs, search entry.
- Hero: what's above the fold, the one focal element, activity or proof card.
- Type: display face, body size, mono usage for numerals/dates.
- Motion: intro, page transitions, hover rolls, text effects.

## Direction checkpoint

Offer 2 to 3 directions with AskUserQuestion, each with an ASCII mockup in `preview`. Typical set:
- **A**: pure reference site 1 layout.
- **B**: pure reference site 2 layout.
- **C (often the winner)**: hybrid, e.g. site 1's desktop shell with site 2's home hero.

Log the decision with a date in the audit's **Decisions log**. Every later decision (palette variant, command
palette variant, removed feature) goes there too, one line each.

## Checklist block

End the audit with a checklist the rest of the work ticks off: Foundation, Pages (one line per route), Cleanup
(delete legacy, remove deps, gates, screenshot matrix, reduced motion check).
