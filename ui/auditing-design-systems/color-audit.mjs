#!/usr/bin/env node
/**
 * Dependency-free colour measurement for design-system audits.
 * Accepts #rgb, #rrggbb, #rrggbbaa, oklch(L C H) with L as 0..1 or a percentage.
 *
 *   node color-audit.mjs contrast "#90c600" "#ffffff"
 *   node color-audit.mjs gamut 126
 *   node color-audit.mjs cvd "#90c600" "#ef4444"
 *   node color-audit.mjs palette "#fff" "#eaffd0" "oklch(0.52 0.2 264)"
 *   node color-audit.mjs tokens path/to/tokens.css
 */

import { readFileSync } from "node:fs";

// --- colour space ---
const srgbToLinear = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const linearToSrgb = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const clamp01 = (v) => Math.max(0, Math.min(1, v));

function oklchToLinear(L, C, H) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function linearToOklch([r, g, b]) {
  const cb = Math.cbrt;
  const l = cb(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = cb(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = cb(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L, C: Math.hypot(A, B), H };
}

/** Parse a colour string to linear-light RGB. Throws on unrecognised input. */
export function parse(input) {
  const str = String(input).trim();
  const ok = str.match(/^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)/i);
  if (ok) {
    const L = ok[1].endsWith("%") ? Number.parseFloat(ok[1]) / 100 : Number.parseFloat(ok[1]);
    return oklchToLinear(L, Number.parseFloat(ok[2]), Number.parseFloat(ok[3]));
  }
  let h = str.replace(/^#/, "");
  if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
  if (h.length !== 6 && h.length !== 8) throw new Error(`Cannot parse colour: ${input}`);
  const [r, g, b] = [0, 2, 4].map((i) => srgbToLinear(Number.parseInt(h.slice(i, i + 2), 16) / 255));
  if ([r, g, b].some(Number.isNaN)) throw new Error(`Cannot parse colour: ${input}`);
  return [r, g, b];
}

export const toHex = (lin) => {
  const t = (v) => Math.round(clamp01(linearToSrgb(v)) * 255).toString(16).padStart(2, "0");
  return `#${lin.map(t).join("")}`;
};

/** WCAG 2.x relative luminance. */
export const luminance = (lin) => {
  const [r, g, b] = lin.map(clamp01);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** WCAG 2.x contrast ratio, 1..21. */
export function contrast(a, b) {
  const [x, y] = [luminance(parse(a)), luminance(parse(b))];
  const [hi, lo] = x > y ? [x, y] : [y, x];
  return (hi + 0.05) / (lo + 0.05);
}

const inGamut = (L, C, H) => oklchToLinear(L, C, H).map(linearToSrgb).every((v) => v >= -0.002 && v <= 1.002);

/** Largest in-sRGB chroma for a lightness/hue. The "can this hue be both dark and vivid" test. */
export function maxChroma(L, H) {
  let C = 0.4;
  while (C > 0 && !inGamut(L, C, H)) C -= 0.002;
  return Math.max(0, C);
}

// --- colour-vision deficiency (Vienot 1999, applied in linear light) ---
const RGB_TO_LMS = [
  [17.8824, 43.5161, 4.11935],
  [3.45565, 27.1554, 3.86714],
  [0.0299566, 0.184309, 1.46709],
];
const LMS_TO_RGB = [
  [0.0809444479, -0.130504409, 0.116721066],
  [-0.0102485335, 0.0540193266, -0.113614708],
  [-0.000365296938, -0.00412161469, 0.693511405],
];
const SIMS = {
  protan: [[0, 2.02344, -2.52581], [0, 1, 0], [0, 0, 1]],
  deutan: [[1, 0, 0], [0.494207, 0, 1.24827], [0, 0, 1]],
  tritan: [[1, 0, 0], [0, 1, 0], [-0.395913, 0.801109, 0]],
};
const mul = (M, v) => M.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);

export function simulate(lin, kind) {
  if (kind === "normal") return lin;
  return mul(LMS_TO_RGB, mul(SIMS[kind], mul(RGB_TO_LMS, lin.map(clamp01)))).map(clamp01);
}

/** Perceptual distance in OKLab. Below ~0.10 two colours risk reading as one. */
export function deltaE(a, b) {
  const A = linearToOklch(a.map(clamp01));
  const B = linearToOklch(b.map(clamp01));
  const toLab = ({ L, C, H }) => [L, C * Math.cos((H * Math.PI) / 180), C * Math.sin((H * Math.PI) / 180)];
  const [l1, a1, b1] = toLab(A);
  const [l2, a2, b2] = toLab(B);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

// --- CLI ---
const FLOORS = { text: 4.5, large: 3, ui: 3 };
const pad = (s, n) => String(s).padEnd(n);
const fmt = (n, d = 2) => n.toFixed(d).padStart(6);

function cmdContrast(a, b) {
  const v = contrast(a, b);
  const verdict = v >= 4.5 ? "AA text" : v >= 3 ? "UI / large text only" : "FAIL";
  console.log(`${toHex(parse(a))} on ${toHex(parse(b))}  ${fmt(v)}:1  ${verdict}`);
  console.log(`  body text needs ${FLOORS.text}  |  focus ring, control boundary, meaningful icon needs ${FLOORS.ui}`);
}

function cmdGamut(hue) {
  const H = Number.parseFloat(hue);
  console.log(`Max in-sRGB chroma at hue ${H}, with contrast against white and black:\n`);
  console.log("  L     maxC    hex        vs #fff   vs #000");
  for (let L = 0.9; L >= 0.3; L -= 0.05) {
    const C = maxChroma(L, H);
    const hex = toHex(oklchToLinear(L, C, H));
    console.log(`  ${L.toFixed(2)}  ${C.toFixed(3)}  ${hex}  ${fmt(contrast(hex, "#ffffff"))}  ${fmt(contrast(hex, "#000000"))}`);
  }
  console.log("\n  A hue that never reaches 4.5:1 on white while keeping its chroma cannot");
  console.log("  serve as body text or a light-mode accent. Pick another hue.");
}

function cmdCvd(a, b) {
  const [A, B] = [parse(a), parse(b)];
  console.log(`Separation between ${toHex(A)} and ${toHex(B)}:\n`);
  console.log(`  WCAG luminance contrast   ${fmt(contrast(a, b))}:1`);
  for (const kind of ["normal", "protan", "deutan", "tritan"]) {
    const d = deltaE(simulate(A, kind), simulate(B, kind));
    console.log(`  ${pad(kind, 8)} OKLab dE      ${fmt(d, 3)}  ${d < 0.1 ? "COLLISION RISK" : ""}`);
  }
  console.log("\n  Two controls must differ by 3:1 in luminance OR stay above ~0.10 dE in every row.");
}

function cmdPalette(colors) {
  console.log("  swatch     hex        L      C      H     tier      notes");
  const seen = [];
  for (const c of colors) {
    const lin = parse(c);
    const { L, C, H } = linearToOklch(lin.map(clamp01));
    const hex = toHex(lin);
    const tier = C < 0.02 ? "neutral" : C <= 0.07 ? "tinted" : C <= 0.15 ? "vivid" : "HOT";
    const dupe = seen.find((s) => deltaE(parse(s), lin) < 0.05);
    const notes = [tier === "HOT" ? "chroma >0.15" : "", dupe ? `~duplicate of ${dupe}` : ""].filter(Boolean).join("; ");
    console.log(`  ${pad(c.slice(0, 9), 10)} ${hex}  ${L.toFixed(2)}  ${C.toFixed(3)}  ${String(Math.round(H)).padStart(3)}   ${pad(tier, 8)}  ${notes}`);
    seen.push(c);
  }
  console.log("\n  Backdrops and large fills belong in neutral/tinted. Reserve vivid for accents.");
}

function cmdTokens(file) {
  const src = readFileSync(file, "utf8");
  const tokens = new Map();
  for (const m of src.matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8}|oklch\([^)]+\))/g)) {
    if (!tokens.has(m[1])) tokens.set(m[1], m[2]);
  }
  if (!tokens.size) return console.log(`No literal colour tokens found in ${file}`);
  console.log(`${tokens.size} colour tokens in ${file}\n`);
  const get = (n) => tokens.get(n);
  const pairs = [
    ["--foreground", "--background", FLOORS.text, "body text"],
    ["--primary-foreground", "--primary", FLOORS.text, "primary button label"],
    ["--muted-foreground", "--background", FLOORS.text, "secondary text"],
    ["--destructive-foreground", "--destructive", FLOORS.text, "destructive label"],
    ["--primary", "--background", FLOORS.ui, "focus ring / accent on canvas"],
    ["--ring", "--background", FLOORS.ui, "focus ring"],
    // Decorative hairlines are exempt from 1.4.11; this only matters where the
    // border is the sole thing identifying a control (inputs, checkboxes).
    ["--border", "--background", FLOORS.ui, "border (if it identifies a control)"],
    ["--input", "--background", FLOORS.ui, "input boundary"],
  ];
  let failures = 0;
  for (const [fg, bg, floor, label] of pairs) {
    if (!get(fg) || !get(bg)) continue;
    const v = contrast(get(fg), get(bg));
    const ok = v >= floor;
    if (!ok) failures++;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${pad(label, 32)} ${fmt(v)}:1  (need ${floor})  ${fg} on ${bg}`);
  }
  console.log(`\n  ${failures} failing pair(s). Unresolved var() references are skipped — inline them to test.`);
}

const [cmd, ...rest] = process.argv.slice(2);
try {
  if (cmd === "contrast") cmdContrast(rest[0], rest[1]);
  else if (cmd === "gamut") cmdGamut(rest[0]);
  else if (cmd === "cvd") cmdCvd(rest[0], rest[1]);
  else if (cmd === "palette") cmdPalette(rest);
  else if (cmd === "tokens") cmdTokens(rest[0]);
  else {
    console.log("Commands: contrast <a> <b> | gamut <hue> | cvd <a> <b> | palette <colours...> | tokens <file.css>");
    process.exit(1);
  }
} catch (err) {
  console.error(`error: ${err.message}`);
  process.exit(1);
}
