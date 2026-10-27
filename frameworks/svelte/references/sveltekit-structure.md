# SvelteKit structure

Routing, layouts, page options, hooks, errors and SSR rules. Written against SvelteKit 3; `v2:` notes mark what differs in SvelteKit 2.

## Contents

- Project layout
- Route files
- Layouts, groups and resets
- Parameters and matchers
- Page options
- Hooks
- Errors
- svelte:boundary
- Server-only modules
- Shallow routing
- SSR and hydration pitfalls

## Project layout

```
src/
  lib/              # imported as #lib (v2: $lib)
  routes/           # filesystem router
  app.html          # page template
  error.html        # fallback page when everything else fails
  env.ts            # environment variable declarations
  hooks.server.ts   # handle, handleFetch, handleError, init
  hooks.client.ts   # handleError, init
  hooks.ts          # reroute, transport (both sides)
  params.ts         # param matchers
static/             # served as-is (robots.txt etc.)
vite.config.ts      # sveltekit({ ... }) options (v2: svelte.config.js)
```

- `#lib` is a Node subpath import: `"imports": { "#lib": "./src/lib/index.js", "#lib/*": "./src/lib/*" }` in `package.json`. Imports need the extension: `#lib/foo.js`.

- Put `%sveltekit.body%` inside a `<div>`, not directly in `<body>`: extensions inject nodes there that hydration then destroys.
- Non-`+` files in a route folder are ignored, so colocate components there. `+page.test.ts` and `+page.stories.svelte` are ignored too.

## Route files

| File                | Runs on                 | Exports                                                                         |
| ------------------- | ----------------------- | ------------------------------------------------------------------------------- |
| `+page.svelte`      | server (SSR) and client | page component; props `data`, `form`, `params`                                  |
| `+page.ts`          | server (SSR) and client | universal `load`, page options                                                  |
| `+page.server.ts`   | server only             | server `load`, `actions`, page options                                          |
| `+layout.svelte`    | server (SSR) and client | must `{@render children()}`                                                     |
| `+layout.ts`        | server (SSR) and client | universal `load`, default page options for children                             |
| `+layout.server.ts` | server only             | server `load`, page options                                                     |
| `+server.ts`        | server only             | `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, `HEAD`, `QUERY`, `fallback` |
| `+error.svelte`     | server (SSR) and client | error page for its subtree                                                      |
- `+layout` and `+error` apply to their own folder and every subfolder.
- Type props with `let { data, params }: PageProps = $props()` from `./$types` (`PageProps` since 2.16, `params` prop since 2.24).

```ts
// src/routes/api/random/+server.ts
import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = ({ url }) => {
	const max = Number(url.searchParams.get("max") ?? "1");
	if (isNaN(max)) error(400, "max must be a number");
	return Response.json(Math.random() * max);
};

export const fallback: RequestHandler = ({ request }) =>
	new Response(`Caught ${request.method}`);
```

- `HEAD` uses `GET` when exported, ahead of `fallback`.
- Layouts never apply to `+server`. Run shared logic in `handle`.
- `json()` and `text()` are deprecated in v3: use `Response.json()` and `new Response()`.
- `+server` next to `+page`: `PUT`/`PATCH`/`DELETE`/`OPTIONS`/`QUERY` always go to `+server`; `GET`/`POST`/`HEAD` go to the page when `accept` prefers `text/html`. `GET` responses get `Vary: Accept`.
- Vite adds CORS headers to `OPTIONS` in dev only. Set them yourself for production.

## Layouts, groups and resets

Layout hierarchy mirrors folders by default. A `(group)` folder adds a layout without adding a URL segment.

```
src/routes/
  (app)/dashboard/  (app)/item/  (app)/+layout.svelte
  (marketing)/about/  (marketing)/+layout.svelte
  admin/            # inherits only the root layout
  +layout.svelte
