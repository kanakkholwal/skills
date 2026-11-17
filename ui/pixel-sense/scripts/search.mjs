#!/usr/bin/env node
// Node port of ui-ux-pro-max's Python BM25 engine (MIT, Next Level Builder). Zero dependencies.
import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "data");

const DOMAINS = {
	style: {
		file: "styles.csv",
		search: [
			"Style Category",
			"Keywords",
			"Best For",
			"Type",
			"AI Prompt Keywords",
		],
		out: [
			"Style Category",
			"Type",
			"Keywords",
			"Primary Colors",
			"Effects & Animation",
			"Best For",
			"Do Not Use For",
			"Light Mode ✓",
			"Dark Mode ✓",
			"Performance",
			"Accessibility",
			"Complexity",
			"AI Prompt Keywords",
			"CSS/Technical Keywords",
			"Implementation Checklist",
			"Design System Variables",
		],
	},
	color: {
		file: "colors.csv",
		search: ["Product Type", "Notes"],
		out: [
			"Product Type",
			"Primary",
			"On Primary",
			"Secondary",
			"On Secondary",
			"Accent",
			"On Accent",
			"Background",
			"Foreground",
			"Card",
			"Card Foreground",
			"Muted",
			"Muted Foreground",
			"Border",
			"Destructive",
			"On Destructive",
			"Ring",
			"Notes",
		],
	},
	chart: {
		file: "charts.csv",
		search: [
			"Data Type",
			"Keywords",
			"Best Chart Type",
			"When to Use",
			"When NOT to Use",
			"Accessibility Notes",
		],
		out: [
			"Data Type",
			"Keywords",
			"Best Chart Type",
			"Secondary Options",
			"When to Use",
			"When NOT to Use",
			"Data Volume Threshold",
			"Color Guidance",
			"Accessibility Grade",
			"Accessibility Notes",
			"A11y Fallback",
			"Library Recommendation",
			"Interactive Level",
		],
	},
	landing: {
		file: "landing.csv",
		search: [
			"Pattern Name",
			"Keywords",
			"Conversion Optimization",
			"Section Order",
		],
		out: [
			"Pattern Name",
			"Keywords",
			"Section Order",
			"Primary CTA Placement",
			"Color Strategy",
			"Conversion Optimization",
		],
	},
	product: {
		file: "products.csv",
		search: [
			"Product Type",
			"Keywords",
			"Primary Style Recommendation",
			"Key Considerations",
		],
		out: [
			"Product Type",
			"Keywords",
			"Primary Style Recommendation",
			"Secondary Styles",
			"Landing Page Pattern",
			"Dashboard Style (if applicable)",
			"Color Palette Focus",
			"Key Considerations",
		],
	},
	ux: {
		file: "ux-guidelines.csv",
		search: ["Category", "Issue", "Description", "Platform"],
		out: [
			"Category",
			"Issue",
			"Platform",
			"Description",
			"Do",
			"Don't",
			"Code Example Good",
			"Code Example Bad",
			"Severity",
		],
	},
	typography: {
		file: "typography.csv",
		search: [
			"Font Pairing Name",
			"Category",
			"Mood/Style Keywords",
			"Best For",
			"Heading Font",
			"Body Font",
		],
		out: [
			"Font Pairing Name",
			"Category",
			"Heading Font",
			"Body Font",
			"Mood/Style Keywords",
			"Best For",
			"Google Fonts URL",
			"CSS Import",
			"Tailwind Config",
			"Notes",
		],
	},
	icons: {
		file: "icons.csv",
		search: ["Category", "Icon Name", "Keywords", "Best For"],
		out: [
			"Category",
			"Icon Name",
			"Keywords",
			"Library",
			"Import Code",
			"Usage",
			"Best For",
			"Style",
		],
	},
	gsap: {
		file: "motion.csv",
		search: ["Category", "Intensity Tier", "Keywords", "Trigger"],
		out: [
			"Category",
			"Intensity Tier",
			"Trigger",
			"Duration",
			"Easing",
			"GSAP Snippet",
			"Framework Notes",
			"Do",
			"Don't",
			"Performance Notes",
		],
	},
	react: {
		file: "react-performance.csv",
		search: ["Category", "Issue", "Keywords", "Description"],
		out: [
			"Category",
			"Issue",
			"Platform",
			"Description",
			"Do",
			"Don't",
			"Code Example Good",
			"Code Example Bad",
			"Severity",
		],
	},
	web: {
		file: "app-interface.csv",
		search: ["Category", "Issue", "Keywords", "Description"],
		out: [
			"Category",
			"Issue",
			"Platform",
			"Description",
			"Do",
			"Don't",
			"Code Example Good",
			"Code Example Bad",
			"Severity",
		],
	},
	"google-fonts": {
		file: "google-fonts.csv",
		search: [
			"Family",
			"Category",
			"Stroke",
			"Classifications",
			"Keywords",
			"Subsets",
			"Designers",
		],
		out: [
			"Family",
			"Category",
			"Stroke",
			"Classifications",
			"Styles",
			"Variable Axes",
			"Subsets",
			"Designers",
			"Popularity Rank",
			"Google Fonts URL",
		],
	},
};

