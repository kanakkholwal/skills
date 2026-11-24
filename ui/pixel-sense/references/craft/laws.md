# Laws of UX

Each law is a heading with what it means, a UI example, and do's and don'ts. Apply every law that
touches the screen at hand. Fuller text for the classics is in
[../ux/02-laws-of-ux.md](../ux/02-laws-of-ux.md). If two laws clash in a specific situation, ask the
user ([rules.md](rules.md#when-rules-clash)).

Sources: all 30 entries of [Laws of UX](https://lawsofux.com/) (Jon Yablonski), plus the default
effect from behavioural economics.

## Contents

- Perception: [Proximity](#law-of-proximity), [Similarity](#law-of-similarity), [Common region](#law-of-common-region), [Uniform connectedness](#law-of-uniform-connectedness), [Prägnanz](#law-of-prägnanz), [Von Restorff](#von-restorff-effect), [Aesthetic-usability](#aesthetic-usability-effect)
- Memory and attention: [Cognitive load](#cognitive-load), [Miller's law](#millers-law), [Serial position](#serial-position-effect), [Zeigarnik](#zeigarnik-effect), [Recognition over recall](#recognition-over-recall)
- Choices and effort: [Hick's law](#hicks-law), [Progressive disclosure](#progressive-disclosure), [Default effect](#default-effect), [Pareto](#pareto-principle), [Occam's razor](#occams-razor), [Tesler's law](#teslers-law), [Postel's law](#postels-law), [Parkinson's law](#parkinsons-law), [Paradox of the active user](#paradox-of-the-active-user), [Jakob's law](#jakobs-law)
- Memory and attention, continued: [Chunking](#chunking), [Working memory](#working-memory), [Selective attention](#selective-attention), [Flow](#flow)
- Decisions, continued: [Choice overload](#choice-overload), [Mental model](#mental-model), [Cognitive bias](#cognitive-bias)
- Time and motivation: [Doherty threshold](#doherty-threshold), [Fitts's law](#fittss-law), [Goal-gradient](#goal-gradient-effect), [Peak-end rule](#peak-end-rule)

## Law of proximity

**Means:** things placed close together are seen as one group.
**Example:** a settings page where each label sits 4px above its input and 32px below the previous
field. The pairs read as units without any boxes.
**Do:** keep the gap inside a group under half the gap between groups.
**Don't:** use equal spacing everywhere, then add dividers to compensate.

## Law of similarity

**Means:** things that look alike are seen as related.
**Example:** every text link is the accent colour and underlined; every primary button is filled.
Users learn what is clickable without hovering.
**Do:** give one role one look, and different roles visibly different looks.
**Don't:** style a non-link in the link colour, or two unrelated actions identically.

## Law of common region

**Means:** items inside one bounded area are seen as a group.
**Example:** a pricing plan's name, price and features sit on one card surface, separate from the
next plan.
**Do:** use one surface level per group.
**Don't:** nest cards inside cards, or box every item; spacing is usually enough.

## Law of uniform connectedness

**Means:** items joined by a line, rail or shared background read as more related than items that
are merely near each other.
**Example:** a vertical line through the dots of an order timeline, or a shared toolbar background
binding five icon buttons.
**Do:** use a connecting line for sequences and a shared bar for tool groups.
**Don't:** connect items that are not related; the line claims a relationship.

## Law of Prägnanz

**Means:** people read ambiguous shapes in the simplest way they can.
**Example:** a card grid on a clean 12-column grid reads as one tidy block; the same cards with
ragged offsets read as noise.
**Do:** align to a grid, use simple geometry, keep silhouettes clear.
**Don't:** use complex or overlapping shapes where a simple one communicates the same thing.

## Von Restorff effect

**Means:** the item that differs from its neighbours is the one remembered.
**Example:** in a row of three pricing cards, only the recommended plan has a filled button and an
accent border.
**Do:** make exactly one thing differ: the primary action, the selected item.
**Don't:** highlight everything; contrast only works against a calm field.

## Aesthetic-usability effect

**Means:** people perceive polished interfaces as easier to use and forgive small problems.
**Example:** a tidy signup form with consistent spacing and type gets more patience when a field
errors than a cramped one.
**Do:** treat visual polish as part of usability; fix alignment and spacing early.
**Don't:** rely on it to hide a broken flow; users still fail the task, they just blame themselves.

## Cognitive load

**Means:** the mental effort needed to use an interface; working memory is small and easily
overloaded.
**Example:** a checkout that asks for shipping on one screen and payment on the next, each with only
the fields needed, beats one long page of 20 fields.
**Do:** remove fields, options and decoration that do not serve the current task; split big tasks.
**Don't:** add ornament, extra copy or choices "just in case".

## Miller's law

**Means:** working memory holds only a handful of items (about 4 chunks by the modern estimate,
7 plus or minus 2 in the original); chunking helps.
**Example:** a card number shown as `4242 4242 4242 4242` and a phone number as `+44 7911 123 456`
are easier to check than unbroken digits.
**Do:** chunk long values into groups of 3-4; group long lists under headings.
**Don't:** treat "7 items" as a hard menu limit; it is about memory, not navigation.

## Serial position effect

**Means:** people remember the first and last items in a series best.
**Example:** a mobile tab bar puts Home first and Account last; the rarely used items sit in the
middle.
**Do:** place the most important items at the start and end of navs and lists.
**Don't:** bury the key action in the middle of a long list.

## Zeigarnik effect

**Means:** unfinished tasks stay in mind more than finished ones.
**Example:** a profile card showing "Profile 70% complete" with the missing items listed pulls
people back to finish.
**Do:** show progress and what remains for tasks left open.
**Don't:** use it to nag; a permanent unfinished badge becomes noise.

## Recognition over recall

**Means:** recognising options is easier than remembering them.
**Example:** a search box that shows recent searches and suggestions, and a date field with a
calendar picker, instead of a blank field and a format to remember.
**Do:** show options, recents and examples; keep labels visible (not placeholder-only).
**Don't:** make people remember a code, a command or a value from a previous screen.

## Hick's law

**Means:** decision time grows with the number and complexity of choices.
**Example:** a pricing page with 3 plans is easier to decide on than 9; a command menu groups 40
actions under 6 headings.
**Do:** cut options, sort and group them, mark a recommended one.
**Don't:** show every option at once to look "complete".

## Progressive disclosure

**Means:** show only what is needed now; reveal advanced options on demand.
**Example:** an export dialog with Format and Destination visible, and an "Advanced" disclosure
holding compression and metadata options.
**Do:** put the common case first and one clear step to the rest.
**Don't:** hide something most people need, or nest disclosures several levels deep.

## Default effect

**Means:** most people keep whatever is preselected (behavioural economics, from nudge theory and
status quo bias; not a Laws of UX entry).
**Example:** "email me receipts" on and "share my data" off decides what most users end up with.
**Do:** make the default the choice that serves the user; label recommended options.
**Don't:** preselect upsells, consent or tracking; that is a dark pattern.

## Pareto principle

**Means:** roughly 80% of use comes from 20% of the features.
**Example:** an editor puts Save, Undo and Share in the toolbar and moves rare actions into a
menu.
**Do:** find the few actions used most and make them large, near and obvious.
**Don't:** give every feature equal weight on the screen.

## Occam's razor

**Means:** among solutions that work, choose the one with the fewest elements.
**Example:** a form that infers the country from the phone prefix instead of adding a country
dropdown.
**Do:** remove an element and see if the task still works; if yes, leave it out.
**Don't:** keep a control because it was there before.

## Tesler's law

**Means:** every system has irreducible complexity; someone has to handle it, so put it on the
system, not the user.
**Example:** a card form that detects the card brand and formats the number itself rather than
asking the user to pick a type and type spaces.
**Do:** absorb complexity with smart defaults, parsing and autofill.
**Don't:** simplify the screen by pushing the hard decision onto the user.

## Postel's law

**Means:** be liberal in what you accept, conservative in what you send.
**Example:** a phone field that accepts `07911 123456`, `+44 7911123456` and `(079) 11 123 456`,
and stores one clean format.
**Do:** accept varied input, normalise it, and give precise output.
**Don't:** reject valid input over spaces, dashes or case.

## Parkinson's law

**Means:** work expands to fill the time available.
**Example:** a booking flow that says "Takes about 2 minutes" and shows 3 steps gets finished; an
open-ended application form drifts for days.
**Do:** bound tasks with short steps, sensible deadlines and honest time estimates.
**Don't:** leave long, open-ended tasks with no sense of scope.

## Paradox of the active user

**Means:** people skip the manual and start using the product straight away, even if reading it
would save time.
**Example:** an empty dashboard that shows "Add your first project" with a template, instead of a
15-page help guide or a locked tour.
**Do:** teach in context: empty states, inline hints, sensible defaults, undo.
**Don't:** make a manual or a forced tour the gate to using the product.

## Jakob's law

**Means:** people spend most of their time on other products, so they expect yours to work the same.
**Example:** a logo in the top left that links home, a cart icon top right, a search field with a
magnifier.
**Do:** use familiar patterns for navigation, forms and icons.
**Don't:** reinvent a standard control without a clear gain.

## Doherty threshold

**Means:** productivity soars when the system responds in under about 400ms.
**Example:** a button that shows a pressed state in under 100ms and a skeleton after 300ms while
the request finishes.
**Do:** acknowledge input within 100ms; show progress for anything slower than 400ms.
**Don't:** leave a click with no visible response while the work happens.

## Fitts's law

**Means:** time to hit a target depends on its distance and size.
**Example:** a full-width "Continue" bar at the bottom of a mobile screen, and an icon button with
a 44px hit area around a 20px icon.
**Do:** make frequent targets large and near; extend the hit area beyond the visual.
**Don't:** place a destructive button next to a primary one with a tiny gap.

## Goal-gradient effect

**Means:** effort speeds up as people near a goal.
**Example:** a stepper that starts at "Step 2 of 4" because name and email are prefilled, and a
progress bar that fills smoothly.
**Do:** show progress and give a head start.
**Don't:** hide the number of steps, or add a surprise step at the end.

## Peak-end rule

**Means:** people judge an experience by its most intense moment and its end.
**Example:** after checkout, a clear confirmation with a single pulse on the order number and the
next step, rather than a bare "Done".
**Do:** invest in the success state and the last step; spend delight there.
**Don't:** end a flow on an error page or an upsell wall.

## Chunking

**Means:** breaking information into small, meaningful groups so it is easy to scan and process.
**Example:** a long settings page split into titled sections (Profile, Notifications, Billing), each
with 3-5 related fields, instead of one list of 25 controls.
**Do:** group related content into distinct modules with a clear heading and spacing between them.
**Don't:** present one undifferentiated wall of fields, links or text.

## Working memory

**Means:** the system that briefly holds information needed for the current task; it fades in
seconds and holds only a few chunks.
**Example:** a comparison table that carries the selected products across screens, and links that
change colour once visited, so people do not have to remember what they already saw.
**Do:** carry key information from screen to screen; mark what is already viewed; put the memory
burden on the system.
**Don't:** ask people to remember a value from one step to use it three steps later.

## Selective attention

**Means:** people focus on what relates to their goal and filter out the rest, including anything
that looks like an ad (banner blindness) and changes that arrive without a strong cue (change
blindness).
**Example:** a promo banner styled like an ad above the checkout form gets ignored, and a price
that changes elsewhere on the page goes unnoticed.
**Do:** style important content unlike ads, keep it in the flow of the task, and make significant
changes obvious (a highlight, a message).
**Don't:** put key content in banner-shaped boxes, or change two things at once so neither is seen.

## Choice overload

**Means:** too many options overwhelm people and hurt both the decision and how they feel about it
(also called the paradox of choice).
**Example:** a plan page with 12 near-identical tiers stalls; 3 tiers with a side-by-side comparison
and one marked "Most popular" gets chosen.
**Do:** prioritise what is shown, offer search and filters to narrow, and enable side-by-side
comparison when comparing is the task.
**Don't:** list every option at the same weight and leave the sorting to the user.

## Mental model

**Means:** the compressed picture people hold of how a system works, built from past experience,
which they apply to new products.
**Example:** a cart icon, an "Add to cart" button and a step-by-step checkout match what shoppers
already know, so they act without reading.
**Do:** match your design to the users' existing model; research the gap with interviews and
journey maps.
**Don't:** make a familiar action behave differently (a trash icon that archives, a save that
publishes).

## Cognitive bias

**Means:** systematic shortcuts in thinking that shape perception and decisions without people
noticing (for example confirmation bias, anchoring, status quo bias).
**Example:** a high "anchor" price shown first makes the middle plan look cheap; reviewers who
already like a design read test results as proof it works.
**Do:** know the biases in play, test with real users, and design so a biased shortcut does not
lead to a harmful result.
**Don't:** exploit a bias to push a choice against the user's interest; that crosses into a dark
pattern.

## Flow

**Means:** the state of full, energised focus that happens when a task's challenge matches the
person's skill.
**Example:** an editor with instant autosave, immediate visual feedback on each action and no
blocking dialogs lets people stay absorbed; a modal asking to confirm each change breaks it.
**Do:** give feedback for every action, remove friction, and match difficulty to skill (progressive
onboarding, sensible defaults).
**Don't:** interrupt with modals, popups, forced reloads or surprise reordering during a task.
