# skills

Agent skills I use across projects. Every skill is a folder with a `SKILL.md` that follows the
[Agent Skills spec](https://agentskills.io/specification), so it works in any agent that reads skills
(Claude Code, Codex, Cursor, Gemini CLI, OpenCode and others).

## Install

```sh
npx skills add kanakkholwal/skills                          # pick from the list
npx skills add kanakkholwal/skills -g --skill pixel-sense   # one skill, user-level
```

Or copy or symlink a skill folder into your agent's skills directory (`~/.claude/skills/`,
`~/.agents/skills/`).

## UI and design

| Skill                                         | Use it for                                                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [pixel-sense](ui/pixel-sense)                 | Design, build, review, audit and deslop UI: direction, colour, type, layout, motion, UX, friction audits, style catalogue |
| [modern-web-guidance](ui/modern-web-guidance) | Current HTML, CSS and browser API patterns via the `modern-web-guidance` CLI (needs network and npx)                      |
| [site-redesign](ui/site-redesign)             | End-to-end redesign of an existing site on baby-ui                                                                        |

`pixel-sense` merges frontend-design, ux-design (ux-designer, ux-friction-analyzer), motion-design
(emil-design-eng, apple-design, animation-vocabulary, review-animations, improve-animations,
animate, animation-performance, find-animation-opportunities, framer-motion-animator, gsap-core),
auditing-design-systems and ui-ux-pro-max (its Python engine ported to Node), and adds
`references/craft/` plus `scripts/slop-scan.mjs`. Scripts need Node 18+ and nothing else.

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
