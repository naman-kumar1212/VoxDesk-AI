/**
 * VoxDesk AI — Standalone Playwright Demo Walkthrough & Screenshot Generator
 *
 * Records a 30–45 second interactive product walkthrough at 1440×900 with deviceScaleFactor 2.
 * Captures 5 high-resolution screenshots:
 *   - demo-assets/hero.png
 *   - demo-assets/active-workflow.png
 *   - demo-assets/result-state.png
 *   - demo-assets/dashboard.png
 *   - demo-assets/mobile-viewport.png
 *
 * Saves the video to: demo-assets/voxdesk-demo.webm
 *
 * Usage:
 *   node scripts/demo.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { chromium } = require('../frontend/node_modules/@playwright/test');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.BASE_URL || 'https://voxdesk-web-lac.vercel.app';
const DEMO_ASSETS_DIR = path.resolve(__dirname, '../demo-assets');
const TEMP_VIDEO_DIR = path.resolve(DEMO_ASSETS_DIR, '.tmp_video');

fs.mkdirSync(DEMO_ASSETS_DIR, { recursive: true });
fs.mkdirSync(TEMP_VIDEO_DIR, { recursive: true });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Injects a visual cursor and a floating caption banner into the browser DOM.
 */
async function injectOverlays(page) {
  await page.evaluate(() => {
    if (document.getElementById('voxdesk-demo-overlays')) return;

    const container = document.createElement('div');
    container.id = 'voxdesk-demo-overlays';
    container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999999;';

    // 1. Subtle, intentional visual cursor
    const cursor = document.createElement('div');
    cursor.id = 'voxdesk-cursor';
    cursor.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid #4338CA;
      background: rgba(67, 56, 202, 0.2);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
      pointer-events: none;
      transform: translate(-100px, -100px);
      transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1), background 0.12s ease;
      z-index: 9999999;
    `;

    // 2. Focused acoustic caption pill
    const caption = document.createElement('div');
    caption.id = 'voxdesk-caption';
    caption.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(17, 24, 39, 0.94);
      color: #F8FAFC;
      border: 1px solid rgba(220, 227, 236, 0.25);
      border-radius: 9999px;
      padding: 7px 18px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 9px;
      box-shadow: 0 10px 25px -4px rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(10px);
      transition: opacity 0.18s ease;
      opacity: 0;
      z-index: 9999998;
    `;

    caption.innerHTML = `
      <span style="width: 8px; height: 8px; border-radius: 50%; background: #0F766E; display: inline-block;"></span>
      <span id="voxdesk-caption-text">VoxDesk AI</span>
    `;

    container.appendChild(cursor);
    container.appendChild(caption);
    document.body.appendChild(container);
  });
}

/**
 * Updates the floating action caption smoothly.
 */
async function setCaption(page, text) {
  await page.evaluate((msg) => {
    const el = document.getElementById('voxdesk-caption');
    const txt = document.getElementById('voxdesk-caption-text');
    if (!el || !txt) return;
    el.style.opacity = '0';
    setTimeout(() => {
      txt.textContent = msg;
      el.style.opacity = '1';
    }, 80);
  }, text);
}

/**
 * Moves the visual cursor and Playwright mouse to target coordinates.
 */
async function moveCursor(page, x, y, steps = 10) {
  await page.evaluate(({ cx, cy }) => {
    const c = document.getElementById('voxdesk-cursor');
    if (c) c.style.transform = `translate(${cx - 10}px, ${cy - 10}px)`;
  }, { cx: x, cy: y });
  await page.mouse.move(x, y, { steps });
}

/**
 * Moves cursor to a selector's center.
 */
async function moveCursorTo(page, selector) {
  try {
    const loc = page.locator(selector).first();
    const box = await loc.boundingBox({ timeout: 3000 });
    if (box) {
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      await moveCursor(page, cx, cy);
      return { x: cx, y: cy };
    }
  } catch {}
  return null;
}

/**
 * Realistic click with cursor movement, hover pause, and click feedback.
 */
