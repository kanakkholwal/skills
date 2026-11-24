# Laws of UX as build rules

Each law becomes one thing to do in the interface. Full text and sources for the classics are in
[../ux/02-laws-of-ux.md](../ux/02-laws-of-ux.md). Apply every law that touches the screen at
hand; several act on one screen at once. If two laws pull opposite ways for this screen, ask the
user ([rules.md](rules.md#conflicts)).

## Contents

- [Perception and grouping](#perception-and-grouping)
- [Attention and memory](#attention-and-memory)
- [Decisions and effort](#decisions-and-effort)
- [Time and feedback](#time-and-feedback)
- [Motivation and emotion](#motivation-and-emotion)

## Perception and grouping

| Law                             | Build rule                                                                                                 |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Law of proximity                | Space inside a group is under half the space between groups                                                |
| Law of similarity               | Same role, same look: all links alike, all primary actions alike. Different role, visibly different        |
| Law of common region            | A shared surface or boundary groups items. Use one level, never nested boxes                               |
| Law of uniform connectedness    | A line, rail or shared background binds items more strongly than proximity (steppers, timelines, toolbars) |
| Law of Prägnanz                 | Prefer the simplest reading of a shape; align to a grid so groups read as clean rectangles                 |
| Von Restorff (isolation) effect | One thing differs: the primary action, the selected item. Differing everywhere erases it                   |
| Aesthetic-usability effect      | Polished UI reads as easier to use, and gets more patience. It does not excuse a broken flow               |

## Attention and memory

| Law                     | Build rule                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| Cognitive load          | Remove everything that does not serve the current task: fields, labels, options, decoration   |
| Miller's law / chunking | Chunk long values (phone, card, code) into groups of 3-4. Working memory holds about 4 chunks |
| Serial position effect  | Put the key items first and last in lists and navs; the middle is forgotten                   |
| Zeigarnik effect        | Show unfinished tasks (progress, drafts, checklists) so people return to them                 |
| Recognition over recall | Show options, recent items and examples instead of making people remember or type             |
| Selective attention     | Banner blindness is real: put key content in the flow, not in ad-shaped boxes                 |

## Decisions and effort

| Law                        | Build rule                                                                                                     |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Hick's law                 | Fewer choices per screen; sort, group, set a default, or reveal in steps                                       |
| Progressive disclosure     | Show the common case; put advanced options behind one clear step                                               |
| Default effect             | Most people keep the default, so make it the best choice and never a hidden upsell or consent                  |
| Pareto principle           | Design the 20% of features used 80% of the time first and largest                                              |
| Occam's razor              | Of two solutions that work, ship the one with fewer elements                                                   |
| Tesler's law               | Complexity cannot vanish, only move. Put it on the system (smart defaults, parsing), not the person            |
| Postel's law               | Be liberal in what you accept (spaces in card numbers, any date format), strict in what you output             |
| Parkinson's law            | Work expands to fill the time given: short, bounded steps and sensible deadlines on forms and tasks            |
| Paradox of the active user | People skip the manual and start clicking. Teach in context (empty states, inline hints), never a manual first |
| Jakob's law                | Use the patterns users know from other products. Novelty needs a reason                                        |

## Time and feedback

| Law               | Build rule                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------ |
| Doherty threshold | Respond within 400ms, acknowledge within 100ms. Beyond that show progress                  |
| Fitts's law       | Frequent and important targets are large and near the pointer; add padding to the hit area |
| Flow              | Do not interrupt a task with modals, toasts or reordering while someone is working         |

## Motivation and emotion

| Law                        | Build rule                                                                                      |
| -------------------------- | ----------------------------------------------------------------------------------------------- |
| Goal-gradient effect       | Effort rises near the goal. Show progress and give a head start (a step already filled in)      |
| Peak-end rule              | People remember the peak and the end. Make the success state and the last step the best moments |
| Mere exposure effect       | Familiarity breeds preference: keep layout, naming and styling consistent across the product    |
| Von Restorff plus peak-end | Spend delight (one animation, one illustration) at the rare, high-value moments only            |