```

Reset to an ancestor layout with `@` and the segment name (empty for root):

- `+page@[id].svelte`: inherits `(app)/item/[id]/+layout.svelte`
- `+page@(app).svelte`: inherits `(app)/+layout.svelte`
- `+page@.svelte`: inherits the root layout only
- `+layout@.svelte`: resets the hierarchy for everything below it

For a single outlier, prefer composition (a shared layout component or reusable `load`) over another group.

## Parameters and matchers

- `[slug]`: required. `[[lang]]`: optional. `[...rest]`: any depth, including zero segments.
- An optional param cannot follow a rest param.
- `/a/[...rest]/z` also matches `/a/z`. Validate rest values.
- Unmatched URLs never reach a nested `+error.svelte`. For a custom subtree 404, add a catch-all:

```ts
// src/routes/docs/[...path]/+page.ts
import { error } from "@sveltejs/kit";
export function load() {
	error(404, "Not Found");
}
```

Matchers live in `src/params.ts`. Return the value to match, `undefined` to reject. A Standard Schema also works.

```ts
// src/params.ts
import { defineParams } from "@sveltejs/kit/params";
import * as v from "valibot";

export const params = defineParams({
	fruit: (param) =>
		param === "apple" || param === "orange" ? param : undefined,
	number: v.pipe(v.string(), v.toNumber()),
});
```

- Use as `src/routes/items/[id=number]`. `params.id` is then typed `number`.
- Output must extend `string`, `number`, `boolean` or `bigint`, and must round-trip through `toString()` so `resolve('/items/[id=number]', { id: 1 })` works.
- Matchers run on server and client.
- v2: one file per matcher in `src/params/`, `export const match = (param) => boolean`, no transformation.

Route priority: fewer params beats more; `[x=matcher]` beats `[x]`; trailing `[[opt]]`/`[...rest]` rank lowest; ties alphabetical.

Characters illegal in filenames or URLs use hex escapes: `[x+3a]` is `:`, `[x+2e]well-known` avoids a leading dot.

## Page options

Export from `+page(.server).ts` or `+layout(.server).ts`. Layout values are defaults; children override. Root layout sets app-wide defaults.

```ts
// src/routes/+layout.ts
export const prerender = true; // true | false | 'auto'
export const ssr = true;
export const csr = true;
export const trailingSlash = "never"; // 'never' (default) | 'always' | 'ignore'
```

- `prerender`: rule is "any two users get the same content". Pages with form actions cannot be prerendered. `url.searchParams` is forbidden while prerendering. `building` from `$app/env` is `true`.
- `'auto'` prerenders but keeps the route in the server manifest (e.g. popular posts static, long tail SSR).
- `prerender` also applies to `+server` files. They ignore layouts but inherit from pages that fetch them. Give server routes an extension (`foo.json/+server.ts`) to avoid file/dir clashes.
- "Marked as prerenderable, but were not prerendered": the crawler never reached it. Add `entries`, link to it, or use `'auto'`.
- `ssr = false` renders an empty shell. In the root layout it makes an SPA.
- `csr = false` ships no JS: no `<script>`, no `use:enhance`, full-page navigation, no HMR. `export const csr = dev;` keeps HMR in development.
- Both `false`: nothing renders.
- `config`: adapter-specific object, merged with parents at the top level only.
- Non-literal option values make SvelteKit import the module on the server to evaluate them, so keep browser-only imports in `.svelte` files.

```ts
// src/routes/blog/[slug]/+page.server.ts
import type { EntryGenerator } from "./$types";

export const prerender = true;
export const entries: EntryGenerator = async () => [{ slug: "hello-world" }];
```

## Hooks

`hooks.server.ts`, `hooks.client.ts`, `hooks.ts`. Module code runs at startup. Types come from `@sveltejs/kit/hooks` (v2: `@sveltejs/kit`).

```ts
// src/hooks.server.ts
import type { Handle, HandleFetch, ServerInit } from "@sveltejs/kit/hooks";
import { sequence } from "@sveltejs/kit/hooks";
import * as db from "#lib/server/db.js";

export const init: ServerInit = async () => {
	await db.connect();
};

