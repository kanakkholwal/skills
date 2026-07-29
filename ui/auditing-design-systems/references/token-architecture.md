# Token Architecture

Modelling, naming, and changing colour tokens without breaking things.

## Contents

- [Model tokens by role, not by appearance](#model-tokens-by-role-not-by-appearance)
- [The overload smell](#the-overload-smell)
- [Naming](#naming)
- [Governance rules and why they appear](#governance-rules-and-why-they-appear)
- [Doc-versus-source drift](#doc-versus-source-drift)
- [Changing values safely](#changing-values-safely)
- [Common defects worth grepping for](#common-defects-worth-grepping-for)

---

## Model tokens by role, not by appearance

Name a token for the job it does, never for what it looks like. `--primary` is a role;
`--lime` is a description that becomes a lie the moment the colour changes.

The roles a colour system actually needs:

| Role | Frequency | Job |
| --- | --- | --- |
| Action | Once per view | The button the user presses |
| State | Many per view | Selected, active, focused, on |
| Status | As needed | Success, warning, error, info — meaning only, never decoration |
| Structure | Everywhere | Surfaces, borders, secondary text |
| Encoding | Domain-specific | Chart series, category/lane identity |

These have wildly different frequencies. Fusing two of them into one token is the most
common structural fault in a design system.

## The overload smell

Signs one token is doing several jobs:

- It appears hundreds of times across the codebase.
- The docs contain a rule limiting its use ("never decorative", "10% only").
- The docs contain a "known drift" section admitting the rule is not followed.
- Engineers reach for it whenever they want something to look branded.

**The fix is structural, not disciplinary.** Splitting action from state removes the single
seductive "brand colour" utility, and the usage ratio enforces itself. A governance rule is
what a system writes instead of fixing its model.

**Caveat when splitting:** decide the compat alias deliberately. If `--primary` currently
covers both action and state, aliasing it to a *neutral* action token turns every selected
row and toggle white in dark mode. Alias to the token that is acceptable in both roles
(usually the chromatic one), then migrate action sites deliberately.

## Naming

Follow the conventions of whatever framework is in use rather than inventing a parallel
vocabulary. If the project uses shadcn/ui, the vocabulary is `--primary`, `--secondary`,
`--muted`, `--accent`, `--destructive`, `--ring`, `--border`, `--input`. Introducing
`--signal` or `--brand` alongside those creates two systems for one job.

Prefer one well-modelled token in the house vocabulary over a bespoke taxonomy. Add a new
token name only when it names a genuinely new role.

## Governance rules and why they appear

The 60/30/10 rule (60% canvas, 30% structure, 10% accent) is a useful budget. But a system
that needs an elaborate reserved-list to police one token usually has a modelling problem
underneath. Treat a long "never use it for X" list as a symptom to diagnose, not a
convention to enforce harder.

## Doc-versus-source drift

Audit these routinely — each is a real finding:

- Doc names a token the source never defines.
- Doc points at the wrong package for tokens the apps actually define.
- Doc's table contradicts the doc's rule.
- Source defines undocumented parallel systems (a second accent, gradient anchors, a
  hardcoded focus ring) that no doc mentions.
- Scaffolding defaults left un-audited from a starter template.

Update docs in the same change that moves the tokens. A doc updated later is a doc that
never gets updated.

## Changing values safely

**Check how IDs relate to values.** If preset IDs are derived from their values
(`id: "#eaffd0"`, `id: "linear-gradient(...)"`), re-tuning changes the ID. Saved user data
holding the old literal still renders, but stops matching any known preset and silently
reads as "custom".

Two valid fixes:

1. **Stable slug IDs** (`id: "sage"`) — correct long-term, but if the codebase documents
   value-as-ID as deliberate back-compat, changing it needs its own migration.
2. **A legacy-value migration map** — map each retired value to its replacement and apply it
   at load. Cheaper and usually sufficient.

Requirements for a migration map:

- Every replacement must be a value that still exists. Assert this in a test.
- It must be idempotent: migrating an already-migrated value is a no-op. Assert this too.
- Custom (non-preset) values must pass through untouched.
- Remember it **rewrites stored data** — a saved document will look different. Say so
  explicitly when reporting; it is the owner's call.

**Namespace IDs when merging preset lists.** If selection is matched by ID across several
lists and a shared source reuses names in more than one list, picking one highlights both.
Prefix per list.

## Common defects worth grepping for

| Pattern | Why it breaks |
| --- | --- |
| `hsl(var(--token))` where the token is `oklch()`/hex | Invalid CSS; the whole declaration is silently dropped |
| `rgba(...)` hardcoded in a token file | Bypasses theming; usually a second, competing accent |
| A border token lighter than the background it sits on | Invisible; hierarchy tier does not render |
| A dark-mode border darker than its card | Reads as a seam |
| `all: unset` on an element selector | Strips focus rings and disabled states |
| `:has(foo)` where `[foo]` was meant | Never matches; inert rule one typo from firing |
| Same override duplicated in two apps | Fix upstream and delete both |
| Out-of-gamut `oklch()` | Silently clipped; rendered colour is not the specified one |

Add a regression test that asserts the contrast floors against the token file. The gate is
what stops the next drift — a documented rule is not.
