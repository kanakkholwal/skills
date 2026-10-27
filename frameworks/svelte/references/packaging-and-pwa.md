# Packaging and PWA

Publishing Svelte libraries with `@sveltejs/package`, and service workers for offline and installable apps. Written against SvelteKit 3; `v2:` notes mark what differs in SvelteKit 2.

## Contents

- Library layout
- What svelte-package does
- package.json
- TypeScript and subpath exports
- Library best practices
- Source maps
- Caveats
- Service workers
- Caching strategy
- Updates and registration
- Installable PWA

## Library layout

A library is a SvelteKit project where `src/lib` is the public surface and the root `package.json` is what gets published. `src/routes` becomes a docs site, demo or sandbox. `npx sv create` offers a library template.

```sh
npx svelte-package        # src/lib -> dist
npm publish
```

## What svelte-package does

- Copies every file from `src/lib` to `dist`.
- Preprocesses `.svelte` files and transpiles `.ts` to `.js`. Everything else is copied as is.
- Generates `.d.ts` next to each Svelte, JS and TS file (needs `typescript >= 4.0.0`). Hand-written `.d.ts` files are copied.
- Rewrites `#`-prefixed subpath imports (from `package.json` `imports`) to relative paths.
- Does not write a `package.json`; it validates yours. (Version 1 generated one.)

| Flag                      | Default   | Meaning                                           |
| ------------------------- | --------- | ------------------------------------------------- |
| `-w`, `--watch`           |           | Rebuild on changes                                |
| `-i`, `--input`           | `src/lib` | Source dir                                        |
| `-o`, `--output`          | `dist`    | Output dir; `exports` and `files` must point here |
| `-p`, `--preserve-output` | `false`   | Keep output dir instead of emptying it            |
| `-t`, `--types`           | `true`    | Emit `.d.ts`; keep it on                          |
| `--tsconfig`              | nearest   | Path to tsconfig/jsconfig                         |

## package.json

```json
{
	"name": "your-library",
	"license": "MIT",
	"files": ["dist"],
	"exports": {
		".": {
			"types": "./dist/index.d.ts",
			"svelte": "./dist/index.js"
		}
	},
	"svelte": "./dist/index.js",
	"sideEffects": ["**/*.css"]
}
```

- `files`: what npm packs. `package.json`, `README` and `LICENSE` are always included. Use `.npmignore` for tests and route-only modules.
- `exports` conditions: `types` for TypeScript, `svelte` tells Svelte-aware tooling this ships components. A library with no components that works outside Svelte should use `default` instead of `svelte`.
- Top-level `svelte`: legacy field for old tooling. Keep it, pointing at the root entry.
- `sideEffects`: lets bundlers tree-shake. Mark CSS (webpack needs it). If a script has side effects, list it, or it may be dropped:

```json
{ "sideEffects": ["**/*.css", "./dist/sideEffectfulFile.js"] }
```

Expose a component directly instead of through an index:

```json
{
	"exports": {
		"./Foo.svelte": {
			"types": "./dist/Foo.svelte.d.ts",
			"svelte": "./dist/Foo.svelte"
		}
	}
}
```

```js
import Foo from "your-library/Foo.svelte";
```

## TypeScript and subpath exports

TypeScript ignores the `types` condition of non-root exports unless the consumer uses `moduleResolution` `bundler` (TS 5+, recommended), `node16` or `nodenext`. Otherwise it looks for `your-library/foo.d.ts` at the package root.

Workaround for older consumers: mirror exports in `typesVersions`. Once used, every type import must go through it, including the root (`"index.d.ts": [...]`). `*` wildcards work.

```json
{
	"exports": {
		"./foo": { "types": "./dist/foo.d.ts", "svelte": "./dist/foo.js" }
	},
	"typesVersions": {
		">4.0": { "foo": ["./dist/foo.d.ts"] }
	}
}
```

## Library best practices

- Avoid `$app/*` imports unless the library is SvelteKit-only. Use `esm-env` instead of `$app/env`:

```js
import { BROWSER } from "esm-env";
```

- Take URLs and navigation callbacks as props rather than reading `$app/state` or `$app/navigation`. Easier to test and demo too.
- Use subpath imports (`#foo`) for internal aliases.
- Semver: removing an `exports` path or any condition inside one is a breaking change; so is switching `svelte` to `default`. Adding a new export path is fine.

## Source maps

Set `"declarationMap": true` in tsconfig and publish the sources so Go to Definition lands in the original `.svelte`/`.ts`:

```json
{
	"files": [
		"dist",
		"!dist/**/*.test.*",
		"!dist/**/*.spec.*",
		"src/lib",
		"!src/lib/**/*.test.*",
		"!src/lib/**/*.spec.*"
	]
}
```

## Caveats

Relative imports must be fully specified (Node ESM rules). In TS files, import `.ts` modules with a `.js` extension; `"moduleResolution": "NodeNext"` helps enforce it.

