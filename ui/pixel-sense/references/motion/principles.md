# Animation principles and UI motion techniques

Every motion in the product follows every principle here that applies. Each is a heading with what
it means, a UI example, and do's and don'ts. The twelve principles come from Disney animation,
scaled down so they read as polish instead of wobble. Numbers and curves are in
[standards.md](standards.md); the frequency gate (should this animate at all) is in
[index.md](index.md). If two principles clash in a specific situation, ask the user.

## Contents

- Principles: [Squash and stretch](#squash-and-stretch), [Anticipation](#anticipation), [Staging](#staging), [Pose to pose](#pose-to-pose), [Follow-through and overlapping action](#follow-through-and-overlapping-action), [Slow in, slow out](#slow-in-slow-out), [Arcs](#arcs), [Secondary action](#secondary-action), [Timing](#timing), [Exaggeration](#exaggeration), [Solid drawing](#solid-drawing), [Appeal](#appeal)
- Techniques: [Origin-aware animation](#origin-aware-animation), [Stagger](#stagger), [Icon crossfade with scale and blur](#icon-crossfade-with-scale-and-blur), [Mask reveals](#mask-reveals), [Success pulse](#success-pulse), [Shared element transition](#shared-element-transition), [Interruptible animation](#interruptible-animation), [Knob stretch](#knob-stretch)

## Squash and stretch

**Means:** objects deform slightly under motion and force, which gives them weight.
**Example:** a toggle knob stretches about 12% along its travel while it slides, then settles back.
A pressed button compresses to 97%.
**Do:** keep deformation to 3-12%, on shapes and controls, and settle back to the true size.
**Don't:** squash or stretch text, or deform by more than about 15%.

## Anticipation

**Means:** a small opposite movement before the main one prepares the eye.
**Example:** a card pulls back 2-4% for 80ms before it flies into the cart.
**Do:** use it only before large or rare moves.
**Don't:** add it to frequent actions (hover, toggle, tab switch); it adds delay.

## Staging

**Means:** present one clear idea at a time and direct attention to it.
**Example:** a modal opens while the page behind dims, so only the dialog is in focus. A new row
slides in while neighbours stay still.
**Do:** dim or hold everything not in focus; move one thing at a time.
**Don't:** animate several unrelated things at once.

## Pose to pose

**Means:** define the key start and end states, then let the curve fill in between.
**Example:** a drawer defined as closed (`translateX(100%)`) and open (`translateX(0)`), with an
`ease-out` between them.
**Do:** design the two states first; use transitions between them.
**Don't:** hand-tune dozens of in-between keyframes for a simple state change.

## Follow-through and overlapping action

**Means:** parts of an object do not all stop at once; trailing parts settle a moment later.
**Example:** a card lands, then its title and meta text settle 40ms later, and a badge pops in last.
**Do:** let children settle 30-60ms after the parent, with the same curve family.
**Don't:** delay so long that the element feels slow or blocks input.

## Slow in, slow out

**Means:** movement eases at the start and end; nothing in the real world starts or stops
instantly.
**Example:** a dropdown opens with `ease-out` (fast start, soft landing); a panel moving across the
screen uses `ease-in-out`.
**Do:** `ease-out` for enter and exit, `ease-in-out` for on-screen movement, `linear` only for
constant motion (marquees, progress).
**Don't:** use `ease-in` on UI; it delays the moment the user is watching.

## Arcs

**Means:** natural motion follows curved paths, not straight lines.
**Example:** an item added to the cart travels in a gentle arc to the cart icon rather than a
straight diagonal.
**Do:** animate the x and y axes with different easing (or a motion path) so the object curves.
**Don't:** use arcs for small movements or controls the user is operating directly.

## Secondary action

**Means:** a small supporting motion that reinforces the main one without competing.
**Example:** when an item lands in the cart, the cart count ticks up and the icon nudges once.
**Do:** keep it smaller and shorter than the main action.
**Don't:** make the secondary motion louder than the thing it supports.

## Timing

**Means:** how long a motion takes sets its feel: fast is snappy, slow is heavy.
**Example:** dropdowns open in 150-250ms; a button press settles in 100-160ms; a modal in 200-300ms.
**Do:** keep UI under about 300ms, exits one half to one third of the entry time.
**Don't:** exceed 300ms for everyday UI, or make people wait for an animation to finish.

## Exaggeration

**Means:** push a motion slightly beyond realistic so it is noticed.
**Example:** a wrong-password field shakes 4-6px; a success check pulses to 1.04 and back.
**Do:** save exaggeration for feedback that must be noticed (errors, success).
**Don't:** exaggerate routine transitions, or repeat the exaggerated motion.

## Solid drawing

**Means:** keep volume, weight and light consistent so things look like real objects in space.
**Example:** layered cards share one light direction, with shadows that grow with elevation, and a
lifted card casts a softer, larger shadow.
**Do:** one light source, one elevation scale, consistent perspective in 3D or layered UI.
**Don't:** mix shadow directions or flat and deep elements without reason.

## Appeal

**Means:** the whole feels cohesive and likeable; motion has character that fits the product.
**Example:** a calm finance app uses one easing family and one duration scale everywhere; a
children's app may use bouncier springs throughout.
**Do:** pick one easing family and one duration scale, and match them to the brand's personality.
**Don't:** mix unrelated easings and speeds across components.

## Origin-aware animation

**Means:** an element grows from and returns to the thing that opened it, not from the centre.
**Example:** a menu opens from the button that triggered it, scaling from 0.95 with its origin at
the button, and closes back toward it.
**Do:** set `transform-origin` to the trigger (`var(--transform-origin)` in Base UI, the Radix
equivalent); modals stay centred.
**Don't:** scale a popover from its own centre or fade it out to nowhere.

## Stagger

**Means:** items in a group enter one after another with a small offset.
**Example:** a list of 6 rows fades and rises in with 30ms between rows.
**Do:** 30ms (up to 80ms) between items, capped near 300ms total; never block input while it plays.
**Don't:** use long delays, or stagger content people must act on at once.

## Icon crossfade with scale and blur

**Means:** when one icon replaces another, blend them with a small scale and blur so they read as
one icon changing.
**Example:** the copy icon becomes a check: the old icon scales to 0.8 and blurs to 3px as it fades
out, the new one scales from 0.8 and unblurs as it fades in.
**Do:** overlap both icons for about 150-200ms, blur under 4px.
**Don't:** hard-swap, or use heavy blur (it is expensive, especially in Safari).

## Mask reveals

**Means:** reveal content by animating a mask or `clip-path`, not by resizing the element.
**Example:** a heading reveals line by line with `clip-path: inset(0 0 100% 0)` moving to
`inset(0)`; a tab's colour change wipes across with a clipped duplicate.
**Do:** animate `clip-path` or a mask for reveals and colour wipes.
**Don't:** animate width or height to simulate a reveal.

## Success pulse

**Means:** one short scale or ring pulse confirms something worked.
**Example:** after saving, the saved item pulses from scale 1 to 1.04 and back in 300ms while a
check appears.
**Do:** pulse once, on the element that changed.
**Don't:** loop it, or use it for routine actions.

## Shared element transition

**Means:** the same object keeps its identity as it moves between two views, so people keep their place.
**Example:** a product thumbnail in a grid grows into the hero image on the detail page, the same
element in both places.
**Do:** share one `layoutId` (Motion) or one `view-transition-name` between the two states.
**Don't:** crossfade two copies of the same object, or reuse a name on more than one live element.

## Interruptible animation

**Means:** an animation can be reversed or redirected mid-flight without a jump.
**Example:** hover a card and leave before the lift finishes: it eases back from where it is.
**Do:** use CSS transitions (they retarget) and springs (they keep velocity) for anything the user
can trigger rapidly.
**Don't:** use keyframes for fast-fired UI; they restart from zero.

## Knob stretch

**Means:** a moving control stretches along its travel while it moves.
**Example:** a switch knob is 20px at rest and about 24px while sliding.
**Do:** about 12% along the travel axis, settling on arrival.
**Don't:** stretch the knob's label or icon.
