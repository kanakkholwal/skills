# SvelteKit data

Loading, invalidating, mutating and sharing data. Written against SvelteKit 3; `v2:` notes mark what differs in SvelteKit 2.

## Contents

- Universal vs server load
- Load inputs and fetch
- parent()
- Rerunning load
- Streaming promises
- Serialization
- Errors, redirects and auth
- Cookies and headers
- Form actions
- use:enhance
- $app/state
- Environment variables
- State management

## Universal vs server load

|             | `+page.ts` / `+layout.ts`                               | `+page.server.ts` / `+layout.server.ts`                        |
| ----------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| Runs        | server on first visit, again on hydration, then browser | always server                                                  |
| Extra input | `data` (the server load's return)                       | `cookies`, `locals`, `request`, `platform`, `getClientAddress` |
| Returns     | anything (classes, components)                          | devalue-serializable values, promises                          |
| Use for     | public external APIs, non-serializable values           | DB, filesystem, private env vars                               |
- Both present: server `load` runs first, its result arrives as `data` in the universal `load` (e.g. `({ data }) => ({ post: new Post(data.post) })`), and only the universal result reaches the page.
- With `ssr = false`, universal `load` only runs in the browser.
- Prerendered pages run `load` at build time.
- Layout data reaches child layouts and the page. Same keys: the last `load` wins.
- A parent layout reads child data through `page.data` (type it with `App.PageData`).

```ts
// src/routes/blog/[slug]/+page.server.ts
import { error } from "@sveltejs/kit";
import * as db from "#lib/server/db.js";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
	const post = await db.getPost(params.slug);
	if (!post) error(404, "Not found");
	return { post };
};
```

## Load inputs and fetch

Both kinds get `params`, `route` (`route.id` like `/a/[b]`), `url`, `fetch`, `setHeaders`, `parent`, `depends`, `untrack`.

- `url.hash` is unavailable (not sent to the server).
- Use the provided `fetch`, not the global: it forwards cookies, allows relative URLs on the server, calls `+server` handlers directly, and inlines responses into the HTML so hydration reuses them.
- Response headers are not inlined unless allowed by `filterSerializedResponseHeaders` in `handle`.

## parent()

```ts
// src/routes/abc/+page.ts
export const load: PageLoad = async ({ params, parent }) => {
	const data = await getData(params); // independent work first
	const { meta } = await parent(); // then wait for parents
	return { ...data, meta: { ...meta, ...data.meta } };
};
```

- Server `parent()` returns merged data from parent `+layout.server.ts` files.
- Universal `parent()` returns parent `+layout.ts` data. A missing `+layout.ts` passes its server data through.
- `await parent()` early creates a waterfall.

## Rerunning load

A `load` reruns when:

- a `params` property it read changed
- a `url` property it read changed (`request.url` is not tracked)
- a `url.searchParams.get/getAll/has` key it read changed (other search keys don't count)
- it called `await parent()` and a parent reran
- it depends on a URL or id passed to `invalidate()`
- `refreshAll()` was called

```ts
// +page.ts
export const load: PageLoad = async ({ fetch, depends, untrack, url }) => {
	depends("app:random"); // custom ids need a lowercase `scheme:` prefix
	if (untrack(() => url.pathname === "/")) return { home: true };
	const res = await fetch("https://api.example.com/random");
	return { n: await res.json() };
};
```

```ts
import { invalidate, refreshAll } from "$app/navigation";

invalidate("app:random");
invalidate("https://api.example.com/random");
invalidate((url) => url.href.includes("random"));
refreshAll(); // every load and active remote query
```

- Server `load` never depends on a fetched URL automatically (that would leak it). Use `depends`.
- Tracking stops when `load` returns. Read params in the body, not inside a returned promise.
- v3: `invalidateAll()` is deprecated in favour of `refreshAll()`, which keeps `page.state`. `invalidate()` during an in-flight navigation no longer aborts it.
- A rerun updates the `data` prop; the component is not recreated. Reset local state in `afterNavigate` or wrap in `{#key}`.

## Streaming promises

Server `load` can return un-awaited promises; they stream to the browser.

```ts
export const load: PageServerLoad = async ({ params }) => ({
	comments: loadComments(params.slug), // starts now, streams later
	post: await loadPost(params.slug),
});
```

```svelte
{#await data.comments}
  <p>Loading comments...</p>
{:then comments}
  {#each comments as c}<p>{c.content}</p>{/each}
{:catch e}
  <p>Failed: {e.message}</p>
{/await}
```

- Attach `.catch(() => {})` to non-`fetch` promises, or an early rejection crashes the server with an unhandled rejection.
- No `setHeaders` or `redirect` inside a streamed promise: headers are already sent.
- Requires JS. Buffered on platforms without streaming (AWS Lambda, Firebase) and behind buffering proxies.
- Promises from universal `load` are not streamed; they are recreated in the browser.
- All `load` functions of a page run in parallel; server results come back in one response on client navigation.

## Serialization

- Server `load`, form action results and remote functions use devalue: JSON plus `Date`, `Map`, `Set`, `RegExp`, `BigInt`, repeated and cyclic references.
- Custom classes need a `transport` hook in `src/hooks.ts`: `encode` returns a serializable value (or falsy for other types), `decode` rebuilds it.
- When posting to an action manually, parse with `deserialize` from `$app/forms`, not `JSON.parse`.

## Errors, redirects and auth

```ts
import { error, redirect } from "@sveltejs/kit";

export const load: LayoutServerLoad = ({ locals }) => {
	if (!locals.user) redirect(307, "/login");
	if (!locals.user.isAdmin) error(403, "not an admin");
};
```

- Both throw. Don't call `redirect()` inside `try`: the `catch` swallows it.
- Use `goto` from `$app/navigation` for client-side navigation outside `load`.
- Layout `load` does not rerun on every navigation, and runs in parallel with page `load`. A layout auth guard only protects children that `await parent()`.
- Prefer guarding in `handle` (many routes) or the page's own server `load`.
- `getRequestEvent()` from `$app/server` gives shared helpers the current event:

```ts
// src/lib/server/auth.ts
import { redirect } from "@sveltejs/kit";
import { getRequestEvent } from "$app/server";

export function requireLogin() {
	const { locals, url } = getRequestEvent();
	if (!locals.user)
		redirect(
			303,
			`/login?${new URLSearchParams({ redirectTo: url.pathname + url.search })}`,
		);
	return locals.user;
}
```

## Cookies and headers

```ts
export const load: PageServerLoad = async ({ cookies, fetch, setHeaders }) => {
	const session = cookies.get("sessionid");
	const res = await fetch("https://cms.example.com/products.json");
	setHeaders({
		"cache-control": res.headers.get("cache-control") ?? "no-store",
	});
	return { products: await res.json(), loggedIn: !!session };
};
```

- `cookies.set` defaults `httpOnly` and `secure`; v3 `path` defaults to `'/'`. Cookie names must be ASCII (cookie v2).
- `fetch` forwards cookies only to the app's host or its subdomains. Other hosts need `handleFetch`.
- Each header may be set once across all `load` functions. `set-cookie` goes through `cookies`, never `setHeaders`.
- `setHeaders` does nothing in the browser.

## Form actions

```ts
// src/routes/login/+page.server.ts
import { fail, redirect } from "@sveltejs/kit";
import * as db from "#lib/server/db.js";
import type { Actions } from "./$types";

export const actions = {
	login: async ({ cookies, request, url, locals }) => {
		const data = await request.formData();
		const email = data.get("email");
		if (!email) return fail(400, { email, missing: true });

		const user = await db.login(email, data.get("password"));
		if (!user) return fail(400, { email, incorrect: true }); // never echo the password

		cookies.set("sessionid", await db.createSession(user), { path: "/" });
		locals.user = user; // handle already ran; keep locals in sync
		if (url.searchParams.has("redirectTo"))
			redirect(303, url.searchParams.get("redirectTo")!);
		return { success: true };
	},
	register: async () => {
		/* ... */
	},
} satisfies Actions;
```

```svelte
<script lang="ts">
  import type { PageProps } from './$types';
  let { form }: PageProps = $props();
</script>

<form method="POST" action="?/login">
  {#if form?.missing}<p>Email required</p>{/if}
  <input name="email" type="email" value={form?.email ?? ''} />
  <input name="password" type="password" />
  <button>Log in</button>
  <button formaction="?/register">Register</button>
</form>
```

- One `default` action, or named actions (`?/name`); never both on one page.
- Post from another page with `action="/login?/register"`.
- Return value becomes `form` (and `page.form`); the `fail` status becomes `page.status`. Enhanced responses use the `fail` status, 200 for data, 204 for `undefined`.
- After an action the page's `load` functions rerun. `handle` does not.
- `GET` forms (no `method`) act like links: they run `load`, never an action.
- Actions are stable, but new work targets the experimental remote `form` (see `remote-functions.md`).

## use:enhance

```svelte
<script lang="ts">
  import { enhance } from '$app/forms';
  let submitting = $state(false);
</script>

<form
  method="POST"
  action="?/login"
  use:enhance={() => {
    submitting = true;
    return async ({ result, update }) => {
      submitting = false;
      await update({ reset: false }); // default behaviour, keep inputs
    };
  }}
>
```

- Only for `method="POST"` forms targeting `+page.server` actions.
- Default (no callback): updates `form`/`page.form`/`page.status`, resets the form, `refreshAll()` on success, `goto` on redirect, nearest `+error` on error, restores focus.
- v3: a cross-page `action` navigates to that page, like a native submit. `update({ navigate: false })` keeps the v2 stay-in-place behaviour.
- `update` options: `reset`, `refreshAll` (default true on success; `invalidateAll` is a deprecated alias), `navigate`.
- `applyAction(result)` applies the result to the current page only: no navigation, no data refresh.
- Relative `action="?/delete"` drops the current query string. Write `action="?page=2&/delete"` to keep it.
- A `+server` file next to the page captures plain `fetch` POSTs; send header `x-sveltekit-action: true` to hit the action.

## $app/state

```svelte
<script lang="ts">
  import { page, navigating, updated } from '$app/state';
  const id = $derived(page.params.id);
</script>

{#if navigating.to}<Spinner />{/if}
{#if updated.current}<button onclick={() => location.reload()}>New version</button>{/if}
```

- `page`: `url`, `params`, `route.id`, `status`, `error`, `data`, `form`, `state`, `shallow`. Reactive only with runes.
- v3: `page.url` is readonly. Copy before editing: `const u = new URL(page.url.href)`.
- `navigating`: `from`, `to`, `type`, `willUnload`, `delta` (popstate only), `complete`; all `null` when idle and during SSR.
- `updated.current` turns `true` when a new deploy is detected (server responses, tab focus, `version.pollInterval`, default one hour in v3). `updated.check()` forces a check.
- `$app/stores` (`$page` etc.) is removed in v3.

## Environment variables

v3 declares variables in `src/env.ts`. `.env` and `.env.local` are loaded in dev and at build.

```ts
// src/env.ts
import { defineEnvVars } from "@sveltejs/kit/env";
import { building } from "$app/env";
import * as v from "valibot";

export const variables = defineEnvVars({
	API_KEY: {}, // private, dynamic
	GA_ID: { public: true, schema: v.pipe(v.string(), v.regex(/G-[A-Z0-9]+/)) },
	SHOW_DEBUG: { public: true, static: true }, // inlined at build
	DB_URL: {
		schema: building ? v.optional(v.string()) : v.string(),
		description: "Postgres URL",
	},
});
```

```ts
import { API_KEY } from "$app/env/private"; // server-only
import { GA_ID } from "$app/env/public";
```

- Private is the default; `public: true` exposes it. `static: true` inlines the value and enables dead-code elimination.
- `schema` takes a Standard Schema or a function that returns the value or throws. Invalid values stop the app from starting or building.
- Public variables can appear in `app.html` as `%sveltekit.env.GA_ID%`.
- v2 modules `$env/static/private`, `$env/static/public`, `$env/dynamic/private`, `$env/dynamic/public` are deprecated in v3 and removed in v4. Map them to `static`/`public` flags.
- `$app/env` (v2: `$app/environment`) exports `browser`, `dev`, `building`, `version`.

## State management

- No module-level mutable state on the server. It is shared by every user:

```ts
let user; // NEVER: Bob sees Alice's data
```

- `load` must be pure. Return data instead of writing to a global store.
- Share per-request state through context, passing a getter to keep it reactive:

```svelte
<!-- +layout.svelte -->
<script lang="ts">
  import { setContext } from 'svelte';
  let { data, children } = $props();
  setContext('user', () => data.user);
</script>
```

- Read it with `const user = getContext<() => User>('user')`, then `user().name`.

- Without SSR (and never planning it) a shared module is safe.
- Pages and layouts are reused across navigation. Derive from `data` with `$derived`; plain `const` goes stale.
- Filters, sort order and anything that should survive reload or affect SSR belong in the URL: `goto('?sort=price')`, read via `url` in `load` or `page.url.searchParams`.
- Ephemeral UI state that should survive back/forward goes in a snapshot:

```svelte
<script lang="ts">
  import { snapshot } from '$app/navigation';
  let comment = $state('');
  snapshot({ id: 'comment', capture: () => comment, restore: (v) => (comment = v) });
</script>
```

- Snapshots are devalue-serialized to `sessionStorage`. Keep them small. Optional `reset` runs when nothing is restored.
- v2: `export const snapshot = { capture, restore }` from `+page.svelte`/`+layout.svelte` only (deprecated in v3).

Source: https://svelte.dev/docs/kit/load, https://svelte.dev/docs/kit/form-actions, https://svelte.dev/docs/kit/state-management, https://svelte.dev/docs/kit/environment-variables, https://svelte.dev/docs/kit/snapshots, https://svelte.dev/docs/kit/hooks, https://svelte.dev/docs/kit/$app-state, https://svelte.dev/docs/kit/$app-env, https://svelte.dev/docs/kit/migrating-to-sveltekit-3
