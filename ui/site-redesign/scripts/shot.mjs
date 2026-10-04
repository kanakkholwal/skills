// Usage: node shot.mjs <base> <outDir> home projects/foo ...
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const [, , base, outDir, ...paths] = process.argv;
if (!base || !outDir || !paths.length) {
  console.error("usage: node shot.mjs <base> <outDir> <route...>");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
for (const theme of (process.env.THEMES ?? "light").split(",")) {
  for (const width of (process.env.WIDTHS ?? "1280").split(",").map(Number)) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
    page.on("console", (m) => m.type() === "error" && console.log("CONSOLE", m.text().slice(0, 300)));
    // next-themes and most theme stores read this key; the intro is skipped so shots show the page.
    await page.addInitScript((t) => {
      localStorage.setItem("theme", t);
      sessionStorage.setItem("intro", "1");
    }, theme);
    for (const p of paths) {
      const url = `${base}/${p === "home" ? "" : p}`;
      await page.goto(url, { waitUntil: "networkidle", timeout: 90000 }).catch((e) => console.log("GOTO", p, e.message));
      await page.waitForTimeout(1200);
      const name = `${outDir}/${p.replace(/\W+/g, "_") || "home"}-${theme}-${width}.png`;
      await page.screenshot({ path: name, fullPage: process.env.FULL !== "0" });
      console.log("shot", name);
    }
    await ctx.close();
  }
}
await browser.close();
