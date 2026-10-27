# skills

Agent skills I use across projects. Every skill is a folder with a `SKILL.md` that follows the
[Agent Skills spec](https://agentskills.io/specification), so it works in any agent that reads skills
(Claude Code, Codex, Cursor, Gemini CLI, OpenCode and others).

## Install

```sh
npx skills add kanakkholwal/skills                          # pick from the list
npx skills add kanakkholwal/skills -g --skill motion-design # one skill, user-level
```

Or copy or symlink a skill folder into your agent's skills directory (`~/.claude/skills/`,
`~/.agents/skills/`).

## UI and design

| Skill                                                 | Use it for                                                                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [motion-design](ui/motion-design)                     | Building, reviewing and auditing web motion; jank; Apple-style gestures; design-engineering craft; Motion and GSAP |
| [ux-design](ui/ux-design)                             | UX review and build guidance, WCAG 2.2, microcopy, 29 topic references, friction audits of flows                   |
| [modern-web-guidance](ui/modern-web-guidance)         | Current HTML, CSS and browser API patterns via the `modern-web-guidance` CLI (needs network and npx)               |
| [auditing-design-systems](ui/auditing-design-systems) | Measuring colour tokens, contrast, colour-blind safety and palettes                                                |
| [ui-ux-pro-max](ui/ui-ux-pro-max)                     | Searchable database of styles, palettes, font pairings and stack guidelines (needs Python 3)                       |
| [frontend-design](ui/frontend-design)                 | A distinctive visual direction for new UI                                                                          |
| [site-redesign](ui/site-redesign)                     | End-to-end redesign of an existing site on baby-ui                                                                 |

`motion-design` merges emil-design-eng, apple-design, animation-vocabulary, review-animations,
improve-animations, animate, animation-performance, find-animation-opportunities,
framer-motion-animator and gsap-core, each kept complete under `references/`. `ux-design` merges
ux-designer and ux-friction-analyzer.

## Frameworks

| Skill                       | Use it for                                                                                   |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| [svelte](frameworks/svelte) | Svelte 5 runes, SvelteKit routing, data, remote functions, deployment, packaging, LayerChart |

`svelte` replaces eleven svelte-\* and sveltekit-\* skills. It is built from the official Svelte skills
and the Svelte, SvelteKit and LayerChart docs, all MIT.

## Writing

| Skill                                      | Use it for                                 |
| ------------------------------------------ | ------------------------------------------ |
| [outreach-writer](writing/outreach-writer) | Cold outreach and job-application messages |

## Checks

```sh
node scripts/validate-skills.mjs   # spec rules: name, description, frontmatter keys, links
```

## Credits

Merged and vendored skills keep their upstream notices in each folder's `LICENSE`: Emil Kowalski,
Szilárd Hajba, Patricio Marroquin, GreenSock, Erich Owens, Next Level Builder, Svelte contributors
and Sean Lynch (MIT); Google Chrome team and Anthropic (Apache 2.0).
