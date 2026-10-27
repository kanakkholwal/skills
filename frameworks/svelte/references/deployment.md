# SvelteKit deployment

Adapters, build and preview, per-platform gotchas, performance and tracing. Written against SvelteKit 3; `v2:` notes mark what differs in SvelteKit 2.

## Contents

- Build and preview
- Choosing an adapter
- adapter-auto
- adapter-node
- adapter-bun
- adapter-static and SPA mode
- adapter-cloudflare
- adapter-cloudflare-workers (deprecated)
- adapter-netlify
- adapter-vercel
- Performance
- Observability

## Build and preview

`vite build` runs two stages: Vite builds server, client and service worker (prerendering happens here), then the adapter shapes the output for the target.

```js
// +page.server.js: build imports this file for analysis, so guard side effects
import { building } from "$app/env";
import { initialiseDatabase } from "#lib/server/database.js";

if (!building) initialiseDatabase();
```

- `vite preview` serves the production build in Node. Adapter-specific behaviour (such as the `platform` object) is not applied, so it is not a faithful copy of production.
- Test performance in preview, never in `dev`.
- `v2:` `building` came from `$app/environment`; `#lib` was `$lib`.

## Choosing an adapter

Config lives in the `sveltekit()` Vite plugin. `npx sv add sveltekit-adapter` installs one and wires it up.

```js
// vite.config.js
import adapter from "@sveltejs/adapter-node";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [sveltekit({ adapter: adapter() })],
});
```

`v2:` the adapter went in `svelte.config.js` under `kit.adapter`.

| Target                                           | Package                        |
| ------------------------------------------------ | ------------------------------ |
| Unknown yet / zero config                        | `@sveltejs/adapter-auto`       |
| Node server (Railway, Cloud Run, Render, Docker) | `@sveltejs/adapter-node`       |
| Bun server                                       | `@sveltejs/adapter-bun`        |
| Fully static / SPA / GitHub Pages                | `@sveltejs/adapter-static`     |
| Cloudflare Workers or Pages                      | `@sveltejs/adapter-cloudflare` |
| Netlify                                          | `@sveltejs/adapter-netlify`    |
| Vercel                                           | `@sveltejs/adapter-vercel`     |

Adapters may expose platform data as `event.platform` in hooks and server routes.

## adapter-auto

- Default in `npx sv create`. Detects Cloudflare, Netlify, Vercel, Azure Static Web Apps, AWS via SST, Google Cloud Run and Render at deploy time.
- Takes no options. To pass options (for example `edge: true`) install the real adapter.
- Once the target is settled, install that adapter as a devDependency: it lands in the lockfile and CI installs faster.

## adapter-node

```sh
npm run build
npm ci --omit dev     # next to a copy of package.json + lockfile
node build
```

- Ship the output dir, `package.json` and production `node_modules`. devDependencies are bundled (Rolldown); `dependencies` stay external.
- Options: `out` (`'build'`), `precompress` (`true`, emits `.br`/`.gz`), `envPrefix` (`''`).
- `.env` is not loaded in production. Use `node --env-file=.env build`.

| Env var                                         | Purpose                                                             |
| ----------------------------------------------- | ------------------------------------------------------------------- |
| `PORT`, `HOST`                                  | Listener, default `0.0.0.0:3000`                                    |
| `SOCKET_PATH`                                   | Unix socket; overrides `HOST`/`PORT`                                |
| `PROTOCOL_HEADER`, `HOST_HEADER`, `PORT_HEADER` | Rebuild origin behind a trusted proxy (e.g. `x-forwarded-proto`)    |
| `ADDRESS_HEADER`, `XFF_DEPTH`                   | Real client IP for `getClientAddress()`; depth reads from the right |
| `BODY_SIZE_LIMIT`                               | Default `512K`; `Infinity` disables                                 |
| `SHUTDOWN_TIMEOUT`                              | Seconds before forced close, default `30`                           |
| `IDLE_TIMEOUT`                                  | systemd socket activation: sleep after N idle seconds               |
| `KEEP_ALIVE_TIMEOUT`, `HEADERS_TIMEOUT`         | Node server timeouts in seconds                                     |

Origin behind a proxy: set `paths.origin` instead of guessing headers. A wrong origin shows up as "Cross-site POST form submissions are forbidden".

```js
sveltekit({ adapter: adapter(), paths: { origin: process.env.ORIGIN } });
```

`v2:` this was the `ORIGIN` env var read by the adapter.

- Only set `*_HEADER` vars behind a proxy you control; clients can spoof them.
- Compression: prefer the reverse proxy. In a custom server use `@polka/compression`; `compression` breaks streamed responses.
- Graceful shutdown on `SIGTERM`/`SIGINT`; clean up in `process.on('sveltekit:shutdown', async (reason) => {...})`.
- Custom server: `import { handler } from './build/handler.js'` works with Express, Connect, Polka or `http.createServer`. Only the header vars and `BODY_SIZE_LIMIT` apply there; `PORT`, `HOST`, timeouts and socket vars are yours to implement.

