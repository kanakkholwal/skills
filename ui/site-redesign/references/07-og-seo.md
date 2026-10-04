# Phase 8: OG images and SEO

## OG cards

- One template family (profile, project, article, generic page) on a soft card: tile, name with a muted suffix,
  one line of description, one accent dot. Same fonts as the site (load woff, not woff2, for satori/takumi).
- Clamp descriptions (~110 chars). Generic pages get `/og/page?title=&description=&path=` by default from
  the `seo()` helper so nothing ships without a card.
- **Version the URLs** (`?v=${OG_VERSION}`): social platforms and browsers cache OG images for a day or more.
  Bump the version whenever the template changes, or old cards keep showing.

## `seo()` helper

One function returns the route `head()` payload: title template (`X | Name`, skip the suffix if already
present), description, canonical, og:* (incl. `og:image:alt`, width, height), twitter:*, robots, keywords,
and `jsonLd: object[]` rendered as `application/ld+json` scripts. Every route uses it, including home.

## Structured data

- Site-wide `@graph` from the root: `Person` (`@id` `/#person`: name, url, image, jobTitle, worksFor,
  alumniOf, knowsAbout, sameAs for every real profile) and `WebSite` (`@id` `/#website`, publisher → person).
  Verify each `sameAs` URL (e.g. the npm username from the registry's `maintainers`, not a guess).
- Home: `ProfilePage` with `mainEntity: {"@id": "/#person"}`. Don't put Person fields on the ProfilePage.
- Articles: `BlogPosting` (headline, description, image, dateModified, author/publisher by `@id`).
- Projects: `SoftwareSourceCode` when a GitHub link exists (codeRepository), else `CreativeWork`.
- `BreadcrumbList` on every nested page.

## Sitemap and robots

- Sitemap generated from the content sources plus a static route list. Audit it against the actual route
  tree: every public page, every category, every project and post. Include `<image:image>` with the OG URL,
  XML-escape `&` in URLs. Don't name a helper `escape` (shadows a global; Biome errors).
- `robots.txt`: allow all, disallow RPC endpoints (`/_serverFn/`) and search APIs, keep OG routes crawlable
  (Twitterbot respects robots), one `Sitemap:` line.

## Crawl check

`scripts/seo-crawl.mjs` over every route. Fix: missing canonical, duplicate or empty descriptions, stale copy
("last 7, 30, or 90 days" after adding 24h), titles over ~70 chars, pages with no JSON-LD beyond the root.
A second `<title>` inside an inline SVG icon is a false positive.

New MDX files 404 in dev until the content plugin regenerates: restart the dev server before crawling.
