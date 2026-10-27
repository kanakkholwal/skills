#!/usr/bin/env node
// Checks every SKILL.md against the Agent Skills spec (agentskills.io/specification).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";

const ROOT = process.cwd();
const SKIP = new Set([".git", "node_modules"]);
const ALLOWED_KEYS = new Set([
	"name",
	"description",
	"license",
	"compatibility",
	"metadata",
	"allowed-tools",
]);
const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const walk = (dir) =>
	readdirSync(dir).flatMap((f) => {
		const p = join(dir, f);
		if (SKIP.has(f)) return [];
		return statSync(p).isDirectory() ? walk(p) : [p];
	});

// Only top-level scalar keys matter here; nested metadata values are not inspected.
function parseFrontmatter(text) {
	const m = text.match(/^---\n([\s\S]*?)\n---\n/);
	if (!m) return null;
	const keys = {};
	let current = null;
	for (const line of m[1].split("\n")) {
		const top = line.match(/^([A-Za-z][\w-]*):\s?(.*)$/);
		if (top) {
			current = top[1];
			keys[current] = top[2];
		} else if (current && /^\s+\S/.test(line)) {
			keys[current] += `\n${line.trim()}`;
		}
	}
	return keys;
}

const problems = [];
const skills = walk(ROOT).filter((f) => basename(f) === "SKILL.md");
for (const file of skills) {
	const rel = relative(ROOT, file);
	const dir = dirname(file);
	const text = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
	const fm = parseFrontmatter(text);
	const fail = (msg) => problems.push(`${rel}: ${msg}`);
	if (!fm) {
		fail("missing frontmatter, or frontmatter does not start on line 1");
		continue;
	}
	// Strict loaders expect a key on the line right after the opening fence.
	if (/^---\n\s*\n/.test(text)) fail("blank line at the start of frontmatter");
	for (const key of Object.keys(fm))
		if (!ALLOWED_KEYS.has(key)) fail(`non-standard frontmatter key "${key}"`);
	const name = (fm.name ?? "").trim();
	if (!NAME.test(name) || name.length > 64) fail(`invalid name "${name}"`);
	if (name !== basename(dir))
		fail(`name "${name}" does not match folder "${basename(dir)}"`);
	const description = (fm.description ?? "")
		.replace(/^[|>]-?\n?/, "")
		.replace(/^"|"$/g, "")
		.trim();
	if (!description) fail("empty description");
	if (description.length > 1024)
		fail(`description is ${description.length} chars (max 1024)`);
	if (fm.compatibility && fm.compatibility.length > 500)
		fail("compatibility over 500 chars");

	const bodyLines = text.split("\n").length;
	if (bodyLines > 500)
		console.warn(`warn ${rel}: ${bodyLines} lines (spec recommends under 500)`);

	for (const md of walk(dir).filter((f) => f.endsWith(".md"))) {
		const body = readFileSync(md, "utf8").replace(/```[\s\S]*?```/g, "");
		for (const [, target] of body.matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)) {
			if (/^[a-z]+:/i.test(target)) continue;
			if (!existsSync(join(dirname(md), target)))
				problems.push(`${relative(ROOT, md)}: broken link ${target}`);
		}
	}
}

for (const p of problems) console.log(p);
console.log(`${skills.length} skills checked, ${problems.length} problem(s)`);
process.exit(problems.length ? 1 : 0);
