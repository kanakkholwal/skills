# Phase 7: Content

## Voice

The owner's voice, first person, plain. Specific numbers and names over adjectives. No em or en dashes, no
"passionate", "innovative", "scalable solutions", "cutting-edge", "leverage". Short sentences. If the old copy
is slop, rewrite it; don't polish it.

## Hero and positioning

- Role first, then what they're open to ("Product engineer, open to founding engineer roles at early-stage
  teams"). Don't name the current employer in the hero unless asked.
- Never name an employer's clients publicly, even if they might be public.

## Case study structure (projects)

Every project body uses the same sections:

1. **Overview**: what it is, who it's for, one line on status.
2. **The problem**: the specific pain, with a real example.
3. **Wins**: outcomes with numbers (users, visits, downloads, latency) and the decision that produced them.
4. **How it's built** / **Tech stack**: rendered from frontmatter, not duplicated in prose.
5. **What's next**: honest, short.

Keep the frontmatter schema intact; edit descriptions and bodies only. Keep descriptions 120 to 160 chars
(they double as meta descriptions).

## Fact checking

- Every number comes from a source you read in this session: the repo, the live API, the paper.
- **Primary beats secondary.** A README can describe old experiments; the thesis/report/changelog is truth.
  When they conflict, follow the primary and tell the user the secondary is stale.
- Say what isn't validated (clinical use, production scale) instead of implying it.

## Credits

Attribution page lists design references with links (sites whose layout or intro inspired the work) and the
libraries the site runs on. Link text uses the same TextLink/Marker as prose.

## Writing pages and categories

A category without a note falls back to "Everything filed under X." Give every category a one-line note so its
meta description isn't thin.