const STACK_COLS = {
	search: ["Category", "Guideline", "Description", "Do", "Don't"],
	out: [
		"Category",
		"Guideline",
		"Description",
		"Do",
		"Don't",
		"Code Good",
		"Code Bad",
		"Severity",
		"Docs URL",
	],
};
const STACKS = readdirSync(join(DATA, "stacks"))
	.filter((f) => f.endsWith(".csv"))
	.map((f) => f.slice(0, -4));

// Keyword lists are copied from the Python engine so domain auto-detection matches it.
const DOMAIN_HINTS = {
	color: [
		"color",
		"palette",
		"hex",
		"#",
		"rgb",
		"token",
		"semantic",
		"accent",
		"destructive",
		"muted",
		"foreground",
	],
	chart: [
		"chart",
		"graph",
		"visualization",
		"trend",
		"bar",
		"pie",
		"scatter",
		"heatmap",
		"funnel",
	],
	landing: [
		"landing",
		"page",
		"cta",
		"conversion",
		"hero",
		"testimonial",
		"pricing",
		"section",
	],
	product:
		"saas|ecommerce|e-commerce|fintech|healthcare|gaming|portfolio|crypto|dashboard|fitness|restaurant|hotel|travel|music|education|learning|legal|insurance|medical|beauty|pharmacy|dental|pet|dating|wedding|recipe|delivery|ride|booking|calendar|timer|tracker|diary|note|chat|messenger|crm|invoice|parking|transit|vpn|alarm|weather|sleep|meditation|fasting|habit|grocery|meme|wardrobe|plant care|reading|flashcard|puzzle|trivia|arcade|photography|streaming|podcast|newsletter|marketplace|freelancer|coworking|airline|museum|theater|church|non-profit|charity|kindergarten|daycare|senior care|veterinary|florist|bakery|brewery|construction|automotive|real estate|logistics|agriculture|coding bootcamp".split(
			"|",
		),
	style:
		"style|design|ui|minimalism|glassmorphism|neumorphism|brutalism|dark mode|flat|aurora|prompt|css|implementation|variable|checklist|tailwind".split(
			"|",
		),
	ux: [
		"ux",
		"usability",
		"accessibility",
		"wcag",
		"touch",
		"scroll",
		"animation",
		"keyboard",
		"navigation",
		"mobile",
	],
	typography: [
		"font pairing",
		"typography pairing",
		"heading font",
		"body font",
	],
	"google-fonts":
		"google font|font family|font weight|font style|variable font|noto|font for|find font|font subset|font language|monospace font|serif font|sans serif font|display font|handwriting font|font|typography|serif|sans".split(
			"|",
		),
	icons: [
		"icon",
		"icons",
		"lucide",
		"heroicons",
		"symbol",
		"glyph",
		"pictogram",
		"svg icon",
	],
	gsap: "gsap|quickto|scrolltrigger|stagger|magnetic cursor|parallax|page transition|scroll reveal|scroll-triggered|scrollytelling|flip plugin|splittext|shimmer|skeleton loader".split(
		"|",
	),
	react:
		"react|next.js|nextjs|suspense|memo|usecallback|useeffect|rerender|bundle|waterfall|barrel|dynamic import|rsc|server component".split(
			"|",
		),
	web: [
		"aria",
		"focus",
		"outline",
		"semantic",
		"virtualize",
		"autocomplete",
		"form",
		"input type",
		"preconnect",
	],
};

