// Usage: node states.mjs <base> <outDir> <linkText>
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const [, , base, outDir, linkText] = process.argv;
if (!base || !outDir || !linkText) {
  console.error("usage: node states.mjs <base> <outDir> <linkText>");
  process.exit(1);
}
const RPC = process.env.RPC_GLOB ?? "**/_serverFn/**";
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.addInitScript(() => sessionStorage.setItem("intro", "1"));
await page.goto(base, { waitUntil: "networkidle" });

await page.route(RPC, async (r) => {
  await new Promise((res) => setTimeout(res, 2500));
  await r.continue().catch(() => {});
});
await page.getByText(linkText, { exact: true }).first().click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/pending-400ms.png` });
await page.waitForTimeout(700);
await page.screenshot({ path: `${outDir}/pending-1100ms.png` });
await page.waitForTimeout(2500);
await page.unroute(RPC);

await page.goto(base, { waitUntil: "networkidle" });
await page.route(RPC, (r) => r.fulfill({ status: 500, body: "boom" }));
await page.getByText(linkText, { exact: true }).first().click();
await page.waitForTimeout(1500);
await page.screenshot({ path: `${outDir}/error.png` });
await page.unroute(RPC);

await page.goto(`${base}/this-route-does-not-exist`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.screenshot({ path: `${outDir}/not-found.png` });
await browser.close();
console.log("states saved to", outDir);