```js
import { something } from "./something/index.js";
```

## Service workers

`src/service-worker/index.ts` (or `src/service-worker.js`/`.ts`) is bundled and registered automatically.

| Import                                                    | Gives you                                                              |
| --------------------------------------------------------- | ---------------------------------------------------------------------- |
| `self` from `$app/service-worker`                         | `globalThis` typed as `ServiceWorkerGlobalScope` (service worker only) |
| `version` from `$app/env`                                 | Deployment id, for cache names                                         |
| `immutable`, `assets`, `prerendered` from `$app/manifest` | Vite output, `static` files, prerendered pages                         |
| `resolve` from `$app/paths`                               | Turn manifest paths (base-relative) into absolute pathnames            |

`v2:` these values came from the `$service-worker` module, which SvelteKit 3 removed.

Types: the worker is a separate TS project.

```json
// tsconfig.json
{ "extends": "$app/tsconfig", "include": ["src", "test"], "exclude": ["src/service-worker"] }
```

```json
// src/service-worker/tsconfig.json
{ "extends": "$app/tsconfig/service-worker" }
```

- Bundled for production only, not during `dev`. Test offline behaviour with `build` + `preview`.
- Must be same-origin: a service worker plus a CDN `paths.assets` is an error.

## Caching strategy

Precache build output and `static` on install, drop old caches on activate, serve precached files cache-first and everything else network-first with cache fallback.

```js
// src/service-worker/index.js
import { self } from "$app/service-worker";
import { version } from "$app/env";
import { immutable, assets } from "$app/manifest";
import { resolve } from "$app/paths";

const CACHE = `cache-${version}`;
const ASSETS = [...immutable, ...assets].map((a) => resolve(a.path));

self.addEventListener("install", (event) => {
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
				),
			),
	);
});

self.addEventListener("fetch", (event) => {
	if (event.request.method !== "GET") return;

	event.respondWith(
		(async () => {
			const url = new URL(event.request.url);
			const cache = await caches.open(CACHE);

			if (ASSETS.includes(url.pathname)) {
				const hit = await cache.match(url.pathname);
				if (hit) return hit;
			}

			try {
				const res = await fetch(event.request);
				if (
					res.status === 200 &&
					!res.headers.get("cache-control")?.includes("no-store")
				) {
					void cache.put(event.request, res.clone());
				}
				return res;
			} catch (error) {
				const hit = await cache.match(event.request);
				if (hit) return hit;
				throw error;
			}
		})(),
	);
});
```

- Stale data can be worse than no data. Decide per route what may be served offline.
- Browsers evict full caches; do not precache large media.

## Updates and registration

Browsers look for a new worker on full-page navigations and functional events (`push`, `sync`), not on client-side navigation. SvelteKit only calls `registration.update()` during error recovery after version polling detects a redeploy.

Check eagerly on every navigation (root layout):

```js
import { afterNavigate } from "$app/navigation";

afterNavigate(async () => {
	if ("serviceWorker" in navigator) {
		const registration = await navigator.serviceWorker.getRegistration();
		await registration?.update();
	}
});
```

The new worker installs in the background and takes over once all tabs controlled by the old one close.

Manual registration: set `serviceWorker: { register: false }` in the `sveltekit()` options, then register yourself:

```js
if ("serviceWorker" in navigator) {
	addEventListener("load", () => {
		navigator.serviceWorker.register("./service-worker.js", { type: "module" });
	});
}
```

- With a Trusted Types CSP (`'require-trusted-types-for': ['script']`), auto-registration uses a policy named `sveltekit-trusted-url`; add it to `csp.directives['trusted-types']` or register manually.
- Prefer Workbox? The docs point to the Vite PWA plugin (`vite-pwa-org.netlify.app/frameworks/sveltekit`).

## Installable PWA

SvelteKit has no manifest or install API. Installability is plain web platform: a service worker (above) plus a web app manifest you write yourself.

- Put `manifest.webmanifest` and icons in `static/`; they are then part of `assets` and get precached.
- Link it from `src/app.html` with `<link rel="manifest" href="%sveltekit.assets%/manifest.webmanifest">`.
- Manifest fields, icon sizes and install criteria: see web.dev/learn/pwa and MDN, not the SvelteKit docs.
- Offline-first apps should prerender what they can so `prerendered` pages are available to cache.

Source: https://svelte.dev/docs/kit/packaging, https://svelte.dev/docs/kit/service-workers, https://svelte.dev/docs/kit/$app-service-worker, https://svelte.dev/docs/kit/$app-manifest, https://svelte.dev/docs/kit/$app-tsconfig-service-worker, https://svelte.dev/docs/kit/@sveltejs-kit-vite, https://svelte.dev/docs/kit/glossary, https://svelte.dev/docs/kit/project-structure, https://svelte.dev/docs/kit/migrating-to-sveltekit-3
