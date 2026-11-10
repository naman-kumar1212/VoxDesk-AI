/**
 * VoxDesk AI — Playwright Product Walkthrough & Asset Generator
 *
 * Records a 35–45 second interactive product walkthrough at 1440×900 with deviceScaleFactor 2.
 * Captures the 11 high-resolution screenshots required by documentation:
 *   - demo-assets/hero.png
 *   - demo-assets/voice-recording.png
 *   - demo-assets/transcript-review.png
 *   - demo-assets/ticket-confirmation.png
 *   - demo-assets/public-tracking.png
 *   - demo-assets/admin-dashboard.png
 *   - demo-assets/admin-tickets.png
 *   - demo-assets/admin-analytics.png
 *   - demo-assets/admin-departments.png
 *   - demo-assets/admin-users.png
 *   - demo-assets/mobile-viewport.png
 *
 * Saves raw video to: demo-assets/voxdesk-demo.webm
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

const BASE_URL = process.env.BASE_URL || 'http://localhost:4173';
const DEMO_ASSETS_DIR = path.resolve(__dirname, '../demo-assets');
const TEMP_VIDEO_DIR = path.resolve(DEMO_ASSETS_DIR, '.tmp_video');

fs.mkdirSync(DEMO_ASSETS_DIR, { recursive: true });
fs.mkdirSync(TEMP_VIDEO_DIR, { recursive: true });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Injects a visual cursor and a floating caption banner into the browser DOM
 * adhering to the Stripe Design System styling.
 */
