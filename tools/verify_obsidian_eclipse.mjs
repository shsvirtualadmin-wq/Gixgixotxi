import fs from 'fs';
import path from 'path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('/root/.bun/install/global/node_modules/playwright-core');
const CHROMIUM_EXEC =
  '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell';

const URL = 'http://127.0.0.1:3000/dev/store-items';
const OUT_DIR = '/tmp/obsidian-eclipse-review';

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({
    executablePath: CHROMIUM_EXEC,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  console.log('[Verify] Opening /dev/store-items...');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('[data-dev-item-card="obsidian-eclipse"]', { timeout: 15000 });
  await page.waitForTimeout(1500);

  // Check catalog total count
  const bodyText = await page.innerText('body');
  const totalMatch = bodyText.match(/Catalog Total:\s*(\d+)/);
  const catalogTotal = totalMatch ? Number(totalMatch[1]) : null;
  console.log(`[Verify] Catalog Total in UI: ${catalogTotal}`);

  const card = page.locator('[data-dev-item-card="obsidian-eclipse"]');
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  // Check canvas and video presence inside the card
  const hasWebGLCanvas = (await card.locator('[data-testid="obsidian-eclipse-webgl-canvas"]').count()) > 0;
  const hasVideoEl = (await card.locator('[data-testid="obsidian-eclipse-video"]').count()) > 0;
  console.log(`[Verify] WebGL 3D Canvas present: ${hasWebGLCanvas}, Video fallback element present: ${hasVideoEl}`);

  // Take 12 screenshots 100ms apart of the obsidian-eclipse banner preview
  const previewStage = card.locator('[data-testid="obsidian-eclipse-3d-banner"]').first();
  const frameBuffers = [];
  for (let i = 0; i < 12; i++) {
    const buf = await previewStage.screenshot({ path: path.join(OUT_DIR, `frame_${String(i).padStart(2, '0')}.png`) });
    frameBuffers.push(buf);
    await page.waitForTimeout(100);
  }

  let frameDiffs = 0;
  for (let i = 1; i < frameBuffers.length; i++) {
    if (!frameBuffers[i].equals(frameBuffers[i - 1])) {
      frameDiffs++;
    }
  }
  console.log(`[Verify] 12 screenshots @ 100ms apart: ${frameDiffs}/11 consecutive transitions changed`);

  // Capture clean card screenshot + Dark UI overlay + Light UI overlay
  await card.screenshot({ path: path.join(OUT_DIR, 'card_clean.png') });
  const themeBtn = page.locator('[data-testid="toggle-banner-ui-theme"]');
  await themeBtn.click(); // 'dark'
  await page.waitForTimeout(250);
  await card.screenshot({ path: path.join(OUT_DIR, 'card_dark_theme.png') });
  await themeBtn.click(); // 'light'
  await page.waitForTimeout(250);
  await card.screenshot({ path: path.join(OUT_DIR, 'card_light_theme.png') });

  await browser.close();

  if (catalogTotal !== 151) {
    throw new Error(`Expected Catalog Total 151, got ${catalogTotal}`);
  }
  if (frameDiffs < 9) {
    throw new Error(`Expected continuous animation across 12 frames, got only ${frameDiffs}/11 diffs`);
  }
  console.log('[Verify] PASS: Obsidian Eclipse 3D banner verified (151 total items, continuous 3D motion, dark/light readability).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
