// Usage: node seo-crawl.mjs <base> [route...]   (no routes: reads <base>/sitemap.xml)
const [, , base, ...given] = process.argv;
if (!base) {
  console.error("usage: node seo-crawl.mjs <base> [route...]");
  process.exit(1);
}

async function routesFromSitemap() {
  const xml = await (await fetch(`${base}/sitemap.xml`)).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
}

const pick = (html, re) => (html.match(re) || [])[1] ?? "";
const count = (html, re) => (html.match(re) || []).length;
const paths = given.length ? given : await routesFromSitemap();
const issues = [];

for (const p of paths) {
  const res = await fetch(base + p);
  const h = await res.text();
  // SVG icons carry their own <title>; only count titles inside <head>.
  const head = h.split("</head>")[0];
  const title = pick(head, /<title>([^<]*)<\/title>/);
  const desc = pick(head, /<meta name="description" content="([^"]*)"/);
  const canon = pick(head, /<link rel="canonical" href="([^"]*)"/);
  const og = pick(head, /property="og:image" content="([^"]*)"/);
  const row = {
    status: res.status,
    titles: count(head, /<title>/g),
    titleLen: title.length,
    descLen: desc.length,
    canonical: Boolean(canon),
    og: Boolean(og),
    h1: count(h, /<h1[\s>]/g),
    jsonLd: count(h, /application\/ld\+json/g),
  };
  console.log(`${res.status} ${p}\n   "${title}"\n   desc[${desc.length}] ${desc.slice(0, 100)}`);
  const flag = (cond, msg) => cond && issues.push(`${p}: ${msg}`);
  flag(row.status !== 200, `status ${row.status}`);
  flag(row.titles !== 1, `${row.titles} <title> in head`);
  flag(row.titleLen > 70, `title ${row.titleLen} chars`);
  flag(row.descLen < 50 || row.descLen > 165, `description ${row.descLen} chars`);
  flag(!row.canonical, "no canonical");
  flag(!row.og, "no og:image");
  flag(row.h1 !== 1, `${row.h1} h1`);
}
console.log(issues.length ? `\nIssues:\n- ${issues.join("\n- ")}` : "\nNo issues.");
