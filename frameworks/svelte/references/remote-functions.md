# Remote functions

Type-safe server calls that can be invoked from anywhere in the app but always run on the server. Experimental, available since SvelteKit 2.27; the API may change without notice.

## Contents

- Enabling
- Remote modules
- query
- query.batch
- query.live
- form
- command
- Single-flight mutations
- prerender
- Validation
- getRequestEvent and redirects
- Remote functions vs load and actions

## Enabling

Both flags are required, set on the SvelteKit Vite plugin (SvelteKit 2 put these under `kit.experimental` and `compilerOptions` in `svelte.config.js`):

```js
// vite.config.js
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		sveltekit({
			experimental: { remoteFunctions: true },
			compilerOptions: { experimental: { async: true } },
		}),
	],
});
```

## Remote modules

- A remote module is any file with a `remote` segment in its name: `remote.ts`, `data.remote.ts`.
- Place it anywhere in `src` except a `server/` directory (server-only modules can't reach the client).
- Exports are `query`, `query.batch`, `query.live`, `form`, `command` or `prerender` functions, all imported from `$app/server`.
- On the client each export becomes a `fetch` wrapper around a generated endpoint. Treat every one as a public HTTP endpoint.
- You cannot export a schema from a remote module. Share it from another module or a `<script module>` block.
- Libraries with `@sveltejs/kit` in `peerDependencies` can ship remote modules.
- Remote function types (`RemoteQuery`, `RemoteForm`, `RemoteCommand`...) live in `$app/server` (v2: `@sveltejs/kit`).

## query

Reads dynamic data.

```ts
// src/routes/blog/data.remote.ts
import * as v from "valibot";
import { error } from "@sveltejs/kit";
import { query } from "$app/server";
import * as db from "#lib/server/db.js";

export const getPosts = query(async () => db.sql`SELECT title, slug FROM post`);

export const getPost = query(v.string(), async (slug) => {
	const [post] = await db.sql`SELECT * FROM post WHERE slug = ${slug}`;
	if (!post) error(404, "Not found");
	return post;
});
```

```svelte
<script lang="ts">
  import { getPost } from '../data.remote';
  let { params } = $props();
  const post = $derived(await getPost(params.slug));
</script>

<h1>{post.title}</h1>
<button onclick={() => getPost(params.slug).refresh()}>Reload</button>
```

- While pending, and on error, the nearest `<svelte:boundary>` handles it.
- Without `await`: `const q = getPosts()` exposes `q.loading`, `q.error`, `q.current`.
- Argument and return value go through devalue (`Date`, `Map`, plus `transport` hook types).
- Object, Map and Set arguments are key-sorted for caching: `{ a, b }` and `{ b, a }` share a cache entry. Use an array if order matters.
- Calls with the same argument dedupe: request-scoped on the server, shared instance on the client (`getPosts() === getPosts()`), released once nothing uses it.
- `refresh()` refetches from the server.
- Queries don't work on fully prerendered pages (`prerender = true` on the page or a parent, `adapter-static`). Use `prerender` functions there.

## query.batch

Groups calls made in the same macrotask into one server call (fixes n+1).

```ts
export const getWeather = query.batch(v.string(), async (cityIds) => {
	const rows =
		await db.sql`SELECT * FROM weather WHERE city_id = ANY(${cityIds})`;
	const byId = new Map(rows.map((w) => [w.city_id, w]));
	return (cityId, index) => byId.get(cityId);
});
```

```svelte
{#each cities as city}
  <CityWeather weather={await getWeather(city.id)} />
{/each}
```

## query.live

Real-time data from an async iterable.

```ts
export const getTime = query.live(async function* () {
	while (true) {
		yield new Date();
		await new Promise((f) => setTimeout(f, 1000));
	}
});
```

- SSR takes the first value, closes the iterator, and reuses that value on hydration.
- The client stays connected while in use; instances share one connection. `connected` and `reconnect()` are exposed; reconnection uses exponential backoff.
- No `refresh()`. Instances are async-iterable (`for await`), keeping only the latest unread value.
- Never cache live responses in a service worker. Skip responses whose `Cache-Control` includes `no-store`.

## form

Writes data via a `<form>` that works without JS and is enhanced with JS.

```ts
// data.remote.ts
import * as v from "valibot";
import { error, invalid, redirect } from "@sveltejs/kit";
import { form } from "$app/server";
import * as auth from "#lib/server/auth.js";

export const createPost = form(
	v.object({
		title: v.pipe(v.string(), v.nonEmpty()),
		content: v.pipe(v.string(), v.nonEmpty()),
		published: v.optional(v.boolean(), false), // unchecked boxes are absent
	}),
	async ({ title, content }, issue) => {
		if (!(await auth.getUser())) error(401, "Unauthorized");
		const slug = title.toLowerCase().replace(/ /g, "-");
		if (await db.slugExists(slug)) invalid(issue.title("Title already used"));
		await db.insertPost(slug, title, content);
		redirect(303, `/blog/${slug}`);
	},
);
```

```svelte
<script lang="ts">
  import { createPost } from '../data.remote';
  const { title, content, published } = createPost.fields;
</script>

<form {...createPost} oninput={() => createPost.validate()}>
  <input {...title.as('text')} />
  {#each title.issues() ?? [] as issue}<p>{issue.message}</p>{/each}
  <textarea {...content.as('text')}></textarea>
  <label><input {...published.as('checkbox')} /> Publish</label>
  <button disabled={!!createPost.pending}>Publish</button>
</form>

{#if createPost.result?.success}<p>Saved</p>{/if}
```

- Spreading sets `method`, `action` and an enhancing attachment.
- `.as(type, value?)` sets `name`, `type`, `value` and `aria-invalid`. The second argument sets the rendered and reset value (edit forms, `for()` instances); required for `radio`, `submit`, `hidden`. For radio/checkbox options pass the option, then checked state: `.as('checkbox', tag, tags.includes(tag))`.
- Fields nest (`info.height`, `attributes[0]`) and hold strings, numbers, booleans or `File`s. Add `enctype="multipart/form-data"` for files. Numbers and booleans are coerced before validation.
- Empty `select multiple` and checkbox groups submit nothing: default them, e.g. `v.optional(v.array(...), [])`.
- Fields prefixed `_` (`_password`) are never echoed back after a failed non-JS submission.
- Issues: `field.issues()` and `fields.allIssues()` return `undefined` when valid or not yet validated. String arguments to `invalid(...)` appear only in `allIssues()`.
- `validate()` skips untouched controls; `validate({ includeUntouched: true })` checks all.
- `createPost.preflight(schema)` validates on the client and blocks the request when invalid.
- `fields.title.value()` / `fields.value()` read current values; `fields.set({...})` or `fields.title.set(v)` write them.
- `result` holds the handler's return value until resubmit, navigation or reload. Thrown errors render the nearest `+error.svelte`.

```svelte
<form {...createPost.enhance(async (form) => {
  try {
    if (await form.submit()) {
      form.element.reset(); // enhance disables auto-reset
      showToast('Published');
    } else showToast('Invalid data');
  } catch {
    showToast('Something went wrong');
  }
})}>
```

- Repeated forms: `const modify = modifyTodo.for(todo.id)` per row for isolated state.
- Multiple submit buttons: add a schema field and use `fields.action.as('submit', 'login')` on each button.

## command

Writes data from anywhere (event handlers), not tied to a form.

```ts
export const addLike = command(v.string(), async (id) => {
	await db.sql`UPDATE item SET likes = likes + 1 WHERE id = ${id}`;
	void getLikes(id).refresh(); // single-flight update
});
```

```svelte
<button onclick={async () => {
  try { await addLike(item.id); } catch { showToast('Failed'); }
}}>like</button>
<p>{await getLikes(item.id)}</p>
```

- Prefer `form`: it degrades without JS.
- Commands cannot be called during render.
- No `redirect()` inside a command. Return `{ redirect: location }` and navigate on the client if unavoidable.

## Single-flight mutations

By default a successful `form` invalidates every query and `load`; a `command` refreshes nothing. Refresh only what changed, in the same response:

```ts
export const updatePost = form(
	v.object({ id: v.string() /* ... */ }),
	async (post) => {
		const saved = await externalApi.update(post);
		getPost(post.id).set(saved); // set directly, no refetch
		void getPosts().refresh(); // promise is awaited by the framework
	},
);
```

- Any `refresh()`, `set()` or `reconnect()` in a `form` handler replaces the invalidate-everything default.
- `liveQuery(arg).reconnect()` restarts matching live queries in the same response.

The server cannot know which argument variants a client renders. The client requests them; the server must accept them:

```ts
// client: inside createPost.enhance(async (form) => { ... })
await form.submit().updates(
	getPosts, // all active instances
	getPosts({ filter: "author:santa" }).withOverride((p) => [draft, ...p]), // optimistic
);

// client: commands chain the same way
await addLike(id).updates(getLikes(id));
```

```ts
// server
import { requested } from "$app/server";

for (const { arg, query, ignore } of requested(getPosts, 10)) {
	if (arg.filter.startsWith("author:")) void query.refresh();
	else ignore();
}
// shorthands
await requested(getPosts, 10).refreshAll();
await requested(getPosts, 10).ignoreAll();
```

- `limit` is required: the client controls the list, so it is a DoS vector. `Infinity` works but is discouraged.
- Every requested entry must be refreshed, set, reconnected or ignored, or that query errors on the client. Entries past `limit` fail.
- `arg` is the post-validation value; `query` is already bound to the client's cache key.

## prerender

Like `query`, but run at build time. For data that changes at most once per deploy, even on dynamic pages.

```ts
export const getPost = prerender(
	v.string(),
	async (slug) => {
		/* ... */
	},
	{ inputs: () => ["first-post", "second-post"], dynamic: true },
);
```

- Calls found while crawling prerendered pages are saved automatically; `inputs` adds more.
- Without `dynamic: true` the function is not in the server bundle, so unprerendered arguments fail.
- The browser stores results in the Cache API until the user first visits a new deployment.

## Validation

- Pass any Standard Schema (Zod, Valibot...) as the first argument to `query`, `form`, `command` and `prerender`.
- Schema failures return a generic 400 and reach the server `handleError` with `kind: 'validation'` and `issues`:

```ts
// src/hooks.server.ts
import type { HandleServerError } from "@sveltejs/kit/hooks";

export const handleError: HandleServerError = ({ kind, error, issues }) => {
	if (kind === "validation") console.error(issues);
	return error; // safe; don't expose issues to attackers
};
```

- v2 used a separate `handleValidationError` hook.
- Opt out with `query('unchecked', async ({ id }: { id: string }) => ...)`. The type is then a guess: anyone can call the endpoint.

## getRequestEvent and redirects

```ts
import { getRequestEvent, query } from "$app/server";

const getUser = query(async () => {
	const { cookies } = getRequestEvent();
	return findUser(cookies.get("session_id")); // runs once per request
});
```

- No `setHeaders`. Cookies can be written only in `form` and `command`.
- In `query` (incl. `batch`, `live`), reading `route`, `params` or `url` throws: results are cached by argument and would go stale. Pass page values as arguments.
- In `form` and `command`, `route`/`params`/`url` describe the calling page and are client-controlled. Never authorize with them; derive trust from cookies or headers in `handle` and use `locals`.
- `redirect()` works in `query`, `form` and `prerender`, not `command`.

## Remote functions vs load and actions

- Form actions are stable and feature-complete; new development is focused on remote `form`, which adds type safety and single-flight mutations. Choose it for new code if experimental status is acceptable.
- Remote functions need both experimental flags; `load` and actions need none.
- Use `load` when you need `setHeaders`, page-level `route`/`params`/`url` on the server, or streaming promises.
- `query` cannot run on fully prerendered pages; use `prerender` functions or `load`.
- `query` dedupes across components and refreshes per argument, where `load` reruns as a whole on `invalidate`. `refreshAll()` reruns both.

Source: https://svelte.dev/docs/kit/remote-functions, https://svelte.dev/docs/kit/form-actions, https://svelte.dev/docs/kit/hooks, https://svelte.dev/docs/kit/errors, https://svelte.dev/docs/kit/load, https://svelte.dev/docs/kit/migrating-to-sveltekit-3
