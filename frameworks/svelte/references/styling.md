# Styling

A component's `<style>` is scoped to that component by default. Reach outside the scope deliberately with `:global`, CSS custom properties, or the `class`/`style` attributes.

## Contents

- [Scoped styles](#scoped-styles)
- [Scoped keyframes](#scoped-keyframes)
- [:global](#global)
- [class attribute](#class-attribute)
- [class: directive (legacy)](#class-directive-legacy)
- [style: directive](#style-directive)
- [Custom properties on components](#custom-properties-on-components)
- [Nested style elements](#nested-style-elements)
- [Styling child components](#styling-child-components)
- [Global styles strategy](#global-styles-strategy)

## Scoped styles

Svelte adds a hash class (e.g. `svelte-123xyz`) to every element the component's selectors match, and appends it to the selectors.

```svelte
<p>styled</p>

<style>
	p {
		/* only <p> elements in this component */
		color: burlywood;
	}
</style>
```

- Each scoped selector gains 0-1-0 specificity, so a component `p` beats a global `p` even if the global sheet loads later.
- When the scoping class must appear more than once in a selector, repeats use `:where(.svelte-xyz)` to avoid adding more specificity.
- The compiler removes selectors that match nothing in the template and warns `css_unused_selector`. Elements it cannot see (`{@html}` output, child component internals) need `:global`.
- Native CSS nesting works and stays scoped:

```svelte
<style>
	.chess-board {
		display: grid;

		.black {
			background: black;
		}
	}
</style>
```

## Scoped keyframes

`@keyframes` names are hashed per component, and `animation` rules in the same component are rewritten to match.

```svelte
<style>
	.bouncy {
		animation: bounce 10s;
	}

	@keyframes bounce {
		/* only usable inside this component */
	}
</style>
```

Prefix with `-global-` to define a global animation name. The prefix is stripped at compile time, so reference it as `my-animation` elsewhere.

```css
@keyframes -global-my-animation {
	/* ... */
}
```

## :global

Selector form: `:global(...)` unscopes one selector part.

```svelte
<style>
	:global(body) {
		margin: 0;
	}

	/* <strong> in any component, inside this component's <div> */
	div :global(strong) {
		color: goldenrod;
	}

	/* this component's <p> with classes added at runtime, e.g. by a library */
	p:global(.big.red) {
		font-weight: bold;
	}
</style>
```

Block form: `:global { ... }` unscopes every rule inside. Placed after a scoped selector, it targets descendants of that element anywhere in the tree.

```svelte
<style>
	:global {
		/* every <div> in the app */
		div { box-sizing: border-box; }
	}

	.a :global {
		/* any .b .c .d inside this component's .a */
		.b .c .d { color: red; }
	}
</style>
```

`.a :global .b .c .d` is equivalent to the second block; the nested form is preferred.

## class attribute

Since Svelte 5.16, `class` accepts objects and arrays and is converted with clsx. Objects add truthy keys; arrays add truthy entries and flatten nested arrays and objects.

```svelte
<script>
	let { cool, faded, large } = $props();
</script>

<div class={{ cool, lame: !cool }}>...</div>
<div class={[faded && 'saturate-0 opacity-50', large && 'scale-200']}>...</div>
```

One condition can toggle several classes, which suits utility CSS such as Tailwind.

Merge a local class with a caller's `class` prop:

```svelte
<!-- Button.svelte -->
<script>
	let props = $props();
</script>

<button {...props} class={['cool-button', props.class]}>
	{@render props.children?.()}
</button>
```

```svelte
<Button class={{ 'bg-blue-700 sm:w-1/2': useTailwind }}>Accept</Button>
```

Type the prop with `ClassValue` (Svelte 5.19+):

```svelte
<script lang="ts">
	import type { ClassValue } from 'svelte/elements';

	let props: { class?: ClassValue } = $props();
</script>

<div class={['original', props.class]}>...</div>
```

Primitive values behave like any attribute. `class={undefined}` or `null` omits the attribute, but other falsy values such as `false` and `NaN` are currently stringified (`class="false"`). Use an object or array instead of `cond && 'x'` as the whole value.

## class: directive (legacy)

Before 5.16, `class:name={condition}` was the way to toggle classes. Prefer the object or array form, which is more powerful and composable.

```svelte
<!-- equivalent -->
<div class={{ cool, lame: !cool }}>...</div>
<div class:cool class:lame={!cool}>...</div>
```

## style: directive

Sets individual inline styles. Accepts expressions and shorthand.

```svelte
<div
	style:color
	style:width="12rem"
	style:background-color={darkMode ? 'black' : 'white'}
	style:--columns={columns}
>...</div>
```

- `style:color|important="red"` adds `!important`.
- `style:` wins over a `style` attribute for the same property, even over `!important` in the attribute.
- `style:--name={value}` is the standard way to feed a JS value into the component's CSS via `var(--name)`.

```svelte
<div class="grid" style:--columns={columns}>...</div>

<style>
	.grid {
		grid-template-columns: repeat(var(--columns), 1fr);
	}
</style>
```

## Custom properties on components

Pass `--name` props to a component to set CSS custom properties for it, static or dynamic.

```svelte
<Slider bind:value --track-color="black" --thumb-color="rgb({r} {g} {b})" />
```

Svelte wraps the component in an extra element that carries the properties:

```svelte
<svelte-css-wrapper style="display: contents; --track-color: black; --thumb-color: rgb(...)">
	<Slider bind:value />
</svelte-css-wrapper>
```

- Inside SVG the wrapper is a `<g>` instead.
- `display: contents` keeps layout unchanged, but selectors that depend on direct parentage (such as `parent > child`) no longer match the component's root.
- The component reads them with fallbacks:

```svelte
<style>
	.track {
		background: var(--track-color, #aaa);
	}
</style>
```

Custom properties inherit, so the values can also come from any ancestor, including `:root` in a global stylesheet.

## Nested style elements

Only one top-level `<style>` per component. A `<style>` nested inside an element or block is inserted into the DOM as-is: no scoping, no processing, and it applies to the whole document.

```svelte
<div>
	<style>
		/* affects every <div> on the page */
		div { color: red; }
	</style>
</div>
```

## Styling child components

Scoped CSS stops at component boundaries. In order of preference:

1. CSS custom properties: the parent passes `--color`, the child reads `var(--color)`.
2. A `class` prop merged into the child's root with the array form shown above.
3. `:global` under a scoped wrapper, when the child is third-party and exposes neither:

```svelte
<div>
	<Child />
</div>

<style>
	div :global {
		h1 { color: red; }
	}
</style>
```

## Global styles strategy

- Design tokens: define custom properties on `:root` in a global stylesheet; every component reads them with `var()`.
- App-wide resets and element defaults: a global stylesheet, or `:global { ... }` in the root component.
- Third-party or `{@html}` markup: scope `:global` under one of your own elements (`article :global { a {...} }`) so it cannot leak elsewhere.
- Keep everything else scoped. A bare `:global(div)` affects the whole app.
- Avoid nested `<style>` tags for global CSS; Svelte inserts them unprocessed.
- `<svelte:options css="injected" />` makes a component inject its styles inline (a `<style>` in `head` during SSR, via JavaScript on the client) instead of emitting separate CSS.
- Custom elements use shadow DOM: global stylesheets and `:global(...)` rules do not apply inside them unless compiled with `shadow: "none"`. See [components.md](components.md#custom-elements).

Source: https://svelte.dev/docs/svelte/scoped-styles, https://svelte.dev/docs/svelte/global-styles, https://svelte.dev/docs/svelte/custom-properties, https://svelte.dev/docs/svelte/nested-style-elements, https://svelte.dev/docs/svelte/class, https://svelte.dev/docs/svelte/style, https://svelte.dev/docs/svelte/@html, https://svelte.dev/docs/svelte/best-practices, https://svelte.dev/docs/svelte/svelte-options, https://svelte.dev/docs/svelte/custom-elements, https://svelte.dev/docs/svelte/compiler-warnings
