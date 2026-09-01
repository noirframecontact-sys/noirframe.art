import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

function parseArgs(argv) {
  const args = { baseUrl: "http://127.0.0.1:8080", outDir: "baseline" };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--base-url") args.baseUrl = argv[++i];
    if (argv[i] === "--out-dir") args.outDir = argv[++i];
  }
  return args;
}

async function waitForMenu(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForTimeout(4500);
  await page.waitForSelector(".menuWrapper, .nfLogo", { timeout: 30000 });
}

async function openNav(page, label) {
  const nav = page.locator("#siteNav");
  const toggle = page.locator("#siteNavToggle");
  if (await toggle.isVisible()) {
    await toggle.click();
    await page.waitForTimeout(400);
  }
  await nav.getByRole("button", { name: label, exact: false }).click();
  await page.waitForSelector(".gallery, .gallery--contact, .gallery--about", {
    timeout: 20000,
  });
  await page.waitForTimeout(800);
}

const shots = [
  { file: "desktop-menu.png", width: 1920, height: 1080, action: "menu" },
  { file: "desktop-about.png", width: 1920, height: 1080, action: "about" },
  { file: "desktop-contact.png", width: 1920, height: 1080, action: "contact" },
  { file: "ipad-menu.png", width: 810, height: 1080, action: "menu" },
  { file: "ipad-about.png", width: 810, height: 1080, action: "about" },
  { file: "mobile-menu.png", width: 412, height: 915, action: "menu" },
  { file: "mobile-contact.png", width: 412, height: 915, action: "contact" },
];

const { baseUrl, outDir } = parseArgs(process.argv);
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext();

for (const shot of shots) {
  const page = await context.newPage();
  page.setDefaultTimeout(45000);
  await page.setViewportSize({ width: shot.width, height: shot.height });

  if (shot.action === "menu") {
    await waitForMenu(page, baseUrl);
  } else if (shot.action === "about") {
    await waitForMenu(page, baseUrl);
    await openNav(page, "About Us");
  } else if (shot.action === "contact") {
    await waitForMenu(page, baseUrl);
    await openNav(page, "Kontakt");
  }

  const target = path.join(outDir, shot.file);
  await page.screenshot({ path: target, fullPage: false });
  console.log(`✔ ${shot.file}`);
  await page.close();
}

await context.close();
await browser.close();