function parseCsv(text) {
	const rows = [];
	let row = [];
	let field = "";
	let quoted = false;
	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (quoted) {
			if (c === '"' && text[i + 1] === '"') {
				field += '"';
				i++;
			} else if (c === '"') quoted = false;
			else field += c;
		} else if (c === '"') quoted = true;
		else if (c === ",") {
			row.push(field);
			field = "";
		} else if (c === "\n" || c === "\r") {
			if (c === "\r" && text[i + 1] === "\n") i++;
			row.push(field);
			rows.push(row);
			row = [];
			field = "";
		} else field += c;
	}
	if (field || row.length) rows.push([...row, field]);
	const [head, ...body] = rows.filter((r) => r.some((v) => v !== ""));
	return body.map((r) =>
		Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])),
	);
}

const cache = new Map();
function load(file) {
	if (!cache.has(file)) {
		const path = join(DATA, file);
		cache.set(
			file,
			existsSync(path)
				? parseCsv(readFileSync(path, "utf8").replace(/^﻿/, ""))
				: null,
		);
	}
	return cache.get(file);
}

const tokenize = (s) =>
	String(s)
		.toLowerCase()
		.replace(/[^\p{L}\p{N}_\s]/gu, " ")
		.split(/\s+/)
		.filter((w) => w.length >= 2);

function bm25(docs, query, k1 = 1.5, b = 0.75) {
	const corpus = docs.map(tokenize);
	const avgdl = corpus.reduce((n, d) => n + d.length, 0) / (corpus.length || 1);
	const df = new Map();
	for (const doc of corpus)
		for (const w of new Set(doc)) df.set(w, (df.get(w) ?? 0) + 1);
	const idf = (w) =>
		Math.log((corpus.length - df.get(w) + 0.5) / (df.get(w) + 0.5) + 1);
	const terms = tokenize(query).filter((t) => df.has(t));
	return corpus
		.map((doc, i) => {
			const tf = new Map();
			for (const w of doc) tf.set(w, (tf.get(w) ?? 0) + 1);
			let score = 0;
			for (const t of terms) {
				const f = tf.get(t) ?? 0;
				score +=
					(idf(t) * f * (k1 + 1)) /
					(f + k1 * (1 - b + (b * doc.length) / avgdl));
			}
			return [i, score];
		})
		.sort((x, y) => y[1] - x[1]);
}

function searchFile(file, cols, query, max) {
	const rows = load(file);
	if (!rows) return null;
	const docs = rows.map((r) => cols.search.map((c) => r[c] ?? "").join(" "));
	return bm25(docs, query)
		.slice(0, max)
		.filter(([, s]) => s > 0)
		.map(([i]) =>
			Object.fromEntries(
				cols.out.filter((c) => c in rows[i]).map((c) => [c, rows[i][c]]),
			),
		);
}

function detectDomain(query) {
	const q = query.toLowerCase();
	let best = "style";
	let top = 0;
	for (const [domain, words] of Object.entries(DOMAIN_HINTS)) {
		const hits = words.filter((w) =>
			new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\#]/g, "\\$&")}\\b`).test(q),
		).length;
		if (hits > top) [best, top] = [domain, hits];
	}
	return best;
}

export function search(query, domain = detectDomain(query), max = 3) {
	const cfg = DOMAINS[domain] ?? DOMAINS.style;
	return {
		domain,
		query,
		file: cfg.file,
		results: searchFile(cfg.file, cfg, query, max) ?? [],
	};
}

export function searchStack(query, stack, max = 3) {
	if (!STACKS.includes(stack))
		throw new Error(
			`Unknown stack "${stack}". Available: ${STACKS.join(", ")}`,
		);
	const file = `stacks/${stack}.csv`;
	return {
		domain: "stack",
		stack,
		query,
		file,
		results: searchFile(file, STACK_COLS, query, max) ?? [],
	};
}

// --- design system ---

const DIALS = {
	variance: [
		[
			"Centered / Minimal",
			[
				"Minimalism",
				"Exaggerated Minimalism",
				"centered",
				"symmetric",
				"grid-based",
			],
		],
		["Balanced / Modern", ["modern", "structured", "balanced"]],
		[
			"Bold / Asymmetric",
			["Brutalism", "Bento Grids", "asymmetric", "experimental"],
		],
	],
	motion: [["Subtle"], ["Standard"], ["Complex"]],
	density: [
		["Spacious", [4, 8, 24, 32, 48, 64, 96]],
		["Standard", [4, 8, 16, 24, 32, 48, 64]],
		["Dense / Dashboard", [2, 4, 8, 12, 16, 24, 32]],
	],
};
const SPACE_TOKENS = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"];

