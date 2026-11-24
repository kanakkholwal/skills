#!/usr/bin/env node
// Static scan for generated-UI tells. "fix" hits are defects; "check" hits need a human call.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const EXT = new Set([
	".css",
	".scss",
	".html",
	".jsx",
	".tsx",
	".js",
	".ts",
	".vue",
	".svelte",
	".astro",
	".mdx",
]);
const SKIP = new Set([
	"node_modules",
	".git",
	"dist",
	"build",
	".next",
	".svelte-kit",
	".astro",
	".output",
	"coverage",
	"vendor",
]);
const MARKUP = /\.(html|jsx|tsx|vue|svelte|astro|mdx)$/;

// [id, level, regex, message, fix, markupOnly]
const RULES = [
	[
		"vh-unit",
		"fix",
		/(?<![\w-])100vh\b|\b(min-)?h-screen\b/,
		"100vh jumps under mobile browser chrome",
		"100dvh (or svh for fixed heroes); Tailwind h-dvh",
	],
	[
		"transition-all",
		"fix",
		/transition:\s*all\b|\btransition-all\b/,
		"transition: all animates layout and colour by accident",
		"name the properties",
	],
	[
		"scale-zero",
		"fix",
		/scale\(0\)|\bscale-0\b|scale:\s*0[,\s}]/,
		"entering from scale(0) looks like it appears from nowhere",
		"scale(0.95) + opacity 0",
	],
	[
		"ease-in",
		"fix",
		/\bease-in\b(?!-out)|cubic-bezier\(0\.4,\s*0,\s*1,\s*1\)/,
		"ease-in delays the moment the user watches",
		"ease-out for enter/exit, ease-in-out for on-screen moves",
	],
	[
		"layout-anim",
		"fix",
		/transition(-property)?:[^;]*\b(width|height|top|left|right|bottom|margin|padding)\b/,
		"animating layout properties janks",
		"transform and opacity",
	],
	[
		"zoom-lock",
		"fix",
		/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\.0)?\b/,
		"disables pinch zoom (WCAG 1.4.4)",
		"remove it",
	],
	[
		"outline-none",
		"fix",
		/^(?!.*focus-visible).*(outline:\s*(none|0)\b|\boutline-none\b)/,
		"focus ring removed",
		"pair with a :focus-visible ring",
	],
	[
		"gradient-text",
		"fix",
		/background-clip:\s*text|\bbg-clip-text\b/,
		"gradient text on headings or metrics",
		"solid colour; let size and weight carry emphasis",
	],
	[
		"instrument-serif",
		"fix",
		/Instrument[\s_+-]?Serif/i,
		"Instrument Serif is the default AI-landing display face",
		"pick a face for this brand (search.mjs -d google-fonts)",
	],
	[
		"crushed-tracking",
		"fix",
		/letter-spacing:\s*-0\.(0[4-9]|[1-9])|\btracking-tighter\b/,
		"tracking tighter than -0.03em crushes letters",
		"-0.01 to -0.02em on display sizes only",
	],
	[
		"bounce-ease",
		"fix",
		/\banimate-bounce\b|bounce:\s*0\.[4-9]|\b(elastic|bounce)\.(in|out)|back\.out\(\s*[2-9]/,
		"bouncy easing on everyday UI",
		"ease-out curve; springs only for gestures, bounce <= 0.2",
	],
	[
		"em-dash",
		"fix",
		/\u2014|\u2013/,
		"em/en dash in UI copy",
		"comma, colon, full stop or parentheses",
		true,
	],
	[
		"three-dots",
		"fix",
		/[A-Za-z]\.\.\.(?=[\s<"'`]|$)/,
		"three periods instead of an ellipsis",
		"use …",
		true,
	],
	[
		"headline-period",
		"fix",
		/<h[12][^>]*>.*[^.]\.\s*<\/h[12]>/,
		"full stop at the end of a headline",
		"drop it",
		true,
	],
	[
		"italic-heading",
		"check",
		/<h[1-3][^>]*>.*?<(em|i)\b|<h[1-3][^>]*\bitalic\b/,
		"italic word inside a headline",
		"set it roman unless it is a real title or term",
		true,
	],
	[
		"eyebrow",
		"check",
		/\buppercase\b.*\b(tracking-(wide|wider|widest)|text-(xs|\[1[01]px\]))\b|\b(tracking-(wide|wider|widest)|text-xs)\b.*\buppercase\b|text-transform:\s*uppercase[^}]*letter-spacing/,
		"tiny tracked all-caps label (eyebrow/kicker)",
		"delete it or fold the fact into the headline",
	],
	[
		"pill-chip",
		"check",
		/\brounded-full\b(?=.*\btext-(xs|\[1[01]px\])\b)(?=.*\bpx-\d)/,
		"small pill chip",
		"keep only for filters, status or toggles",
	],
	[
		"section-number",
		"check",
		/>\s*0[1-9]\s*[./\u2014-]?\s*</,
		"numbered section marker (01, 02)",
		"only for real sequences",
		true,
	],
	[
		"gradient-bg",
		"check",
		/\b(bg-gradient-to|bg-linear-to|bg-radial)\b|background(-image)?:[^;]*(linear|radial|conic)-gradient/,
		"gradient background",
		"only when it is the chosen direction",
	],
	[
		"gradient-space",
		"check",
		/(linear|radial|conic)-gradient\((?![^)]*\bin\s+oklch)/,
		"gradient interpolated in sRGB greys out mid-way",
		"linear-gradient(in oklch, ...)",
	],
	[
		"ai-purple",
		"check",
		/\b(from|via|to)-(purple|violet|indigo|fuchsia)-\d{3}\b/,
		"purple/violet gradient stop",
		"derive from the brand hue",
	],
	[
		"glow",
		"check",
		/box-shadow:[^;]*\b0\s+0\s+\d{2,}px|\bshadow-(purple|violet|indigo|cyan|fuchsia|pink|blue)-\d{3}/,
		"coloured glow shadow",
		"lighter surface for depth in dark mode",
	],
	[
		"glass",
		"check",
		/backdrop-filter:\s*blur|\bbackdrop-blur(-\w+)?\b/,
		"frosted glass",
		"only for a real layering problem (sheet over content)",
	],
	[
		"hex-border",
		"check",
		/border(-(top|right|bottom|left|color))?:[^;]*#[\da-f]{3,6}\b|\bborder-(gray|slate|zinc|neutral|stone)-\d{3}\b/i,
		"opaque border colour",
		"alpha border (oklch(0 0 0 / 0.08) or border-black/10)",
	],
	[
		"hsl",
		"check",
		/\bhsla?\(/,
		"HSL lightness is not perceptual",
		"author in oklch()",
	],
	[
		"big-radius",
		"check",
		/border-radius:\s*(2[4-9]|[3-9]\d)px|\brounded-(3xl|\[(2[4-9]|[3-9]\d)px\])/,
		"card radius 24px+",
		"12-16px; nested radius = outer - padding",
	],
	[
		"straight-quotes",
		"check",
		/>[^<>{}]*([A-Za-z]'[A-Za-z]|\s"[A-Za-z]|[A-Za-z]"\s)/,
		"straight quotes or apostrophe in visible copy",
		"curly quotes and \u2019",
		true,
	],
	[
		"underline-skip",
		"check",
		/^(?!.*underline-offset).*(\bunderline\b(?!-offset)|text-decoration:\s*underline)/,
		"underline without text-underline-offset (clipped by descenders)",
		"text-underline-offset: 0.15em",
	],
	[
		"no-fluid-type",
		"check",
		/@media[^{]*\{[^}]*\bh1\b[^}]*font-size/,
		"headline size jumps at a breakpoint",
		"clamp() for a fluid size",
	],
	[
		"sub-sup",
		"check",
		/<(sub|sup)\b/,
		"sub or sup stretches the line box",
		"sub, sup { line-height: 0 }",
		true,
	],
	[
		"hover-lift",
		"check",
		/hover:-translate-y-|:hover[^{]*\{[^}]*translateY\(-/,
		"hover lift on cards",
		"raise contrast instead; keep layout still",
	],
	[
		"emoji-icon",
		"check",
		/\p{Extended_Pictographic}/u,
		"emoji used as an icon",
		"one SVG icon set, stroke matched to text weight",
		true,
	],
];

const files = [];
function walk(dir) {
	for (const name of readdirSync(dir)) {
		if (SKIP.has(name) || name.startsWith(".")) continue;
		const p = join(dir, name);
		if (statSync(p).isDirectory()) walk(p);
		else if (EXT.has(extname(name)) && !/\.(min|d)\.\w+$/.test(name))
			files.push(p);
	}
}

const args = process.argv.slice(2);
const json = args.includes("--json");
const onlyFix = args.includes("--fix-only");
const roots = args.filter((a) => !a.startsWith("--"));
for (const r of roots.length ? roots : ["."])
	statSync(r).isDirectory() ? walk(r) : files.push(r);

const hits = [];
let animates = false;
let reducesMotion = false;
const monoCount = new Map();
for (const file of files) {
	const text = readFileSync(file, "utf8");
	if (/@keyframes|animation:|transition:|\banimate-|\btransition-/.test(text))
		animates = true;
	if (/prefers-reduced-motion|motion-reduce|useReducedMotion/.test(text))
		reducesMotion = true;
	const mono = (text.match(/\bfont-mono\b|font-family:[^;]*mono/gi) ?? [])
		.length;
	if (mono > 4) monoCount.set(file, mono);
	text.split(/\r?\n/).forEach((line, i) => {
		if (line.length > 2000 || /slop-scan-ignore/.test(line)) return;
		for (const [id, level, re, message, fix, markupOnly] of RULES) {
			if (markupOnly && !MARKUP.test(file)) continue;
			if (onlyFix && level !== "fix") continue;
			if (re.test(line))
				hits.push({
					id,
					level,
					file: relative(".", file),
					line: i + 1,
					message,
					fix,
				});
		}
	});
}
if (animates && !reducesMotion)
	hits.push({
		id: "reduced-motion",
		level: "fix",
		file: "(repo)",
		line: 0,
		message: "animation without any prefers-reduced-motion handling",
		fix: "add a reduced variant with the animation",
	});
if (!onlyFix)
	for (const [file, n] of monoCount)
		hits.push({
			id: "mono-overuse",
			level: "check",
			file: relative(".", file),
			line: 0,
			message: `${n} monospace uses`,
			fix: "mono only for code, IDs and aligned figures",
		});

if (json) console.log(JSON.stringify(hits, null, 2));
else {
	const byRule = Map.groupBy(hits, (h) => h.id);
	for (const [id, list] of byRule) {
		const { level, message, fix } = list[0];
		console.log(`\n[${level}] ${id}: ${message} -> ${fix} (${list.length})`);
		for (const h of list.slice(0, 15))
			console.log(`  ${h.file}${h.line ? `:${h.line}` : ""}`);
		if (list.length > 15) console.log(`  ...and ${list.length - 15} more`);
	}
	const fixes = hits.filter((h) => h.level === "fix").length;
	console.log(
		`\n${files.length} files, ${fixes} fix, ${hits.length - fixes} check. Silence a line with a "slop-scan-ignore" comment.`,
	);
}
process.exit(hits.some((h) => h.level === "fix") ? 1 : 0);