async function animatedClick(page, selector) {
  const loc = page.locator(selector).first();
  await loc.waitFor({ state: 'visible', timeout: 5000 });
  await moveCursorTo(page, selector);
  await sleep(120);

  // Quick press animation
  await page.evaluate(() => {
    const c = document.getElementById('voxdesk-cursor');
    if (c) c.style.background = 'rgba(67, 56, 202, 0.6)';
  });
  await sleep(60);

  await loc.click({ delay: 40 });

  await page.evaluate(() => {
    const c = document.getElementById('voxdesk-cursor');
    if (c) c.style.background = 'rgba(67, 56, 202, 0.2)';
  });
  await sleep(100);
}

/**
 * Realistic typing with natural keystroke cadence.
 */
async function animatedType(page, selector, text, speedMs = 18) {
  await animatedClick(page, selector);
  for (const char of text) {
    await page.keyboard.type(char);
    await sleep(speedMs + (Math.random() * 8 - 4));
  }
  await sleep(120);
}

/**
 * Smooth natural scrolling.
 */
async function smoothScroll(page, targetY, durationMs = 800) {
  const steps = 18;
  const delay = durationMs / steps;
  const currentY = await page.evaluate(() => window.scrollY);
  const diff = targetY - currentY;

  for (let i = 1; i <= steps; i++) {
    const nextY = currentY + diff * (i / steps);
    await page.evaluate((y) => window.scrollTo(0, y), nextY);
    await sleep(delay);
  }
}