function dial(name, value) {
	if (value == null) return null;
	const v = Math.max(1, Math.min(10, Number(value)));
	const [label, data] = DIALS[name][v <= 3 ? 0 : v <= 7 ? 1 : 2];
	return { value: v, label, data };
}

function reasoningFor(category) {
	const rules = load("ui-reasoning.csv") ?? [];
	const c = category.toLowerCase();
	const cat = (r) => (r.UI_Category ?? "").toLowerCase();
	const rule =
		rules.find((r) => cat(r) === c) ??
		rules.find((r) => cat(r).includes(c) || c.includes(cat(r))) ??
		rules.find((r) =>
			cat(r)
				.split(/[\s/-]+/)
				.some((k) => k && c.includes(k)),
		);
	if (!rule)
		return {
			pattern: "Hero + Features + CTA",
			stylePriority: ["Minimalism"],
			effects: "",
			avoid: "",
		};
	return {
		pattern: rule.Recommended_Pattern,
		stylePriority: rule.Style_Priority.split("+").map((s) => s.trim()),
		typographyMood: rule.Typography_Mood,
		effects: rule.Key_Effects,
		avoid: rule.Anti_Patterns,
	};
}

// Decision (code): unlike upstream, drop styles whose own "Do Not Use For" names the product.
function pickStyle(all, priority, context) {
	const words = new Set(tokenize(context).map((w) => w.replace(/s$/, "")));
	const misfit = (r) =>
		tokenize(r["Do Not Use For"]).some((w) => words.has(w.replace(/s$/, "")));
	const results = all.some((r) => !misfit(r))
		? all.filter((r) => !misfit(r))
		: all;
	if (!results.length) return {};
	const name = (r) => (r["Style Category"] ?? "").toLowerCase();
	for (const p of priority.map((s) => s.toLowerCase().trim())) {
		const hit = results.find((r) => name(r).includes(p) || p.includes(name(r)));
		if (hit) return hit;
	}
	const score = (r) =>
		priority.reduce((n, kw) => {
			const k = kw.toLowerCase().trim();
			if (name(r).includes(k)) return n + 10;
			if ((r.Keywords ?? "").toLowerCase().includes(k)) return n + 3;
			return JSON.stringify(r).toLowerCase().includes(k) ? n + 1 : n;
		}, 0);
	const best = [...results].sort((a, b) => score(b) - score(a))[0];
	return score(best) > 0 ? best : results[0];
}

function hexToOklch(hex) {
	const m = /^#?([\da-f]{6})$/i.exec(hex?.trim() ?? "");
	if (!m) return "";
	const lin = [0, 2, 4].map((i) => {
		const v = Number.parseInt(m[1].slice(i, i + 2), 16) / 255;
		return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
	});
	const [r, g, bl] = lin;
	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * bl);
	const mm = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * bl);
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * bl);
	const L = 0.2104542553 * l + 0.793617785 * mm - 0.0040720468 * s;
	const A = 1.9779984951 * l - 2.428592205 * mm + 0.4505937099 * s;
	const B = 0.0259040371 * l + 0.7827717662 * mm - 0.808675766 * s;
	const H = ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
	return `oklch(${(L * 100).toFixed(1)}% ${Math.hypot(A, B).toFixed(3)} ${H.toFixed(1)})`;
}

