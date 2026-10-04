# Phase 9: Data and performance

Load `workers-best-practices` on Cloudflare.

## Rules

- **All third-party fetches on the server** (server functions/loaders). Keys never reach the client.
- Count subrequests per cold request. Workers Free allows 50; batch until a cold page is well under.
- Cache at three layers, each with a reason:

| Layer | Tool | TTL |
| --- | --- | --- |
| Upstream result, shared across isolates | `edgeMemo` (Cache API + per-isolate map) | 1h typical |
| Browser reuse of RPC responses | `cacheResponse(maxAge, swr)` on `/_serverFn` only | 5 to 60 min |
| Client navigation | router `defaultStaleTime`, `defaultPreloadStaleTime`, per-route `staleTime` | static content: Infinity |

## edgeMemo

`memo` keyed by JSON args, backed by `caches.default` so one result serves a whole data centre. A `keep(value)`
predicate refuses to cache partial or failed results; those are held only `RETRY_SECONDS = 60` locally so a
fixed key or recovered upstream shows up within a minute. Caching `null` for an hour is how a newly added API
key "doesn't work".

## cacheResponse

Set `cache-control: private, max-age=N, stale-while-revalidate=12N` only when the request path starts with
`/_serverFn`; during SSR the same call would stamp the HTML document.

## Batching upstreams

- GitHub: one GraphQL query with aliases for every repo's stars/metadata instead of N REST calls.
- npm downloads: the bulk range endpoint takes up to 128 unscoped names and 365 days per call. Scoped
  packages (`@org/*`) aren't allowed in bulk: fetch them individually but only the young ones need full ranges.
- GA4: `batchRunReports` (up to 5 reports per call). A 24h range uses `dateHour` with an inListFilter of the
  last 24 hours in the property's timezone.
- PostHog: HogQL via `POST /api/projects/{id}/query/` with a personal key scoped to Query: Read. Project ids are
  public; the key is a secret.

## Secrets

- `.env.example` lists names with empty values (GitHub push protection flags realistic placeholders like
  `phx_XXXX...`).
- Locally keys live in gitignored `.env.development` / `.env.production`; on Workers declare them under
  `secrets.required` in `wrangler.jsonc` and set them with `wrangler secret put`.
- Copy keys between env files with shell redirection, never by printing them.

## Third-party scripts

Analytics tags only in production builds, async. No client-side analytics fetching.
