# Runes

Runes are compiler keywords prefixed with `$` that declare reactivity in `.svelte`, `.svelte.js` and `.svelte.ts` files. They are not imported and cannot be passed around as values.

## Contents

- [$state](#state)
- [$state.raw and $state.snapshot](#stateraw-and-statesnapshot)
- [Classes with state](#classes-with-state)
- [Sharing state across functions and modules](#sharing-state-across-functions-and-modules)
- [$derived and $derived.by](#derived-and-derivedby)
- [$effect](#effect)
- [$effect.pre, $effect.tracking, $effect.root](#effectpre-effecttracking-effectroot)
- [When not to use $effect](#when-not-to-use-effect)
- [$props](#props)
- [$bindable](#bindable)
- [$props.id and $host](#propsid-and-host)
- [Common mistakes](#common-mistakes)

## $state

Use `$state` only for values that must drive the template, a `$derived` or an `$effect`. The variable is the plain value: no getter, no setter.

```svelte
<script>
	let count = $state(0);
</script>
<button onclick={() => count++}>clicks: {count}</button>
```

Arrays and plain objects become deep proxies. Property writes and mutating methods (`push`, `splice`) trigger granular updates, and objects pushed later are proxied too. Proxying stops at anything that is not an array or plain object (class instances, `Object.create` results).

```js
let todos = $state([{ done: false, text: "add more todos" }]);
todos[0].done = !todos[0].done; // updates only what reads todos[0].done
todos.push({ done: false, text: "eat lunch" });
```

- Writing through the proxy does not mutate the original object.
- Destructuring reads values once: `let { done } = todos[0]` is not reactive.
- A proxy and the object it wraps are different identities, so `value === proxy` is always `false`.
- For reactive `Set`, `Map`, `Date`, `URL`, import from `svelte/reactivity` (see [svelte-reactivity.md](svelte-reactivity.md)).
- TypeScript: `let count: number = $state(0)`; with no initial value use `$state<number>()`, typed `number | undefined`.

## $state.raw and $state.snapshot

`$state.raw` skips proxying. It can only be reassigned, not mutated. Use it for large objects and arrays you replace wholesale, such as API responses.

```js
let person = $state.raw({ name: "Heraclitus", age: 49 });
person.age += 1; // no effect
person = { ...person, age: 50 }; // works
```

Raw state may contain reactive state (a raw array of proxied objects). Class fields can use `$state.raw` too.

`$state.snapshot(value)` returns a plain, non-proxy copy. Use it before handing state to code that does not expect a proxy (`structuredClone`, third-party libraries, `console.log`). If a value has `toJSON`, the snapshot clones the `toJSON` result.

`$state.eager(value)` reflects a change in the UI immediately even while an `await` expression is holding back synchronized updates. Use it sparingly, for direct feedback to user actions; see [await-expressions.md](await-expressions.md).

## Classes with state

Class instances are never proxied. Declare reactive fields with `$state` (public or private), or as the first assignment to a property inside the constructor.

```js
class Todo {
	done = $state(false);

	constructor(text) {
		this.text = $state(text);
	}

	reset = () => {
		this.text = "";
		this.done = false;
	};
}
```

- The compiler turns these fields into prototype `get`/`set` pairs over private fields, so they are not enumerable.
- `onclick={todo.reset}` loses `this` if `reset` is a normal method. Use an arrow-function field (above) or `onclick={() => todo.reset()}`.
- `$derived` and `$state.raw` also work as class fields.
- For a field set later in the constructor, `count = $state() as number;` avoids `undefined` in its type.

## Sharing state across functions and modules

A function receives the current value, not the variable. To keep reading live state, pass a getter, a proxy, or an object with `get` accessors.

```js
const double = (getN) => () => getN() * 2;
const doubled = double(() => count); // doubled() stays current
```

In `.svelte.js`/`.svelte.ts`, you cannot export state that is reassigned (compile error `state_invalid_export`). The compiler rewrites each reference in that file only, so importers would get the internal signal object. Either export an object and mutate its properties, or keep the variable private behind functions.

```js
// state.svelte.js
export const counter = $state({ count: 0 });

let count = $state(0);
export const getCount = () => count;
export const increment = () => (count += 1);
```

Module-level state is shared by every request during SSR. See [components.md](components.md#context) for when context is the safer choice.

## $derived and $derived.by

Compute values from state with `$derived(expression)`. The expression must be free of side effects; writing state inside it throws `state_unsafe_mutation`.

```js
let doubled = $derived(count * 2);
```

`$derived.by(fn)` takes a function for logic that does not fit one expression. `$derived(expr)` equals `$derived.by(() => expr)`.

```js
let numbers = $state([1, 2, 3]);
let total = $derived.by(() => {
	let sum = 0;
	for (const n of numbers) sum += n;
	return sum;
});
```

Dependencies:

- Anything read synchronously in the expression or function body is a dependency. Use `untrack` from `svelte` to exclude a read.
- If the expression itself contains `await`, state read after the `await` is tracked too (not inside functions it calls). Requires async mode, see [await-expressions.md](await-expressions.md).
- Svelte uses push-pull: dependents are marked dirty immediately, but a derived is recomputed only when read. If the new value is referentially identical to the old one, downstream updates are skipped.

Writable deriveds (Svelte 5.25+): reassign a non-`const` derived to override it until its dependencies next change. Good for optimistic UI.

```svelte
<script>
	let { post, like } = $props();
	let likes = $derived(post.likes);

	async function onclick() {
		likes += 1;
		try {
			await like();
		} catch {
			likes -= 1;
		}
	}
</script>
```

- Derived values are not made deeply reactive. Deriving `items[index]` from a `$state` array still returns the original proxy, so mutating it updates `items`.
- Destructuring a derived keeps every binding reactive: `let { a, b } = $derived(stuff());`.

## $effect

Effects run side effects (canvas drawing, third-party libraries, network calls, analytics) after the component mounts and after DOM updates. They never run during SSR, so do not wrap their body in `if (browser)`.

```svelte
<script>
	let size = $state(50);
	let canvas;

	$effect(() => {
		const ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillRect(0, 0, size, size);
	});
</script>
<canvas bind:this={canvas} width="100" height="100"></canvas>
```

Return a teardown. It runs before each re-run and when the effect is destroyed (component unmount or parent effect re-run).

```js
$effect(() => {
	const id = setInterval(() => count++, ms);
	return () => clearInterval(id);
});
```

Dependency rules:

- Tracked: `$state`, `$derived` and `$props` values read synchronously, including through function calls.
- Not tracked: reads after `await`, inside `setTimeout`, or inside `untrack(...)`.
- Reading an object tracks the reference, not its properties. `$effect(() => { obj; })` does not re-run on `obj.value = 1`; read `obj.value` instead.
- Dependencies are recalculated each run. A branch not taken on the last run is not tracked.
- Re-runs are batched in a microtask, so changing two dependencies at once causes one run.
- Effects can be created anywhere while a parent effect runs (component init, inside another effect). Creating one in an event handler or after an `await` in an async function throws `effect_orphan`.

`$effect.pending()` returns the number of pending promises in the current boundary; see [await-expressions.md](await-expressions.md).

## $effect.pre, $effect.tracking, $effect.root

`$effect.pre` has the same API but runs before DOM updates scheduled after it (parent DOM may already be updated). Use it to measure the DOM before an update, such as autoscroll.

```js
$effect.pre(() => {
	if (!div) return;
	messages.length; // dependency
	if (div.offsetHeight + div.scrollTop > div.scrollHeight - 20) {
		tick().then(() => div.scrollTo(0, div.scrollHeight));
	}
});
```

`$effect.tracking()` returns `true` inside a tracking context (an effect or the template) and `false` in setup code or event handlers. It exists for abstractions like `createSubscriber`.

`$effect.root` creates an untracked scope that is not cleaned up automatically, and lets you create effects outside component initialisation. Call the returned function to destroy it.

```js
const destroy = $effect.root(() => {
	$effect(() => console.log(count));
	return () => console.log("cleanup");
});
destroy();
```

## When not to use $effect

`$effect` is an escape hatch. Do not use it to sync one piece of state to another.

```js
// wrong: let doubled = $state(); $effect(() => { doubled = count * 2; });
let doubled = $derived(count * 2);
```

| Need                                          | Use instead                                                          |
| --------------------------------------------- | -------------------------------------------------------------------- |
| Value computed from state                     | `$derived` / `$derived.by`                                           |
| Override a computed value (optimistic UI)     | Writable `$derived`                                                  |
| Two linked inputs                             | Function binding, see [bind.md](bind.md)                             |
| React to user input                           | Event handler                                                        |
| Sync with a DOM element or library such as D3 | `{@attach}`, see [attach.md](attach.md)                              |
| Debug-log changes                             | `$inspect`, see [inspect.md](inspect.md)                             |
| Observe something external                    | `createSubscriber`, see [svelte-reactivity.md](svelte-reactivity.md) |
| Listen on `window`/`document`                 | `<svelte:window>` / `<svelte:document>`                              |

Linked inputs without effects:

```svelte
<script>
	let spent = $state(0);
	let left = $derived(total - spent);
</script>

<input type="range" bind:value={spent} max={total} />
<input type="range" bind:value={() => left, (v) => (spent = total - v)} max={total} />
```

If an effect truly must write state it also reads, wrap the read in `untrack` to avoid a loop.

## $props

Destructure props from `$props()`. Defaults apply when the prop is missing or `undefined`.

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		adjective?: string;
		super?: string;
		children?: Snippet;
		onselect: (id: string) => void;
		[key: string]: unknown;
	}

	let {
		adjective = 'happy',
		super: trouper = 'lights', // rename keywords or invalid identifiers
		children,
		onselect,
		...rest
	}: Props = $props();
</script>
```

- JSDoc alternative: `/** @type {{ adjective: string }} */` above the declaration.
- Wrapping a native element: type with `svelte/elements` interfaces such as `HTMLButtonAttributes`, or `SvelteHTMLElements['div']`.
- Snippet props use `Snippet<[ArgTypes]>`; see [snippet.md](snippet.md).
- Generic components: `<script lang="ts" generics="Item extends { text: string }">`; see [components.md](components.md#typescript).
- Treat props as changing: compute from them with `$derived`, not a plain `const`.

Updating props:

- A child may temporarily reassign a prop; the parent's next change overwrites it.
- Do not mutate props. Mutating a plain object prop has no effect. Mutating a `$state` proxy owned by the parent works but warns `ownership_invalid_mutation`.
- Fallback values are not proxied, so mutating a fallback object does nothing.
- Communicate upward with callback props, or share the object with `$bindable`.

## $bindable

Mark a prop with `$bindable()` to let the parent use `bind:`. Use sparingly; two-way flow makes data harder to trace.

```svelte
<!-- FancyInput.svelte -->
<script>
	let { value = $bindable(), ...props } = $props();
</script>

<input bind:value {...props} />
```

```svelte
<FancyInput bind:value={message} />
```

- Bindable means the parent can bind, not that it must.
- `$bindable('fallback')` sets a fallback for when the prop is not passed. If the parent binds, it must pass a value other than `undefined`, or a runtime error is thrown.

## $props.id and $host

`$props.id()` (Svelte 5.20.0+) returns an ID unique to the component instance and stable between server render and hydration. Use it for `for`, `id`, `aria-labelledby`.

```svelte
<script>
	const uid = $props.id();
</script>

<label for="{uid}-name">Name</label>
<input id="{uid}-name" />
```

`$host()` returns the host element, only in components compiled as custom elements.

```svelte
<svelte:options customElement="my-stepper" />

<script>
	const dispatch = (type) => $host().dispatchEvent(new CustomEvent(type));
</script>

<button onclick={() => dispatch('increment')}>+</button>
```

## Common mistakes

- Syncing state in `$effect` instead of `$derived`. Leads to extra renders and `effect_update_depth_exceeded` when an effect reads and writes the same state (`array.push` counts as both).
- Writing state inside `$derived` or a template expression: throws `state_unsafe_mutation`. Make every dependent value derived.
- Declaring a reassigned variable without `$state`: compile warning `non_reactive_update`, the UI never updates.
- Reading reassigned state once at setup, e.g. `setContext('count', count)`: warning `state_referenced_locally`. Pass a getter or a proxy object.
- Exporting reassigned `$state` from a module: `state_invalid_export`.
- Destructuring a `$state` object and expecting the locals to update.
- Comparing a proxy with its source object using `===`: warning `state_proxy_equality_mismatch`.
- Passing a class method as a handler and losing `this`.
- Computing from props with a plain `const`, or mutating props instead of using callbacks or `$bindable` (`ownership_invalid_mutation`).
- Expecting an effect to track reads after `await` or inside `setTimeout`.
- Returning a cleanup from an `async` `onMount` callback: an async function returns a promise, so the cleanup never runs.
- Using `$state` for values that never drive the UI, or for large replace-only data (use `$state.raw`).

Source: https://svelte.dev/docs/svelte/$state, https://svelte.dev/docs/svelte/$derived, https://svelte.dev/docs/svelte/$effect, https://svelte.dev/docs/svelte/$props, https://svelte.dev/docs/svelte/$bindable, https://svelte.dev/docs/svelte/$host, https://svelte.dev/docs/svelte/best-practices, https://svelte.dev/docs/svelte/typescript, https://svelte.dev/docs/svelte/runtime-errors, https://svelte.dev/docs/svelte/runtime-warnings, https://svelte.dev/docs/svelte/compiler-warnings, https://svelte.dev/docs/svelte/compiler-errors