async function main() {
  console.log('===============================================================');
  console.log(' VoxDesk AI — Standalone Playwright Walkthrough Generator');
  console.log(` Target Site : ${BASE_URL}`);
  console.log(` Output Video: demo-assets/voxdesk-demo.webm`);
  console.log(' Viewport    : 1440×900 @ 2x device scale');
  console.log(' Target Time : 30–45 seconds');
  console.log('===============================================================\n');

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. MOBILE VIEWPORT SCREENSHOT (390×844 @ 2x)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('[Step 1/6] Capturing mobile viewport screenshot...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await sleep(800);
  const mobileScreenshotPath = path.join(DEMO_ASSETS_DIR, 'mobile-viewport.png');
  await mobilePage.screenshot({ path: mobileScreenshotPath });
  console.log(`  ✓ Saved ${mobileScreenshotPath}`);
  await mobileContext.close();

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. MAIN 1440×900 RECORDING CONTEXT (TARGET: 30–45s)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n[Step 2/6] Initializing high-resolution walkthrough recording (1440×900 @ 2x)...');
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    permissions: ['microphone'],
    recordVideo: {
      dir: TEMP_VIDEO_DIR,
      size: { width: 1440, height: 900 },
    },
  });

  const page = await context.newPage();
  const startTime = Date.now();

  try {
    // ── SCENE 1: HERO & VALUE PROPOSITION (0:00 - 0:06) ──────────────────────
    console.log('[Scene 1] Landing Page & Hero Section...');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await injectOverlays(page);
    await setCaption(page, 'Voice-first grievance intake for modern organizations');
    await moveCursor(page, 720, 320);
    await sleep(600);

    console.log('  -> Capturing demo-assets/hero.png');
    const heroPath = path.join(DEMO_ASSETS_DIR, 'hero.png');
    await page.screenshot({ path: heroPath });
    console.log(`  ✓ Saved ${heroPath}`);

    // Quick glance at the acoustic console card and workflow
    await moveCursorTo(page, 'text=Acoustic intake console');
    await sleep(500);

    await setCaption(page, 'Automated pipeline: Speech → Gemini AI → Structured dispatch');
    await smoothScroll(page, 500, 600);
    await sleep(700);

    await smoothScroll(page, 0, 500);
    await sleep(400);

    // ── SCENE 2: CORE AI WORKFLOW — INTAKE (0:06 - 0:14) ─────────────────────
    console.log('[Scene 2] Navigating to Grievance Intake (/report)...');
    await setCaption(page, 'Initiating customer grievance intake...');
    await animatedClick(page, 'a[href="/report"]');
    await page.waitForURL('**/report', { timeout: 8000 });
    await injectOverlays(page);
    await sleep(400);

    await setCaption(page, 'Step 1 — Real-time speech recording with live frequency meter');
    await moveCursorTo(page, 'button[aria-label="Start recording audio complaint"]');
    await sleep(700);

    console.log('  -> Capturing demo-assets/active-workflow.png');
    const activeWorkflowPath = path.join(DEMO_ASSETS_DIR, 'active-workflow.png');
    await page.screenshot({ path: activeWorkflowPath });
    console.log(`  ✓ Saved ${activeWorkflowPath}`);

    // Switch to manual text tab for clear, deterministic demonstration
    await setCaption(page, 'Accessible text mode with real-time intent heuristics');
    await animatedClick(page, 'button:has-text("Manual text")');
    await sleep(300);

    const complaintText =
      'Duplicate charge of $120.00 posted on November 2nd. Please refund the extra billing fee.';
    await animatedType(page, '#manual-transcript', complaintText, 16);
    await sleep(400);

    await setCaption(page, 'Submitting customer grievance for AI categorization...');
    await animatedClick(page, 'button:has-text("Review & submit")');

    // ── SCENE 3: VERIFICATION & GEMINI ROUTING (0:14 - 0:21) ─────────────────
    console.log('[Scene 3] Transcript Verification & Intelligent Routing (/review)...');
    await page.waitForURL('**/review', { timeout: 10000 });
    await injectOverlays(page);
    await sleep(500);

    await setCaption(page, 'Step 2 — Gemini classification & department dispatch preview');
    await moveCursorTo(page, 'text=Detected Category');
    await sleep(600);
    await moveCursorTo(page, 'text=Assigned Department');
    await sleep(500);

    await setCaption(page, 'Confirming ticket registration into atomic database ledger...');
    await animatedClick(page, 'button:has-text("Submit grievance")');

    // ── SCENE 4: RESULT STATE & CONFIRMATION (0:21 - 0:27) ───────────────────
    console.log('[Scene 4] Awaiting Ticket Registration (/confirmation)...');
    await page.waitForURL('**/confirmation', { timeout: 20000 });
    await injectOverlays(page);
    await sleep(700);

    await setCaption(page, 'Step 3 — Atomic ticket stamp & synthesized verbal confirmation');
    await moveCursorTo(page, 'text=Ticket reference');
    await sleep(800);

    console.log('  -> Capturing demo-assets/result-state.png');
    const resultStatePath = path.join(DEMO_ASSETS_DIR, 'result-state.png');
    await page.screenshot({ path: resultStatePath });
    console.log(`  ✓ Saved ${resultStatePath}`);

    await moveCursorTo(page, 'button:has-text("Replay voice"), button:has-text("Pause voice")');
    await sleep(600);

    await setCaption(page, 'Navigating to public ticket lifecycle tracker...');
    await animatedClick(page, 'a:has-text("Track ticket online")');

    // ── SCENE 5: PUBLIC TICKET TRACKING (0:27 - 0:32) ────────────────────────
    console.log('[Scene 5] Public Ticket Tracking (/track)...');
    await page.waitForURL('**/track*', { timeout: 8000 });
    await injectOverlays(page);
    await sleep(700);

    await setCaption(page, 'Public Tracker — Real-time milestone dots & chronological audit log');
    await moveCursorTo(page, 'text=Grievance Status');
    await sleep(600);
    await moveCursorTo(page, 'text=Activity Timeline');
    await sleep(700);

    // ── SCENE 6: ADMIN OPERATIONAL CONSOLE (0:32 - 0:38) ─────────────────────
    console.log('[Scene 6] Administrative Operations Console (/admin)...');
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await injectOverlays(page);
    await sleep(400);

    const emailInput = page.locator('#admin-email');
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await setCaption(page, 'Enterprise access control — Supabase authentication');
      await animatedType(page, '#admin-email', 'admin@voxdesk.ai', 14);
      await sleep(150);
      await animatedType(page, '#admin-password', 'AdminVoxDesk2026!', 14);
      await sleep(200);
      await animatedClick(page, 'button[type="submit"]');
      await page.waitForSelector('text=Total Tickets', { timeout: 12000 }).catch(() => {});
    }

    await injectOverlays(page);
    await sleep(600);
    await setCaption(page, 'Operational overview: 6 live KPIs, queue health & department load');
    await moveCursorTo(page, 'text=Total Tickets');
    await sleep(700);

    console.log('  -> Capturing demo-assets/dashboard.png');
    const dashboardPath = path.join(DEMO_ASSETS_DIR, 'dashboard.png');
    await page.screenshot({ path: dashboardPath });
    console.log(`  ✓ Saved ${dashboardPath}`);

    // Quick hover on Tickets tab to show deep management
    await setCaption(page, 'VoxDesk AI — Exact, calm, voice-first grievance automation');
    await moveCursorTo(page, 'button:has-text("Tickets")');
    await sleep(900);

  } catch (err) {
    console.error('Error during demo walkthrough flow:', err);
  } finally {
    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n[Walkthrough Complete] Elapsed duration: ${elapsedSeconds}s (Target: 30–45s)`);

    const videoObj = page.video();
    await page.close();
    await context.close();
    await browser.close();

    if (videoObj) {
      const rawVideoPath = await videoObj.path();
      const targetVideoPath = path.join(DEMO_ASSETS_DIR, 'voxdesk-demo.webm');
      fs.copyFileSync(rawVideoPath, targetVideoPath);
      const stats = fs.statSync(targetVideoPath);
      console.log(`\n✓ Video recording successfully saved to: ${targetVideoPath}`);
      console.log(`  File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

      // Clean up temp video folder
      try {
        fs.rmSync(TEMP_VIDEO_DIR, { recursive: true, force: true });
      } catch {}
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. DISPLAY GENERATED ARTIFACTS & STANDALONE COMPANION UTILITIES
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n===============================================================');
  console.log(' Playwright Walkthrough & Screenshot Generation Complete!');
  console.log('===============================================================');
  console.log('Generated Artifacts:');
  console.log('  1. demo-assets/voxdesk-demo.webm    (Full high-res video recording)');
  console.log('  2. demo-assets/hero.png             (Hero section @ 2x)');
  console.log('  3. demo-assets/active-workflow.png  (Grievance intake & audio meter @ 2x)');
  console.log('  4. demo-assets/result-state.png     (Ticket stamp & verbal confirmation @ 2x)');
  console.log('  5. demo-assets/dashboard.png        (Admin operational console @ 2x)');
  console.log('  6. demo-assets/mobile-viewport.png  (Mobile viewport 390×844 @ 2x)');
  console.log('\nStandalone Companion Tool:');
  console.log('  Generate animated GIF preview independently:');
  console.log('    python scripts/generate_gif.py    -> demo-assets/voxdesk-demo.gif');
  console.log('\nFFmpeg Commands for Additional Export Formats:');
  console.log('---------------------------------------------------------------');
  console.log('1. Compressed MP4 (Web & Mobile optimized):');
  console.log('   ffmpeg -i demo-assets/voxdesk-demo.webm -c:v libx264 -crf 22 -preset slow -pix_fmt yuv420p -an docs/voxdesk-demo.mp4\n');
  console.log('2. High-framerate animated GIF:');
  console.log('   ffmpeg -i demo-assets/voxdesk-demo.webm -vf "fps=12,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" demo-assets/voxdesk-demo.gif\n');
  console.log('3. Fast 15-second teaser clip:');
  console.log('   ffmpeg -ss 00:00:07 -to 00:00:27 -i demo-assets/voxdesk-demo.webm -vf "fps=15,scale=800:-1:flags=lanczos" demo-assets/voxdesk-teaser.gif');
  console.log('===============================================================\n');
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