export function designSystem(
	query,
	{ project, variance, motion, density } = {},
) {
	const v = dial("variance", variance);
	const mo = dial("motion", motion);
	const d = dial("density", density);
	const product = search(query, "product", 1).results[0] ?? {};
	const category = product["Product Type"] ?? "General";
	const why = reasoningFor(category);
	const priority = [...(v?.data ?? []), ...why.stylePriority];
	const styles = search(
		`${query} ${priority.slice(0, 2).join(" ")}`,
		"style",
		6,
	).results;
	const style = pickStyle(styles, priority, `${query} ${category}`);
	const color = search(query, "color", 2).results[0] ?? {};
	const type = search(query, "typography", 2).results[0] ?? {};
	const landing = search(query, "landing", 2).results[0] ?? {};
	let motionSnippet = null;
	if (mo) {
		const hits = search(`${query} ${mo.label}`, "gsap", 5).results;
		motionSnippet =
			hits.find((h) => h["Intensity Tier"] === mo.label) ?? hits[0] ?? null;
	}
	const roles = [
		"Primary",
		"On Primary",
		"Secondary",
		"Accent",
		"Background",
		"Foreground",
		"Muted",
		"Border",
		"Destructive",
		"Ring",
	];
	return {
		project: project ?? query,
		category,
		dials: { variance: v, motion: mo, density: d },
		pattern: {
			name: landing["Pattern Name"] ?? why.pattern,
			sections: landing["Section Order"] ?? "Hero > Features > CTA",
			cta: landing["Primary CTA Placement"] ?? "Above fold",
			colorStrategy: landing["Color Strategy"] ?? "",
			conversion: landing["Conversion Optimization"] ?? "",
		},
		style: {
			name: style["Style Category"] ?? "Minimalism",
			keywords: style.Keywords ?? "",
			bestFor: style["Best For"] ?? "",
			avoidFor: style["Do Not Use For"] ?? "",
			effects: style["Effects & Animation"] || why.effects,
			performance: style.Performance ?? "",
			accessibility: style.Accessibility ?? "",
		},
		colors: roles
			.filter((r) => color[r])
			.map((role) => ({
				role,
				hex: color[role],
				oklch: hexToOklch(color[role]),
			})),
		colorNotes: color.Notes ?? "",
		typography: {
			heading: type["Heading Font"] ?? "",
			body: type["Body Font"] ?? "",
			mood: type["Mood/Style Keywords"] ?? why.typographyMood ?? "",
			url: type["Google Fonts URL"] ?? "",
		},
		spacing: (d?.data ?? DIALS.density[1][1]).map((px, i) => [
			SPACE_TOKENS[i],
			px,
		]),
		motionSnippet,
		avoid: why.avoid
			.split("+")
			.map((s) => s.trim())
			.filter(Boolean),
	};
}

const opt = (value, line) => (value ? line : null);

function toMarkdown(ds) {
	const out = [
		`## Design system: ${ds.project}`,
		"",
		`Category: ${ds.category}`,
	];
	const dials = Object.entries(ds.dials).filter(([, x]) => x);
	if (dials.length)
		out.push(
			`Dials: ${dials.map(([k, x]) => `${k} ${x.value}/10 (${x.label})`).join(", ")}`,
		);
	out.push(
		"",
		"### Pattern",
		`- ${ds.pattern.name}: ${ds.pattern.sections}`,
		`- CTA: ${ds.pattern.cta}`,
		opt(
			ds.pattern.colorStrategy,
			`- Colour strategy: ${ds.pattern.colorStrategy}`,
		),
		opt(ds.pattern.conversion, `- Conversion: ${ds.pattern.conversion}`),
		"",
		"### Style",
		`- ${ds.style.name}`,
		opt(ds.style.keywords, `- Keywords: ${ds.style.keywords}`),
		opt(ds.style.bestFor, `- Best for: ${ds.style.bestFor}`),
		opt(ds.style.avoidFor, `- Not for: ${ds.style.avoidFor}`),
		opt(ds.style.effects, `- Effects: ${ds.style.effects}`),
		"",
		"### Colours (seed only: re-derive in OKLCH and measure with color-audit.mjs)",
		"| Role | Hex | OKLCH |",
		"| --- | --- | --- |",
		...ds.colors.map((c) => `| ${c.role} | \`${c.hex}\` | \`${c.oklch}\` |`),
		opt(ds.colorNotes, `\n${ds.colorNotes}`),
		"",
		"### Typography",
		`- ${ds.typography.heading} / ${ds.typography.body}`,
		opt(ds.typography.mood, `- Mood: ${ds.typography.mood}`),
		opt(ds.typography.url, `- ${ds.typography.url}`),
		"",
		"### Spacing",
		ds.spacing.map(([t, px]) => `\`--space-${t}: ${px / 16}rem\``).join(" "),
	);
	if (ds.motionSnippet) {
		const m = ds.motionSnippet;
		out.push(
			"",
			"### Motion",
			`- ${m.Category} (${m["Intensity Tier"]}): ${m.Duration}, ${m.Easing}`,
			"```js",
			m["GSAP Snippet"],
			"```",
		);
	}
	if (ds.avoid.length)
		out.push("", "### Avoid", ...ds.avoid.map((a) => `- ${a}`));
	out.push(
		"",
		"### Before shipping",
		"- Run `node scripts/slop-scan.mjs <src>` and fix every hit",
		"- Walk references/craft/checklist.md",
	);
	return out.filter((l) => l !== null).join("\n");
}

