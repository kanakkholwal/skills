# Template syntax

Svelte markup is HTML plus `{expressions}`, logic blocks, tags and directives. Snippets, `{@render}`, `{@attach}` and `$inspect` have their own files; this one covers the rest.

## Contents

- [Attributes, props and spread](#attributes-props-and-spread)
- [Events](#events)
- [{#if}](#if)
- [{#each}](#each)
- [{#key}](#key)
- [{#await}](#await)
- [{@html}](#html)
- [Declaration tags and {@const}](#declaration-tags-and-const)
- [{@debug}](#debug)
- [bind:](#bind)
- [transition:, in:, out:](#transition-in-out)
- [animate:](#animate)
- [use: (legacy)](#use-legacy)

## Attributes, props and spread

- Lowercase tags are elements; capitalised or dotted tags (`<Widget>`, `<my.stuff>`) are components.
- Values may be quoted strings, interpolated strings or bare expressions.
- Boolean attributes render when truthy. Other attributes are omitted only when `null` or `undefined`.
- `name={name}` shortens to `{name}`.
- `{expression}` text is escaped. `null`/`undefined` render nothing. Wrap regex literals in parentheses.

```svelte
<a href="page/{p}">page {p}</a>
<button disabled={!clickable}>...</button>
<input required={false} />
<button {disabled}>...</button>
<div>{(/^[A-Za-z ]+$/).test(value) ? x : y}</div>
```

Quoting a lone expression (`disabled="{x}"`) parses the same today but will coerce to a string in Svelte 6. Leave it unquoted.

Spread passes many attributes or props at once. Later entries win:

```svelte
<!-- things.a beats a="b"; c="d" beats things.c -->
<Widget a="b" {...things} c="d" />
```

## Events

Any attribute starting with `on` is a listener. Handlers support shorthand and spread like other attributes.

```svelte
<button onclick={() => count++}>+</button>
<button {onclick}>...</button>
<button {...props}>...</button>
```

- Names are case sensitive: `onclick` is `click`, `onClick` is a `Click` event.
- Event attributes fire after binding updates (`oninput` runs after `bind:value` changes).
- `ontouchstart` and `ontouchmove` are passive. To call `preventDefault` on them, use `on` from `svelte/events`.
- Common events (`click`, `input`, `keydown`, `pointerdown`, and others) are delegated to the app root. When dispatching one manually, set `{ bubbles: true }`. Avoid `stopPropagation` in raw `addEventListener` handlers; prefer `on` from `svelte/events`, which keeps ordering correct.
- For `window`, `document` and `body` events use `<svelte:window>`, `<svelte:document>`, `<svelte:body>` (see [components.md](components.md#special-elements)), not `onMount` or `$effect`.

## {#if}

```svelte
{#if porridge.temperature > 100}
	<p>too hot!</p>
{:else if 80 > porridge.temperature}
	<p>too cold!</p>
{:else}
	<p>just right!</p>
{/if}
```

Blocks can wrap text as well as elements.

## {#each}

Iterates arrays, array-likes (anything with `length`) and iterables such as `Map` and `Set`. `null`/`undefined` count as empty.

```svelte
{#each items as item, i (item.id)}
	<li>{i + 1}: {item.name} x {item.qty}</li>
{:else}
	<li>No items</li>
{/each}
```

- Second binding is the index. `{:else}` renders when the list is empty.
- Key `(expr)` must uniquely identify each item. Prefer string or number keys; never the index. Keys let Svelte move, insert and remove DOM instead of patching items in place. Details in [each.md](each.md).
- Destructuring and rest patterns work: `{#each items as { id, ...rest } (id)}`. Avoid destructuring when you need `bind:value={item.count}`.
- Omit `as` to repeat n times: `{#each { length: 8 }, i}`.

## {#key}

Destroys and recreates its contents when the expression changes. Components inside are re-instantiated; transitions replay.

```svelte
{#key value}
	<div transition:fade>{value}</div>
{/key}
```

It is expensive. To re-run logic in a child when a value changes, use `$derived` in the child instead.

## {#await}

Branches on a promise's pending, fulfilled and rejected states.

```svelte
{#await promise}
	<p>loading...</p>
{:then value}
	<p>{value}</p>
{:catch error}
	<p>{error.message}</p>
{/await}

{#await promise then value}<p>{value}</p>{/await}
{#await promise catch error}<p>{error}</p>{/await}
```

- SSR renders only the pending branch. A non-promise value renders only `:then`, on server and client.
- Lazy component: `{#await import('./Component.svelte') then { default: Component }}<Component />{/await}`.
- For `await` directly in script and markup (5.36+, `experimental.async`), see [await-expressions.md](await-expressions.md).

## {@html}

Injects raw HTML. It is an XSS vector: only pass strings you control or have sanitised. Never render unsanitised user content.

```svelte
<article>{@html content}</article>
```

- Each tag must be valid standalone HTML; `{@html '<div>'}...{@html '</div>'}` fails.
- Svelte syntax inside the string is not compiled.
- Scoped styles do not reach it. Target it with `:global`:

```svelte
<style>
	article :global {
		a { color: hotpink; }
	}
</style>
```

## Declaration tags and {@const}

Declaration tags (Svelte 5.56+) declare locals in markup with `const` or `let`. They are visible to siblings and their descendants.

```svelte
{#each boxes as box}
	{const area = box.width * box.height}
	<p>{box.width} x {box.height} = {area}</p>
{/each}
```

Use runes for reactive locals:

```svelte
{#if editing}
	{let name = $state(user.name)}
	{const greeting = $derived(`Hello ${name}`)}
	<input bind:value={name} />
	<p>{greeting}</p>
{/if}
```

`{@const x = y}` is legacy. It only works as an immediate child of a block, a component or `<svelte:boundary>`. Prefer `{const x = $derived(y)}`.

## {@debug}

Logs the listed variables when they change and pauses if devtools are open. Accepts variable names only, not expressions. With no arguments it breaks on any state change.

```svelte
{@debug user}
{@debug user1, user2}
<!-- does not compile: {@debug user.firstname} -->
```

For reactive logging use `$inspect` ([inspect.md](inspect.md)).

## bind:

`bind:property={lvalue}` makes data flow from element or child back to state. `bind:value` is short for `bind:value={value}`. Most bindings are two-way; some are readonly.

Inputs:

```svelte
<input bind:value={message} />
<input type="number" bind:value={n} /> <!-- number, undefined when empty/invalid -->
<input type="checkbox" bind:checked={accepted} />
<input type="checkbox" bind:checked bind:indeterminate />
<details bind:open={isOpen}>...</details>
<div contenteditable bind:innerHTML={html}></div>
```

- `defaultValue` / `defaultChecked` (5.6.0+) set the value restored on form reset. On first render the bound value wins unless it is `null`/`undefined`.
- `<select bind:value>` binds the selected option's `value`, which can be any type. `multiple` binds an array. `defaultValue` on `<select>` needs 5.57.0+.
- `bind:files` takes a `FileList`. To clear it, assign `new DataTransfer().files`; `null` does not work. Leave the state uninitialised for SSR, since `DataTransfer` may not exist there.
- Contenteditable supports `innerHTML`, `innerText`, `textContent`.

Groups: radios bind one value, checkboxes bind an array. Inputs must be in the same component.

```svelte
<input type="radio" bind:group={tortilla} value="Plain" />
<input type="radio" bind:group={tortilla} value="Spinach" />
<input type="checkbox" bind:group={fillings} value="Rice" />
<input type="checkbox" bind:group={fillings} value="Beans" />
```

Dimensions (readonly, via `ResizeObserver`): `clientWidth`, `clientHeight`, `offsetWidth`, `offsetHeight`, `contentRect`, `contentBoxSize`, `borderBoxSize`, `devicePixelContentBoxSize`.

```svelte
<div bind:offsetWidth={width} bind:offsetHeight={height}>
	<Chart {width} {height} />
</div>
```

`display: inline` elements have no size (except intrinsic ones like `<img>`, `<canvas>`); CSS transforms do not trigger updates.

Media: `<audio>`/`<video>` two-way `currentTime`, `playbackRate`, `paused`, `volume`, `muted`; readonly `duration`, `buffered`, `seekable`, `seeking`, `ended`, `readyState`, `played`. `<video>` adds readonly `videoWidth`, `videoHeight`. `<img>` has readonly `naturalWidth`, `naturalHeight`.

`bind:this` gets the DOM node or component instance. It is `undefined` until mount, so read it in an effect or handler.

```svelte
<script>
	let canvas;
	$effect(() => draw(canvas.getContext('2d')));
</script>

<canvas bind:this={canvas}></canvas>
<ShoppingCart bind:this={cart} /> <!-- cart.empty() calls an exported function -->
```

Function bindings (5.9.0+) take a getter and setter for validation or transforms. Readonly bindings pass `null` as the getter. See [bind.md](bind.md).

```svelte
<input bind:value={() => value, (v) => (value = v.toLowerCase())} />
<div bind:clientWidth={null, redraw}>...</div>
```

Component bindings require the child to mark the prop with `$bindable()`; see [runes.md](runes.md#bindable).

## transition:, in:, out:

Transitions play when an element enters or leaves the DOM due to a state change. While a block transitions out, all its elements stay until every transition in it finishes.

```svelte
<script>
	import { fade, fly } from 'svelte/transition';
	let visible = $state(false);
</script>

{#if visible}
	<div transition:fade={{ duration: 2000 }}>reversible</div>
	<div in:fly={{ y: 200 }} out:fade>flies in, fades out</div>
{/if}
```

- `transition:` is bidirectional and reverses smoothly mid-flight. `in:`/`out:` do not reverse; an aborted out restarts from scratch.
- Local by default: plays only when its own block is created or destroyed. Add `|global` to also play for parent blocks.
- Transitions use the Web Animations API, so a global `prefers-reduced-motion` CSS rule does not affect them. Use `prefersReducedMotion` from `svelte/motion`.
- Events: `onintrostart`, `onintroend`, `onoutrostart`, `onoutroend`.

Custom transition: `(node, params, { direction }) => { delay?, duration?, easing?, css?, tick? }`. `t` runs 0 to 1 for in and 1 to 0 for out (after easing); `u = 1 - t`. Prefer `css` over `tick`, since web animations can run off the main thread. Returning a function instead of an object defers it a microtask, which enables crossfades.

```js
function grow(node, { duration = 400 }) {
	return { duration, css: (t) => `transform: scale(${t})` };
}
```

## animate:

Runs when items of a keyed each block are reordered (not on add or remove). The element must be an immediate child of the keyed block.

```svelte
<script>
	import { flip } from 'svelte/animate';
</script>

{#each list as item (item.id)}
	<li animate:flip={{ delay: 500 }}>{item.name}</li>
{/each}
```

Custom: `(node, { from, to }, params) => { delay?, duration?, easing?, css?, tick? }` where `from`/`to` are `DOMRect`s before and after the reorder.

## use: (legacy)

From Svelte 5.29, prefer attachments (`{@attach}`), which are more flexible and composable; see [attach.md](attach.md). Actions still work: the function runs once on mount (never on the server) and does not re-run when its argument changes.

```svelte
<script>
	/** @type {import('svelte/action').Action<HTMLDivElement, string>} */
	function tooltip(node, text) {
		$effect(() => {
			// setup with node and text
			return () => {
				// teardown
			};
		});
	}
</script>

<div use:tooltip={'hello'}>...</div>
```

Returning `{ update, destroy }` from an action is the pre-runes pattern; use `$effect` inside instead. Convert library actions to attachments with `fromAction` from `svelte/attachments`.

Source: https://svelte.dev/docs/svelte/basic-markup, https://svelte.dev/docs/svelte/if, https://svelte.dev/docs/svelte/each, https://svelte.dev/docs/svelte/key, https://svelte.dev/docs/svelte/await, https://svelte.dev/docs/svelte/@html, https://svelte.dev/docs/svelte/@const, https://svelte.dev/docs/svelte/declaration-tags, https://svelte.dev/docs/svelte/@debug, https://svelte.dev/docs/svelte/bind, https://svelte.dev/docs/svelte/transition, https://svelte.dev/docs/svelte/in-and-out, https://svelte.dev/docs/svelte/animate, https://svelte.dev/docs/svelte/use, https://svelte.dev/docs/svelte/best-practices