const auth: Handle = async ({ event, resolve }) => {
	event.locals.user = await db.getUser(event.cookies.get("sessionid"));
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace("%lang%", "en"),
		filterSerializedResponseHeaders: (name) => name.startsWith("x-"),
		preload: ({ type }) => type === "js" || type === "css",
	});
};

export const handle = sequence(auth);

export const handleFetch: HandleFetch = ({ request, fetch }) => {
	if (request.url.startsWith("https://api.example.com/")) {
		request = new Request(
			request.url.replace("https://api.example.com/", "http://localhost:9999/"),
			request,
		);
	}
	return fetch(request);
};
```

- `handle` runs for every server request and during prerendering, not for static assets or already-prerendered pages. `resolve()` never throws. Throwing elsewhere in `handle` is fatal (JSON or `src/error.html`).
- Response headers may be immutable (e.g. `Response.redirect()`): clone before setting.
- `handleFetch` wraps `event.fetch` on the server. Sibling-subdomain cookies (`www.` to `api.`) are not forwarded automatically: copy the `cookie` header here.
- Client `init` delays hydration. Keep it short.

```ts
// src/hooks.ts
import type { Reroute, Transport } from "@sveltejs/kit/hooks";
import { Vector } from "#lib/math.js";

const translated: Record<string, string> = { "/de/ueber-uns": "/de/about" };

export const reroute: Reroute = ({ url }) => translated[url.pathname];

export const transport: Transport = {
	Vector: {
		encode: (value) => value instanceof Vector && [value.x, value.y],
		decode: ([x, y]) => new Vector(x, y),
	},
};
```

- `reroute` changes which route handles a URL, not the address bar or `event.url`. It must be pure: the client caches it per URL. Async since 2.18; use the provided `fetch`.
- `transport` lets custom classes cross the server/client boundary from `load` and form actions.

## Errors

```ts
import { error } from "@sveltejs/kit";
error(404, "Not found", { code: "NOT_FOUND" }); // throws; v2: error(404, { message, code })
```

`handleError` (server and client hooks) sees every error with a `kind`:

| kind           | Source                                  | Default exposed                                              |
| -------------- | --------------------------------------- | ------------------------------------------------------------ |
| `'app'`        | your `error(...)`                       | the body as given                                            |
| `'framework'`  | 404, 405, 413 etc.                      | `{ status, message }`                                        |
| `'validation'` | remote function schema failure (server) | `{ status: 400, message: 'Bad Request' }`, `issues` separate |
| `'unknown'`    | anything else thrown                    | `{ status: 500, message: 'Internal Error' }`                 |

```ts
// src/hooks.server.ts
import type { HandleServerError } from "@sveltejs/kit/hooks";

