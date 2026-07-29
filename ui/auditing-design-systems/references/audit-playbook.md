# Audit Playbook

The end-to-end method for auditing and repairing a design system.

## Contents

- [Phase 1: Read the real source](#phase-1-read-the-real-source)
- [Phase 2: Measure before opining](#phase-2-measure-before-opining)
- [Phase 3: Diagnose the model](#phase-3-diagnose-the-model)
- [Phase 4: Write the critique](#phase-4-write-the-critique)
- [Phase 5: Implement](#phase-5-implement)
- [Phase 6: Verify and report](#phase-6-verify-and-report)
- [Checklist](#checklist)

---

## Phase 1: Read the real source

Documentation drifts from tokens. Tokens drift from what renders. Audit what a user sees.

Find, in this order:

1. The token source (`tokens.css`, `theme.ts`, `_variables.scss`, a design package).
2. **Every app-level override.** Apps routinely patch the shared package. If two apps
   patch it identically, that duplication is itself a finding — fix it upstream.
3. The compiled output. Grep the built CSS for the token to confirm what shipped.

Cross-check the docs against the source and list every contradiction. Typical finds:

- The doc names a font/token the source does not define.
- The doc points at package A for tokens that live in app B.
- The doc's own table contradicts its own rule a few lines later.
- A "known drift" section admitting the doc is aspirational.

Each contradiction is a real finding. Docs that lie are worse than no docs.

## Phase 2: Measure before opining

Dump every failing pair *before* forming a view. Run:

```bash
node scripts/color-audit.mjs tokens path/to/tokens.css
```

Then measure the pairs the automated list cannot infer: selection states, disabled text,
status colours as text vs. as fills, chart series against the plot background, and any
colour used at partial alpha (`/40`, `/60` — alpha multiplies an already-weak contrast).

Record numbers in a table. Numbers are the argument.

## Phase 3: Diagnose the model

A failing colour is usually a symptom. Ask:

**Is one token doing more than one job?** The classic overload is *action* (the button you
press, once per view) fused with *state* (selected/active/on, dozens per view). One token
for both means it must appear everywhere, which is why the docs grew a "use sparingly" rule.

**How many usages?** Count them. A token on 400+ sites is not an accent, whatever the doc says.

**How many accent hues exist in total?** Count every hue in the token file including
undocumented ones — gradients, chart series, lane/category colours, stray scaffolding
defaults. A doc that governs one token while the palette ships fifteen hues is not a system.

**Do semantic tokens collide?** Measure hue distance between brand and success, warning and
destructive. Under ~20 degrees they read as the same colour.

## Phase 4: Write the critique

Structure that lands:

1. **Verdict up front** — one paragraph, the root cause, not a list of nits.
2. **What's good** — genuinely. Credibility comes from noticing the reasoned parts.
3. **The measured case** — tables. Before/after, with floors stated.
4. **The structural case** — the token-model diagnosis.
5. **Concrete bugs found along the way** — dead CSS, invalid syntax, landmines.
6. **What I'd ship** — specific values, with their measured results.
7. **Open decisions** — what needs the owner's call and why.

Rules:
- Never assert a number that was not computed.
- Separate physics from taste. "sRGB has no dark saturated corner at this hue" is a fact;
  "violet feels premium" is an opinion. Label them differently.
- Give a recommendation, not a menu.

## Phase 5: Implement

Order matters — land the safe structural fixes before the visible ones:

1. Fix the shared source; delete now-redundant app overrides. Watch for overrides in a
   `.dark` block that would silently revert an upstream fix.
2. Add the new tokens. Keep the old name as an alias so nothing breaks at once.
3. **Choose the alias target carefully.** Aliasing a state-heavy token to a *neutral* turns
   every selected item white in dark mode. Alias to the token that works in both roles,
   then migrate the action sites deliberately.
4. Repoint focus/ring tokens early — that is the accessibility fix, and it is one line.
5. Delete dead and duplicate tokens.
6. Update the docs in the same change, or the drift restarts immediately.

## Phase 6: Verify and report

Run all of these; report what they actually said:

- Type-check
- Build (compiles the CSS — type-check alone does not)
- Test suite
- **Grep the compiled output** for the new token values and for the removed ones (expect zero)

Report honestly: what shipped, what regressed, what was skipped and why. If a
recommendation turned out wrong on contact with the code, say so plainly and move on.

## Checklist

```
- [ ] Read token source + every app override + compiled output
- [ ] Listed doc-vs-source contradictions
- [ ] Measured every pair; recorded a table
- [ ] Counted usages of the suspect token
- [ ] Counted total accent hues in the system
- [ ] Diagnosed the token model, not just the hue
- [ ] Proposed values with measured before/after
- [ ] Verified every candidate is inside sRGB
- [ ] Added a regression test for the gates
- [ ] Type-check, build, tests, compiled-output grep
- [ ] Docs updated in the same change
- [ ] Reported what was left undone
```