## adapter-bun

Requires Bun 1.4+. The build itself must run in Bun.

```sh
bun run --bun build
bun ./build
```

- Options: `out`, `precompress` (off unless `true`), `envPrefix`, `serverOptions` (defaults for `Bun.serve`), `buildOptions`.
- `buildOptions: { compile: true }` produces a single executable at `<out>/server` with assets and runtime embedded.
- Bun loads `.env` itself. With `envPrefix`, an unknown prefixed var fails startup.
- Without `paths.origin` or `PROTOCOL_HEADER`, the scheme is assumed `https`. Set one when serving plain HTTP.
- `CONNECTION_IDLE_TIMEOUT` is per request (0-255 s); it is not node's `IDLE_TIMEOUT`.
- `platform.server` exposes the Bun server instance.
- Filenames containing a literal `*` are rejected (Bun treats it as a wildcard).

## adapter-static and SPA mode

Prerenders every page to static files.

```js
adapter({
	pages: "build",
	assets: "build",
	fallback: undefined,
	precompress: false,
	strict: true,
});
```

```js
// src/routes/+layout.js
export const prerender = true;
```

- `strict` fails the build unless every page and endpoint prerendered or a `fallback` is set.
- `ssr` must not be `false` on prerendered pages, or you ship an empty shell.
- If the host does not serve `/a.html` for `/a`, set `trailingSlash: 'always'` in the root layout.
- On Vercel, omit options and let the adapter configure itself.
- GitHub Pages: `fallback: '404.html'`, `paths.base` set to the repo name (`process.env.BASE_PATH` from `actions/configure-pages`), and an empty `static/.nojekyll` when not deploying through Actions.

SPA: set `fallback` and turn SSR off where you cannot prerender. Only valid with no `+page.server.js`, `+layout.server.js` or `+server.js`.

```js
// vite.config.js
adapter({ fallback: "200.html" }); // name depends on the host; avoid index.html

// src/routes/+layout.js
export const ssr = false;
```

- SPA mode costs extra round trips, hurts Core Web Vitals and SEO, and breaks without JS. Prerender as many pages as possible (re-enable `prerender = true` and `ssr = true` per route).
- The fallback page always uses absolute asset paths, whatever `paths.relative` says.
- Apache: rewrite unknown paths to `/200.html` in `static/.htaccess`.

## adapter-cloudflare

Covers Workers Static Assets and Pages. Use it directly (not via auto) to get `cloudflare:workers` emulated in dev, types, and options.

```js
adapter({
	config: undefined, // custom wrangler file name
	platformProxy: {
		configPath: undefined,
		environment: undefined,
		persist: undefined,
	},
	fallback: "plaintext", // or 'spa'
	routes: { include: ["/*"], exclude: ["<all>"] }, // Pages only
});
```

```jsonc
// wrangler.jsonc (Workers)
{
	"name": "my-app",
	"main": ".svelte-kit/cloudflare/_worker.js",
	"compatibility_flags": ["nodejs_als"],
	"compatibility_date": "<YYYY-MM-DD>",
	"assets": { "binding": "ASSETS", "directory": ".svelte-kit/cloudflare" }
}
```

Bindings (KV, D1, Durable Objects) come from `cloudflare:workers`, not `platform`:

```js
// +server.js
import { env } from "cloudflare:workers";

export async function POST() {
	const id = env.YOUR_DURABLE_OBJECT_NAMESPACE.idFromName("x");
}
```

- Prefer `$app/env/*` for plain environment variables; use `env` for bindings.
- Types: install `wrangler` and run `wrangler types`.
- Dev and preview emulate bindings from the wrangler file; tune with `platformProxy`. Durable Objects and Workflows (custom exported classes) are not supported.
- Test the build with Wrangler 4: `wrangler dev .svelte-kit/cloudflare/_worker.js` (Workers) or `wrangler pages dev .svelte-kit/cloudflare` (Pages).
- Deploy: `npx wrangler deploy`, or Pages Git integration with output dir `.svelte-kit/cloudflare`.
- Pages: a root `/functions` dir is ignored; write server endpoints instead. `routes` allows 100 include+exclude rules combined; collapse long `<prerendered>` lists with globs like `'/articles/*'`.
- `_headers` / `_redirects` only affect static assets. Set headers on dynamic responses in endpoints or `handle`.
- No `fs`. Use `read` from `$app/server` or prerender.
- Add `nodejs_compat` to `compatibility_flags` for Node APIs.
- Worker too large: move heavy libraries to client-only imports.

## adapter-cloudflare-workers (deprecated)

Targets Workers Sites. Migrate: swap the package for `@sveltejs/adapter-cloudflare`, remove `site` from the wrangler file, add `assets.directory` and `assets.binding`. It reads bindings from `platform.env` (typed via `App.Platform` in `src/app.d.ts`).

## adapter-netlify

```js
adapter({ edge: false, split: false, publish: "build" });
```

