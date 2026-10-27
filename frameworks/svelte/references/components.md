# Components

Component-level APIs beyond runes: context, lifecycle, mounting from JavaScript, custom elements, special `<svelte:*>` elements, TypeScript, and stores as legacy interop.

## Contents

- [Context](#context)
- [Lifecycle](#lifecycle)
- [Imperative API](#imperative-api)
- [Special elements](#special-elements)
- [svelte:boundary](#svelteboundary)
- [Custom elements](#custom-elements)
- [TypeScript](#typescript)
- [Stores (legacy interop)](#stores-legacy-interop)

## Context

Context passes values from a parent to any descendant without prop drilling. Use `createContext` (Svelte 5.40+): it returns typed functions and needs no key.

```ts
// context.ts
import { createContext } from "svelte";

interface User {
	name: string;
}

export const [getUserContext, setUserContext] = createContext<User>();
```

```svelte
<!-- Parent.svelte -->
<script>
	import { setUserContext } from './context';
	let { children } = $props();
	setUserContext({ name: 'world' });
</script>

{@render children()}
```

```svelte
<!-- Child.svelte -->
<script>
	import { getUserContext } from './context';
	const user = getUserContext();
</script>

<h1>hello {user.name}</h1>
```

Before 5.40, use `setContext(key, value)` and `getContext(key)` from `svelte`; the key can be any value. `hasContext` and `getAllContexts` also exist. Call these during component initialisation.

Reactive context: store a `$state` proxy and mutate it. Reassigning the variable breaks the link (Svelte warns). For primitives, pass a getter.

```svelte
<script>
	import { setCounter } from './context';
	let counter = $state({ count: 0 });
	setCounter(counter);
</script>

<button onclick={() => (counter.count = 0)}>reset</button>
<!-- not: counter = { count: 0 } -->
```

Context vs shared module state:

- A `$state` exported from a `.svelte.js` module is fine for client-only state.
- On the server, module state is shared by every request. Writing user data into it during SSR can leak that data to the next user.
- Context is per component tree and not shared between requests. Prefer it for request or user-specific state.

Providing context to a component mounted from JavaScript (5.49+): wrap it in a function that sets context, then mount the wrapper. Works with `mount`, `hydrate` and `render`; each call gets its own context.

```js
import { mount } from "svelte";
import { setUserContext } from "./context";
import MyComponent from "./MyComponent.svelte";

function Wrapper(...args) {
	setUserContext({ name: "Bob" });
	return MyComponent(...args);
}

mount(Wrapper, { target: document.body });
```

## Lifecycle

A Svelte 5 component has only creation and destruction. Updates are per effect, not per component, so there is no before/after update hook.

- `$effect` covers most mount and update logic and re-runs when its dependencies change.
- `$effect.pre` replaces `beforeUpdate`; `$effect` replaces `afterUpdate`. Both old hooks are deprecated and unavailable in runes mode.

`onMount` runs once after the component mounts, never on the server. Call it during initialisation (it may live in an external module). A returned function runs on unmount, but only if the callback is synchronous.

```svelte
<script>
	import { onMount } from 'svelte';

	onMount(() => {
		const id = setInterval(() => console.log('beep'), 1000);
		return () => clearInterval(id);
	});
</script>
```

`onDestroy` runs just before unmount. It is the only lifecycle hook that also runs during SSR.

`tick()` returns a promise that resolves once pending state changes are applied to the DOM (or next microtask if none).

```js
import { tick } from "svelte";

$effect.pre(() => {
	messages.length;
	tick().then(() => viewport.scrollTo(0, viewport.scrollHeight));
});
```

## Imperative API

Entry points for creating root components from JavaScript.

```js
import { mount, hydrate, unmount, flushSync } from "svelte";
import App from "./App.svelte";

const app = mount(App, {
	target: document.querySelector("#app"),
	props: { some: "property" },
});

flushSync(); // effects, onMount and actions do not run during mount() otherwise
await unmount(app, { outro: true }); // plays transitions first
```

- `mount`: create and attach to `target`. Use it for multiple roots or for in-app widgets such as a tooltip attached to a hovered element.
- `hydrate`: like `mount`, but reuses server-rendered HTML inside `target`. Effects also wait; call `flushSync()` if needed.
- `unmount`: removes a component created by `mount` or `hydrate`. Returns a promise that resolves after outros when `outro: true`, immediately otherwise.
- `render` (from `svelte/server`): server-only, requires compiling with the `server` option. Returns `{ head, body }` HTML strings.

```js
import { render } from "svelte/server";
import App from "./App.svelte";

const { head, body } = render(App, { props: { some: "property" } });
```

## Special elements

`<svelte:window>`, `<svelte:document>`, `<svelte:body>` and `<svelte:head>` must sit at the top level of a component, never inside a block or element. Listeners are removed automatically and are SSR-safe.

```svelte
<svelte:window onkeydown={handleKeydown} bind:scrollY={y} bind:innerWidth={w} />
<svelte:document onvisibilitychange={onVisibility} bind:visibilityState={vis} />
<svelte:body onmouseenter={enter} onmouseleave={leave} />

<svelte:head>
	<title>Hello world!</title>
	<meta name="description" content="Page description" />
</svelte:head>
```

- `<svelte:window>` bindings: `innerWidth`, `innerHeight`, `outerWidth`, `outerHeight`, `scrollX`, `scrollY`, `online`, `devicePixelRatio`. Only `scrollX`/`scrollY` are writable, and the initial value does not scroll the page; call `scrollTo()` in an `$effect` for that.
- `<svelte:document>` handles events that do not fire on `window` (e.g. `visibilitychange`) and accepts `{@attach}`. Readonly bindings: `activeElement`, `fullscreenElement`, `pointerLockElement`, `visibilityState`.
- `<svelte:body>` handles body-only events such as `mouseenter`/`mouseleave` and accepts `use:` actions.
- `<svelte:head>` content goes into `document.head`; during SSR it is returned separately as `head`.

`<svelte:element this={tag}>` renders a tag chosen at runtime.

```svelte
<svelte:element this={tag} class="box" onclick={handle}>content</svelte:element>
<svelte:element this={svgTag} xmlns="http://www.w3.org/2000/svg" />
```

- Nullish `this` renders nothing.
- Only `bind:this` is supported.
- Children inside a void element (e.g. `hr`) throw in dev.
- `this` must be a real DOM tag name.
- Set `xmlns` when the namespace cannot be inferred.

For dynamic components, render the component variable directly (`<Dynamic />`), not the legacy `<svelte:component>`.

## svelte:boundary

Svelte 5.3.0+. Walls off a subtree to show pending UI for `await` expressions and to catch errors thrown while rendering or running effects.

```svelte
<svelte:boundary onerror={(error, reset) => report(error)}>
	<FlakyComponent />
	<p>{await delayed('hello!')}</p>

	{#snippet pending()}
		<p>loading...</p>
	{/snippet}

	{#snippet failed(error, reset)}
		<button onclick={reset}>oops! try again</button>
	{/snippet}
</svelte:boundary>
```

- `pending` shows until the first `await`s inside resolve. Later updates do not show it again; use `$effect.pending()`. During SSR a boundary with `pending` renders only that snippet. Await expressions need `experimental.async`; see [await-expressions.md](await-expressions.md).
- `failed(error, reset)` replaces the content on error; `reset` recreates it. Pass it as a prop (`<svelte:boundary {failed}>`) or declare it inside.
- `onerror(error, reset)` is for reporting, or for exposing `error`/`reset` to UI outside the boundary. Errors thrown inside it (or rethrown) go to the parent boundary.
- Not caught: errors in event handlers, `setTimeout` callbacks, or other async work outside rendering.
- On the server, boundaries do nothing by default and a render error fails the whole render. Since 5.51, `render(App, { transformError })` lets boundaries with a `failed` snippet handle it. `transformError` returns a JSON-serialisable object that is sent to the client for hydration, so redact messages and stacks. `mount` and `hydrate` accept `transformError` too.

## Custom elements

Compile with the `customElement: true` compiler option and name the tag in `<svelte:options>`. `$host()` gives the host element.

```svelte
<svelte:options customElement="my-element" />

<script>
	let { name = 'world' } = $props();
</script>

<h1>Hello {name}!</h1>
<slot />
```

```js
import MyElement from "./MyElement.svelte";

// only needed when no tag was given in <svelte:options>
customElements.define("my-element", MyElement.element);
```

- Props become DOM properties (and attributes where possible): `el.name = 'everybody'`.
- Declare every prop explicitly. `let props = $props()` without listing them in options means none are exposed.
- The inner component is created on the tick after `connectedCallback` and destroyed on the tick after `disconnectedCallback`. Properties set earlier are kept; exported functions are only available after mount.
- Shadow DOM updates land on the next tick, batched.

Options object:

```svelte
<svelte:options
	customElement={{
		tag: 'custom-element',
		shadow: 'open', // 'none' | 'open' | ShadowRootInit
		props: {
			elementIndex: { reflect: true, type: 'Number', attribute: 'element-index' }
		},
		extend: (Base) => class extends Base {
			static formAssociated = true;
		}
	}}
/>
```

- `props.*.type` is one of `'String' | 'Boolean' | 'Number' | 'Array' | 'Object'` (default `String`). `reflect` defaults to `false`. Attribute name defaults to the lowercase prop name.
- `extend` receives the generated class and returns a subclass; use it for `ElementInternals` or for methods needed before mount. TypeScript there must use erasable syntax only and is not preprocessed.

Caveats:

- Styles are encapsulated, not just scoped. Global CSS and `:global(...)` do not reach inside unless `shadow: 'none'`, which also disables slots.
- CSS is inlined as a JavaScript string, not emitted as a `.css` file.
- Poor fit for SSR: shadow DOM is invisible until JavaScript loads.
- Slotted content renders eagerly, even inside `{#if}`, and once even inside `{#each}`.
- Context works between plain Svelte components inside one custom element, not across custom elements.
- Do not name props or attributes starting with `on`; they are treated as event listeners.
- Older browsers need polyfills.

## TypeScript

Add `lang="ts"`. Only type-only syntax is supported natively; enums, constructor parameter properties with modifiers, and non-standard syntax need `vitePreprocess({ script: true })`.

```svelte
<script lang="ts" generics="Item extends { text: string }">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		items: Item[];
		select(item: Item): void;
		row: Snippet<[Item]>;
	}

	let { items, select, row, ...rest }: Props = $props();
</script>

{#each items as item}
	<button {...rest} onclick={() => select(item)}>{@render row(item)}</button>
{/each}
```

- `generics` holds what goes between `<...>` of a generic function: multiple params, `extends`, defaults.
- `Snippet<[A, B]>` takes a tuple of parameter types; see [snippet.md](snippet.md).
- `svelte/elements` exports attribute types per element (`HTMLButtonAttributes`) and `SvelteHTMLElements['div']` for the rest. Augment `declare module 'svelte/elements'` for custom attributes or elements.
- `Component<Props>` types a component value; `ComponentProps<typeof X>` extracts props. `typeof MyComponent` is the constructor type and `MyComponent` the instance type for `bind:this`.
- `tsconfig.json`: `target` at least `ES2015`, `verbatimModuleSyntax: true`, `isolatedModules: true`.
- Check types with `svelte-check` in CI.

## Stores (legacy interop)

Prefer runes: `$state` in `.svelte.js` modules or classes covers shared state and extracted logic. Stores still fit complex async streams, cases needing manual control over updates and subscriptions, and RxJS interop.

```svelte
<script>
	import { writable, derived } from 'svelte/store';

	const count = writable(0);
	const doubled = derived(count, ($count) => $count * 2);
</script>

<button onclick={() => $count++}>{$count} x 2 = {$doubled}</button>
```

- `$store` auto-subscribes and unsubscribes. The store must be declared at the component top level. Assigning to `$store` calls `.set`.
- `svelte/store` exports `writable`, `readable`, `derived`, `readonly` and `get`. `get` subscribes and unsubscribes each call; avoid it in hot paths.
- The store contract: `subscribe(fn)` calls `fn` synchronously with the current value and returns an unsubscribe function; an optional `set(value)` makes it writable. Observables returning `{ unsubscribe }` also work.

Source: https://svelte.dev/docs/svelte/context, https://svelte.dev/docs/svelte/lifecycle-hooks, https://svelte.dev/docs/svelte/imperative-component-api, https://svelte.dev/docs/svelte/svelte-window, https://svelte.dev/docs/svelte/svelte-document, https://svelte.dev/docs/svelte/svelte-body, https://svelte.dev/docs/svelte/svelte-head, https://svelte.dev/docs/svelte/svelte-element, https://svelte.dev/docs/svelte/svelte-boundary, https://svelte.dev/docs/svelte/svelte-options, https://svelte.dev/docs/svelte/custom-elements, https://svelte.dev/docs/svelte/$host, https://svelte.dev/docs/svelte/typescript, https://svelte.dev/docs/svelte/stores, https://svelte.dev/docs/svelte/best-practices