function persist(ds, page, dir) {
	const slug = (s) => s.toLowerCase().trim().replace(/\s+/g, "-");
	const root = join(dir ?? process.cwd(), "design-system", slug(ds.project));
	mkdirSync(join(root, "pages"), { recursive: true });
	const head =
		"> Page files in `pages/` override this master. Anything they do not mention follows this file.\n\n";
	writeFileSync(join(root, "MASTER.md"), head + toMarkdown(ds));
	const files = [join(root, "MASTER.md")];
	if (page) {
		const ux = search(`${page} ${ds.category}`, "ux", 3).results;
		const body = [
			`# ${page} overrides`,
			"",
			"Only deviations from MASTER.md belong here.",
			"",
			...ux.map((r) => `- ${r.Category}: ${r.Do} (avoid: ${r["Don't"]})`),
		];
		writeFileSync(
			join(root, "pages", `${slug(page)}.md`),
			`${body.join("\n")}\n`,
		);
		files.push(join(root, "pages", `${slug(page)}.md`));
	}
	return files;
}

function formatResults(r) {
	const lines = [
		`## ${r.stack ? `Stack: ${r.stack}` : `Domain: ${r.domain}`} | query: ${r.query} | ${r.results.length} from ${r.file}`,
	];
	r.results.forEach((row, i) => {
		lines.push("", `### ${i + 1}`);
		for (const [k, v] of Object.entries(row)) {
			if (v)
				lines.push(`- **${k}:** ${v.length > 300 ? `${v.slice(0, 300)}…` : v}`);
		}
	});
	return lines.join("\n");
}

const USAGE = `Usage:
  search.mjs "<query>" [-d <domain>] [-n 3] [--json]
  search.mjs "<query>" -s <stack>
  search.mjs "<query>" --design-system [-p "Name"] [-f markdown|json] [--variance 1-10] [--motion 1-10] [--density 1-10]
             [--persist] [--page <name>] [-o <dir>]
  search.mjs --list
Domains: ${Object.keys(DOMAINS).join(", ")}
Stacks: ${STACKS.join(", ")}`;

function cli(argv) {
	const flags = {};
	const pos = [];
	const alias = {
		d: "domain",
		s: "stack",
		n: "max",
		"max-results": "max",
		p: "project",
		"project-name": "project",
		f: "format",
		o: "output",
		"output-dir": "output",
		ds: "design-system",
	};
	const bool = new Set(["json", "design-system", "persist", "list", "help"]);
	for (let i = 0; i < argv.length; i++) {
		const m = /^--?([\w-]+)$/.exec(argv[i]);
		if (!m) {
			pos.push(argv[i]);
			continue;
		}
		const key = alias[m[1]] ?? m[1];
		flags[key] = bool.has(key) ? true : argv[++i];
	}
	if (flags.help || (!pos.length && !flags.list)) return console.log(USAGE);
	if (flags.list) return console.log(USAGE.split("\n").slice(-2).join("\n"));
	const query = pos.join(" ");
	if (flags["design-system"]) {
		const ds = designSystem(query, flags);
		console.log(
			flags.format === "json" ? JSON.stringify(ds, null, 2) : toMarkdown(ds),
		);
		if (flags.persist)
			for (const f of persist(ds, flags.page, flags.output))
				console.error(`wrote ${f}`);
		return;
	}
	if (flags.domain && !DOMAINS[flags.domain])
		throw new Error(`Unknown domain "${flags.domain}".\n${USAGE}`);
	const max = Number(flags.max ?? 3);
	const r = flags.stack
		? searchStack(query, flags.stack, max)
		: search(query, flags.domain, max);
	console.log(flags.json ? JSON.stringify(r, null, 2) : formatResults(r));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
	try {
		cli(process.argv.slice(2));
	} catch (e) {
		console.error(e.message);
		process.exit(1);
	}
}
