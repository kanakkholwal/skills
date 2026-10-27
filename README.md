# skills

Agent skills I use across projects. Each folder with a `SKILL.md` is one installable skill.

## Install

```sh
npx skills add kanakkholwal/skills                          # pick from the list
npx skills add kanakkholwal/skills -g --skill motion-design # one skill, user-level
```

Or copy or symlink a skill folder into `~/.claude/skills/`.

## UI and design

| Skill                                                 | Use it for                                                                                               |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [motion-design](ui/motion-design)                     | Building, reviewing and auditing web motion; jank; Apple-style gestures; Motion and GSAP; naming effects |
| [ux-design](ui/ux-design)                             | UX review and build guidance, WCAG 2.2, microcopy, 29 topic references, friction audits of flows         |
| [auditing-design-systems](ui/auditing-design-systems) | Measuring colour tokens, contrast, colour-blind safety and palettes                                      |
| [ui-ux-pro-max](ui/ui-ux-pro-max)                     | Searchable database of styles, palettes, font pairings and stack guidelines (needs Python 3)             |
| [site-redesign](ui/site-redesign)                     | End-to-end redesign of an existing site on baby-ui                                                       |

`motion-design` merges emil-design-eng, apple-design, animation-vocabulary, review-animations,
improve-animations, animate, animation-performance, find-animation-opportunities,
framer-motion-animator and gsap-core. `ux-design` merges ux-designer and ux-friction-analyzer.

## Other

- [frontend.md](frontend.md): frontend-design
- [outreach-writer.md](outreach-writer.md): cold outreach and job-application messages

## Credits

Merged and vendored skills keep their MIT notices in each folder's `LICENSE`: Emil Kowalski,
Szilárd Hajba, Patricio Marroquin, GreenSock, Erich Owens and Next Level Builder.