export const handleError: HandleServerError = ({ kind, error, event }) => {
	if (kind === "app" || kind === "framework") return error;
	const errorId = crypto.randomUUID();
	console.error(errorId, error, event.url.pathname);
	return { message: "Something went wrong", errorId }; // may also return `status`
};
```

```ts
// src/app.d.ts: status and message are always present
declare global {
	namespace App {
		interface Error {
			errorId?: string;
		}
	}
}
export {};
```

- `handleError` must never throw. Don't log routine 404s.
- v2 differences: expected `error()` calls skipped `handleError`; no `status` override; `handleValidationError` existed.
- `+error.svelte` lookup walks up from the failing route. An error in a layout `load` uses the `+error.svelte` above that layout. Root layout errors and failures of the root `+error.svelte` use `src/error.html` (`%sveltekit.status%`, `%sveltekit.error.message%`).
- Errors in `handle` or `+server` never render `+error.svelte`.
- Rendering errors also go through `handleError`, then the nearest boundary; each `+error.svelte` is one. An async client `handleError` needs `compilerOptions.experimental.async`.
- `+error.svelte` receives an `error` prop; `page.status` and `page.error` from `$app/state` work too.

## svelte:boundary

Walls off part of a page for render/effect errors and initial async loading.

```svelte
<svelte:boundary onerror={(e) => report(e)}>
  <Chart />

  {#snippet pending()}<p>Loading...</p>{/snippet}

  {#snippet failed(error: App.Error, reset)}
    <p>{error.message}</p>
    <button onclick={reset}>Retry</button>
  {/snippet}
</svelte:boundary>
```

- Not caught: errors in event handlers, `setTimeout` or other async work outside rendering.
- In SvelteKit the `failed` error has passed through `handleError`, so it is an `App.Error`.
- `pending` shows only until the first `await`s resolve. For later updates use `$effect.pending()`. During SSR a boundary with `pending` renders only that snippet.
- An error inside `onerror` (or a rethrow) goes to the parent boundary.

## Server-only modules

- `$app/env/private` and `$app/server` can only be imported by server code.
- Mark your own module server-only with a `.server.` filename (`db.server.ts`) or a `server/` directory anywhere except `src/routes` and `static` (v2: only `src/lib/server`).
- Any client import chain that reaches one fails the build, even if only a harmless export is used. Use `import type` for types.
- `node_modules` is exempt. Package authors add `import '$app/server'` at the top of a server-only file.
- Detection is off when `process.env.TEST === 'true'` (Vitest).

## Shallow routing

History entries without navigation, e.g. a modal closed by the back gesture.

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
</script>

<button onclick={() => goto('', { shallow: true, state: { showModal: true } })}>open</button>

{#if page.state.showModal}
  <Modal close={() => history.back()} />
{/if}
```

- v2: `pushState(url, state)` / `replaceState(url, state)`, deprecated in v3.
- Type `page.state` via `App.PageState`.
- Options: `replace: true`, `persistState: true` (restore after reload), `reset: true` (drop kept scroll/focus).
- `page.shallow` is `{ url, params, route }` of the visible URL; `page.url` stays the rendered page. Navigation hooks fire with `navigation.shallow === true`.
- To show another route's page in a modal: `const r = await preloadData(href)`, then if `r.type === 'loaded' && r.status === 200` call `goto(href, { shallow: true, state: { selected: r.data } })` and render `<PhotoPage data={page.state.selected} />`; otherwise `goto(href)`.
- Caveats: needs JS; `page.state` is `{}` during SSR (flicker risk); a reload lands on `page.shallow.url`.

## SSR and hydration pitfalls

- Components render on the server first. Never touch `window`/`document` at the top level of `<script>`. Guard with `browser` from `$app/env` (v2: `$app/environment`) or move into `onMount`.

```ts
import { onMount } from "svelte";
onMount(async () => {
	const { init } = await import("some-browser-only-library");
	init();
});
```

- A side-effect-free browser library can be imported statically and called in `onMount`; it is tree-shaken from the server build.
- `ssr = false` is the escape hatch for a page that cannot render on the server. It costs SEO and first paint.
- Don't call `fetch` in a component during SSR: it runs again on hydration. Fetch in `load` (responses are inlined and reused) or in `onMount`.
- Context state changed by a child during SSR does not re-render the already-rendered parent, but does on the client. Pass state down, not up, to avoid flashes on hydration.
- Navigating between URLs of one route reuses components. Derive from `data` with `$derived`, not plain `const`. Force a remount with `{#key page.url.pathname}`.
- `page.state` is empty during SSR: UI that depends on it flickers on hydration.

Source: https://svelte.dev/docs/kit/project-structure, https://svelte.dev/docs/kit/routing, https://svelte.dev/docs/kit/advanced-routing, https://svelte.dev/docs/kit/page-options, https://svelte.dev/docs/kit/hooks, https://svelte.dev/docs/kit/errors, https://svelte.dev/docs/kit/server-only-modules, https://svelte.dev/docs/kit/shallow-routing, https://svelte.dev/docs/kit/state-management, https://svelte.dev/docs/kit/faq, https://svelte.dev/docs/kit/migrating-to-sveltekit-3, https://svelte.dev/docs/svelte/svelte-boundary