async function injectOverlays(page) {
  await page.evaluate(() => {
    if (document.getElementById('voxdesk-demo-overlays')) return;

    const container = document.createElement('div');
    container.id = 'voxdesk-demo-overlays';
    container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999999;';

    // 1. Stripe Violet Visual Cursor
    const cursor = document.createElement('div');
    cursor.id = 'voxdesk-cursor';
    cursor.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 2px solid #533AFD;
      background: rgba(83, 58, 253, 0.24);
      box-shadow: 0 4px 16px rgba(83, 58, 253, 0.35);
      pointer-events: none;
      transform: translate(-100px, -100px);
      transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), background 0.12s ease;
      z-index: 9999999;
    `;

    // 2. Stripe Deep Ink Caption Pill
    const caption = document.createElement('div');
    caption.id = 'voxdesk-caption';
    caption.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(6, 27, 49, 0.94);
      color: #FFFFFF;
      border: 1px solid rgba(227, 236, 247, 0.3);
      border-radius: 9999px;
      padding: 8px 20px;
      font-family: 'Sohne', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 12px 30px rgba(6, 27, 49, 0.35);
      backdrop-filter: blur(12px);
      transition: opacity 0.16s ease;
      opacity: 0;
      z-index: 9999998;
    `;

    caption.innerHTML = `
      <span style="width: 8px; height: 8px; border-radius: 50%; background: #00D66F; box-shadow: 0 0 8px #00D66F; display: inline-block;"></span>
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
    }, 70);
  }, text);
}

/**
 * Moves the visual cursor and Playwright mouse to target coordinates.
 */
async function moveCursor(page, x, y, steps = 10) {
  await page.evaluate(({ cx, cy }) => {
    const c = document.getElementById('voxdesk-cursor');
    if (c) c.style.transform = `translate(${cx - 11}px, ${cy - 11}px)`;
  }, { cx: x, cy: y });
  await page.mouse.move(x, y, { steps });
}

/**
 * Moves cursor to a selector's center.
 */
async function moveCursorTo(page, selector) {
  try {
    const loc = page.locator(selector).first();
    const box = await loc.boundingBox({ timeout: 2500 });
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
  await sleep(100);

  // Quick press animation
  await page.evaluate(() => {
    const c = document.getElementById('voxdesk-cursor');
    if (c) c.style.background = 'rgba(83, 58, 253, 0.6)';
  });
  await sleep(50);

  await loc.click({ delay: 35 });

  await page.evaluate(() => {
    const c = document.getElementById('voxdesk-cursor');
    if (c) c.style.background = 'rgba(83, 58, 253, 0.24)';
  });
  await sleep(80);
}

/**
 * Realistic typing with natural keystroke cadence.
 */
async function animatedType(page, selector, text, speedMs = 15) {
  await animatedClick(page, selector);
  for (const char of text) {
    await page.keyboard.type(char);
    await sleep(speedMs + (Math.random() * 6 - 3));
  }
  await sleep(100);
}

/**
 * Smooth natural scrolling.
 */
async function smoothScroll(page, targetY, durationMs = 700) {
  const steps = 16;
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
  console.log(' VoxDesk AI — Stripe Design System Walkthrough Suite');
  console.log(` Target Site : ${BASE_URL}`);
  console.log(' Viewport    : 1440×900 @ 2x device scale');
  console.log(' Output Video: demo-assets/voxdesk-demo.webm');
  console.log(' Target Time : 35–45 seconds');
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
  console.log('[Step 1/12] Capturing mobile-viewport.png (390×844 @ 2x)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await sleep(800);
  const mobilePath = path.join(DEMO_ASSETS_DIR, 'mobile-viewport.png');
  await mobilePage.screenshot({ path: mobilePath });
  console.log(`  ✓ Saved ${mobilePath}`);
  await mobileContext.close();

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. MAIN 1440×900 RECORDING CONTEXT (TARGET: 35–45s)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n[Step 2/12] Initializing high-resolution walkthrough recording (1440×900 @ 2x)...');
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
    await setCaption(page, 'Voice-first customer grievance automation for modern enterprise');
    await moveCursor(page, 720, 320);
    await sleep(600);

    console.log('  -> Capturing demo-assets/hero.png');
    const heroPath = path.join(DEMO_ASSETS_DIR, 'hero.png');
    await page.screenshot({ path: heroPath });
    console.log(`  ✓ Saved ${heroPath}`);

    // Quick glance at acoustic intake console card and workflow
    await moveCursorTo(page, 'text=Acoustic intake console');
    await sleep(400);

    await setCaption(page, 'Automated pipeline: Speech → Groq Whisper → Gemini classification');
    await smoothScroll(page, 520, 500);
    await sleep(600);

    await smoothScroll(page, 0, 500);
    await sleep(400);

    // ── SCENE 2: VOICE RECORDING & INTAKE (0:06 - 0:13) ──────────────────────
    console.log('[Scene 2] Grievance Intake Desk (/report)...');
    await setCaption(page, 'Initiating customer grievance intake...');
    await animatedClick(page, 'a[href="/report"]');
    await page.waitForURL('**/report', { timeout: 8000 });
    await injectOverlays(page);
    await sleep(400);

    await setCaption(page, 'Step 1 — Real-time speech recording with live frequency meter');
    await moveCursorTo(page, 'button[aria-label*="voice recording"]');
    await sleep(600);

    console.log('  -> Capturing demo-assets/voice-recording.png');
    const voiceRecordingPath = path.join(DEMO_ASSETS_DIR, 'voice-recording.png');
    await page.screenshot({ path: voiceRecordingPath });
    console.log(`  ✓ Saved ${voiceRecordingPath}`);

    // Switch to manual text tab for clear, deterministic demonstration
    await setCaption(page, 'Accessible text mode with real-time intent heuristics');
    await animatedClick(page, 'button:has-text("Manual text")');
    await sleep(300);

    const complaintText =
      'Duplicate charge of $120.00 posted on November 2nd. Please refund the extra billing fee.';
    await animatedType(page, '#manual-transcript', complaintText, 14);
    await sleep(400);

    await setCaption(page, 'Submitting customer grievance for AI categorization...');
    await animatedClick(page, 'button:has-text("Review & submit")');

    // ── SCENE 3: TRANSCRIPT REVIEW & INTENT PREVIEW (0:13 - 0:20) ────────────
    console.log('[Scene 3] Transcript Verification & Intelligent Routing (/review)...');
    await page.waitForURL('**/review', { timeout: 10000 });
    await injectOverlays(page);
    await sleep(500);

    console.log('  -> Capturing demo-assets/transcript-review.png');
    const transcriptReviewPath = path.join(DEMO_ASSETS_DIR, 'transcript-review.png');
    await page.screenshot({ path: transcriptReviewPath });
    console.log(`  ✓ Saved ${transcriptReviewPath}`);

    await setCaption(page, 'Step 2 — Gemini classification & department dispatch telemetry');
    await moveCursorTo(page, 'text=Detected Category, text=Domain / Category');
    await sleep(500);
    await moveCursorTo(page, 'text=Assigned Department');
    await sleep(400);

    await setCaption(page, 'Confirming ticket registration into atomic database ledger...');
    await animatedClick(page, 'button:has-text("Submit grievance")');

    // ── SCENE 4: TICKET CONFIRMATION & STAMP (0:20 - 0:26) ───────────────────
    console.log('[Scene 4] Ticket Registration & Audio Playback (/confirmation)...');
    await page.waitForURL('**/confirmation', { timeout: 20000 });
    await injectOverlays(page);
    await sleep(600);

    console.log('  -> Capturing demo-assets/ticket-confirmation.png');
    const ticketConfirmationPath = path.join(DEMO_ASSETS_DIR, 'ticket-confirmation.png');
    await page.screenshot({ path: ticketConfirmationPath });
    console.log(`  ✓ Saved ${ticketConfirmationPath}`);

    await setCaption(page, 'Step 3 — Atomic ticket stamp & synthesized verbal confirmation');
    await moveCursorTo(page, 'text=Reference ID, text=Ticket reference');
    await sleep(600);

    await moveCursorTo(page, 'button:has-text("Replay"), button:has-text("Mute"), button:has-text("Replay voice")');
    await sleep(500);

    await setCaption(page, 'Navigating to public ticket lifecycle tracker...');
    const trackBtn = page.locator('a[href*="/track"], a:has-text("Track ticket online")').first();
    if (await trackBtn.isVisible({ timeout: 6000 }).catch(() => false)) {
      await animatedClick(page, 'a[href*="/track"], a:has-text("Track ticket online")');
    } else {
      await page.goto(`${BASE_URL}/track`, { waitUntil: 'domcontentloaded' });
    }

    // ── SCENE 5: PUBLIC TICKET TRACKING (0:26 - 0:31) ────────────────────────
    console.log('[Scene 5] Public Ticket Tracking (/track)...');
    await page.waitForURL('**/track*', { timeout: 10000 }).catch(() => {});
    await injectOverlays(page);
    await sleep(600);

    console.log('  -> Capturing demo-assets/public-tracking.png');
    const publicTrackingPath = path.join(DEMO_ASSETS_DIR, 'public-tracking.png');
    await page.screenshot({ path: publicTrackingPath });
    console.log(`  ✓ Saved ${publicTrackingPath}`);

    await setCaption(page, 'Public Tracker — Real-time milestone progression & audit log');
    await moveCursorTo(page, 'text=Lifecycle milestones');
    await sleep(500);
    await moveCursorTo(page, 'text=Assigned department');
    await sleep(600);

    // ── SCENE 6: ADMIN OPERATIONAL CONSOLE (0:31 - 0:42) ─────────────────────
    console.log('[Scene 6] Administrative Operations Console (/admin)...');
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await injectOverlays(page);
    await sleep(400);

    const emailInput = page.locator('#admin-email');
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await setCaption(page, 'Enterprise access control — Supabase authentication');
      await animatedType(page, '#admin-email', 'admin@voxdesk.ai', 12);
      await sleep(100);
      await animatedType(page, '#admin-password', 'AdminVoxDesk2026!', 12);
      await sleep(150);
      await animatedClick(page, 'button[type="submit"]');
      await page.waitForSelector('text=Total Tickets', { timeout: 12000 }).catch(() => {});
    }

    await injectOverlays(page);
    await sleep(500);
    await setCaption(page, 'Operational overview: 6 live KPIs, queue health & department load');
    await moveCursorTo(page, 'text=Total Tickets');
    await sleep(500);

    console.log('  -> Capturing demo-assets/admin-dashboard.png');
    const adminDashboardPath = path.join(DEMO_ASSETS_DIR, 'admin-dashboard.png');
    await page.screenshot({ path: adminDashboardPath });
    console.log(`  ✓ Saved ${adminDashboardPath}`);

    // Quick tab hops to capture the remaining admin screenshots
    // Tickets tab
    await setCaption(page, 'Tickets management: paginated queue, multi-filters & triage drawer');
    await animatedClick(page, 'button:has-text("Tickets")');
    await sleep(500);
    console.log('  -> Capturing demo-assets/admin-tickets.png');
    const adminTicketsPath = path.join(DEMO_ASSETS_DIR, 'admin-tickets.png');
    await page.screenshot({ path: adminTicketsPath });
    console.log(`  ✓ Saved ${adminTicketsPath}`);

    // Analytics tab
    await animatedClick(page, 'button:has-text("Analytics")');
    await sleep(600);
    console.log('  -> Capturing demo-assets/admin-analytics.png');
    const adminAnalyticsPath = path.join(DEMO_ASSETS_DIR, 'admin-analytics.png');
    await page.screenshot({ path: adminAnalyticsPath });
    console.log(`  ✓ Saved ${adminAnalyticsPath}`);

    // Departments tab
    await animatedClick(page, 'button:has-text("Departments")');
    await sleep(500);
    console.log('  -> Capturing demo-assets/admin-departments.png');
    const adminDepartmentsPath = path.join(DEMO_ASSETS_DIR, 'admin-departments.png');
    await page.screenshot({ path: adminDepartmentsPath });
    console.log(`  ✓ Saved ${adminDepartmentsPath}`);

    // Users tab
    await animatedClick(page, 'button:has-text("Users")');
    await sleep(500);
    console.log('  -> Capturing demo-assets/admin-users.png');
    const adminUsersPath = path.join(DEMO_ASSETS_DIR, 'admin-users.png');
    await page.screenshot({ path: adminUsersPath });
    console.log(`  ✓ Saved ${adminUsersPath}`);

    // Return to dashboard
    await animatedClick(page, 'button:has-text("Dashboard")');
    await sleep(400);
    await setCaption(page, 'VoxDesk AI — Exact, calm, voice-first grievance automation');
    await sleep(600);

  } catch (err) {
    console.error('Error during demo walkthrough flow:', err);
  } finally {
    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n[Walkthrough Complete] Elapsed duration: ${elapsedSeconds}s (Target: 35–45s)`);

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

  console.log('\n===============================================================');
  console.log(' Playwright Demo Walkthrough Completed Successfully!');
  console.log('===============================================================');
  console.log('Generated Artifacts:');
  console.log('  • demo-assets/voxdesk-demo.webm      (Full interactive walkthrough video)');
  console.log('  • demo-assets/hero.png               (Landing page hero @ 2x)');
  console.log('  • demo-assets/voice-recording.png    (Audio grievance intake @ 2x)');
  console.log('  • demo-assets/transcript-review.png  (Transcript & intent preview @ 2x)');
  console.log('  • demo-assets/ticket-confirmation.png (Reference stamp & audio readout @ 2x)');
  console.log('  • demo-assets/public-tracking.png    (Public ticket status tracker @ 2x)');
  console.log('  • demo-assets/admin-dashboard.png    (Operational metrics & overview @ 2x)');
  console.log('  • demo-assets/admin-tickets.png      (Paginated tickets queue @ 2x)');
  console.log('  • demo-assets/admin-analytics.png    (Statistical analytics charts @ 2x)');
  console.log('  • demo-assets/admin-departments.png  (Department workload table @ 2x)');
  console.log('  • demo-assets/admin-users.png        (Staff RBAC directory @ 2x)');
  console.log('  • demo-assets/mobile-viewport.png    (Mobile 390×844 viewport @ 2x)');
  console.log('\nNext Step: Run `python scripts/generate_media.py` to produce docs/media/ MP4 & GIF exports.');
  console.log('===============================================================\n');
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