- `edge: true` deploys as a Netlify Edge Function; `split: true` makes one function per route.
- `event.platform?.context` holds Netlify function context (e.g. Identity).
- Netlify Forms must be prerendered HTML (and so must the success page).
- Extra functions: add a `[functions] directory` in `netlify.toml`.
- No `fs` on edge; on serverless it misses project files. Use `read` from `$app/server` or prerender.

## adapter-vercel

Per-route deployment config via `export const config` in `+page(.server).js`, `+layout(.server).js` or `+server.js`; layouts cascade.

```js
// +page.server.js
import { BYPASS_TOKEN } from "$app/env/private";

/** @type {import('@sveltejs/adapter-vercel').Config} */
export const config = {
	runtime: "nodejs24.x",
	split: true,
	isr: { expiration: 60, bypassToken: BYPASS_TOKEN, allowQuery: ["search"] },
};
```

- Keys: `runtime` (`'nodejs22.x'`, `'nodejs24.x'`, `bun1.x`), `regions` (default `["iad1"]`), `split`, `memory` (default 1024 MB), `maxDuration`, `isr`.
- ISR: `expiration` is required. Only use it where every visitor sees the same content. No effect on prerendered routes. `bypassToken` needs 32+ chars and is baked in at build.
- Adapter option `images` configures Vercel image optimisation.
- System env vars (e.g. `VERCEL_COMMIT_REF`) must be declared in `src/env.ts` before importing from `$app/env/private`; mark them `static: true`.
- Skew protection is a project setting; SvelteKit falls back to a hard reload on version skew. Watch `updated.current` from `$app/state` to prompt users.
- A root `api/` folder hijacks `/api/*` from SvelteKit.
- `waitUntil` and similar come from `@vercel/functions`.
- `node:fs` misses project files; use `read` from `$app/server` or prerender.

## Performance

SvelteKit already code-splits, preloads, hashes assets, inlines `fetch` data and prerenders. What is left to you:

- Diagnose with PageSpeed Insights, WebPageTest and browser devtools against a deployed or previewed build.
- Images: `@sveltejs/enhanced-img`. Video: compress, `preload="none"` below the fold, strip silent audio tracks.
- Fonts are not preloaded by default. Opt in per file in `handle`:

```js
// src/hooks.server.js
export async function handle({ event, resolve }) {
	return resolve(event, {
		preload: ({ type, filename }) =>
			type !== "font" ||
			filename ===
				"node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2",
	});
}
```

- Code size: stay on the latest Svelte; inspect with `rollup-plugin-visualizer`; set `build: { minify: false }` temporarily to read output.
- Prefer server-side analytics; run unavoidable third-party scripts through Partytown.
- Lazy-load conditional code with dynamic `import()`.
- Return promises from server `load` for non-essential data so it streams.
- Avoid waterfalls: fetch dependent backend data in server `load`, and prefer one joined DB query over sequential ones. SPA mode creates waterfalls by design.
- Host the frontend next to the backend, or at the edge when there is none. Require HTTP/2 or newer.

## Observability

Since 2.31. Emits OpenTelemetry spans for `handle` (and `sequence` children), server and universal-on-server `load`, form actions, `+server` handlers and remote functions.

```js
// vite.config.js
sveltekit({ tracing: { server: true } });
```

`v2:` this lived under `kit.experimental.tracing` and also needed `kit.experimental.instrumentation`.

`src/instrumentation.server.js` runs before app code (when the adapter supports it):

```js
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { register } from "import-in-the-middle/register-hooks.mjs";

register(); // sync hooks: Node 22.22.3+, 24.11.1+, 25.1.0+, 26+
new NodeSDK({
	serviceName: "my-app",
	traceExporter: new OTLPTraceExporter(),
	instrumentations: [getNodeAutoInstrumentations()],
}).start();
```

- Annotate spans: `getRequestEvent().tracing.root.setAttribute('userId', id)` (also `tracing.current`).
- `@opentelemetry/api` is an optional peer; install it if SvelteKit reports it missing after setup.
- Tracing has real overhead; consider enabling it only in dev and preview.
- Bundling can hide modules from auto-instrumentation. List the instrumented library in Vite `ssr.external` and in `dependencies`. Modules imported by `src/env` load before instrumentation and cannot be wrapped.

Source: https://svelte.dev/docs/kit/building-your-app, https://svelte.dev/docs/kit/adapters, https://svelte.dev/docs/kit/adapter-auto, https://svelte.dev/docs/kit/adapter-node, https://svelte.dev/docs/kit/adapter-bun, https://svelte.dev/docs/kit/adapter-static, https://svelte.dev/docs/kit/single-page-apps, https://svelte.dev/docs/kit/adapter-cloudflare, https://svelte.dev/docs/kit/adapter-cloudflare-workers, https://svelte.dev/docs/kit/adapter-netlify, https://svelte.dev/docs/kit/adapter-vercel, https://svelte.dev/docs/kit/performance, https://svelte.dev/docs/kit/observability, https://svelte.dev/docs/kit/cli, https://svelte.dev/docs/kit/migrating-to-sveltekit-3
