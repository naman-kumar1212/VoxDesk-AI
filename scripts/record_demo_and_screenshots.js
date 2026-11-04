const fs = require('fs');
const path = require('path');
const { chromium } = require('../frontend/node_modules/@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://voxdesk-web-lac.vercel.app';
const API_BASE = process.env.API_BASE || 'https://voxdesk-api.vercel.app/api';
const ADMIN_API_KEY = '9fN2dY7fN4sR6tGjM8vK3pX1bZ';

const SCREENSHOTS_DIR = path.resolve(__dirname, '../screenshots');
const PUBLIC_DIR = path.resolve(__dirname, '../frontend/public');
const TEMP_VIDEO_DIR = path.resolve(__dirname, '../frontend/public/.tmp_video');

fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.mkdirSync(TEMP_VIDEO_DIR, { recursive: true });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function smoothScroll(page, targetY, durationMs = 1500) {
  const steps = 30;
  const delay = durationMs / steps;
  const currentY = await page.evaluate(() => window.scrollY);
  const diff = targetY - currentY;

  for (let i = 1; i <= steps; i++) {
    const nextY = currentY + (diff * (i / steps));
    await page.evaluate((y) => window.scrollTo(0, y), nextY);
    await sleep(delay);
  }
}

async function typeSlowly(page, selector, text, delayMs = 35) {
  await page.focus(selector);
  for (const char of text) {
    await page.keyboard.type(char);
    await sleep(delayMs);
  }
}

async function captureAnalyticsCharts() {
  console.log('[Setup] Downloading fresh analytics charts from live API...');
  const charts = [
    { name: 'volume_over_time', file: 'chart_volume_over_time.png' },
    { name: 'status_distribution', file: 'chart_status_distribution.png' },
    { name: 'department_workload', file: 'chart_department_workload.png' },
    { name: 'resolution_time', file: 'chart_resolution_time.png' },
  ];

  for (const chart of charts) {
    try {
      const res = await fetch(`${API_BASE}/admin/analytics/charts/${chart.name}`, {
        headers: { 'X-Admin-Key': ADMIN_API_KEY },
      });
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        fs.writeFileSync(path.join(SCREENSHOTS_DIR, chart.file), Buffer.from(buffer));
        console.log(`  ✓ Saved ${chart.file}`);
      }
    } catch (err) {
      console.warn(`  ! Could not download ${chart.file}:`, err.message);
    }
  }
}

async function main() {
  console.log('====================================================');
  console.log(' VoxDesk AI — Playwright Demo Video & Screenshot Suite');
  console.log(` Target URL: ${BASE_URL}`);
  console.log('====================================================\n');

  await captureAnalyticsCharts();

  console.log('\n[Browser] Launching Chromium with simulated media devices...');
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    permissions: ['microphone'],
    recordVideo: {
      dir: TEMP_VIDEO_DIR,
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();
  const startTime = Date.now();

  try {
    // SCENE 1: LANDING PAGE
    console.log('[Scene 1] Visiting Landing Page...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await sleep(1500);

    console.log('  -> Capturing screenshots/landing_hero.png');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'landing_hero.png') });

    await smoothScroll(page, 750, 1800);
    await sleep(1800);
    await smoothScroll(page, 1400, 1800);
    await sleep(1800);
    await smoothScroll(page, 0, 1500);
    await sleep(1000);

    // SCENE 2: VOICE GRIEVANCE INTAKE
    console.log('[Scene 2] Navigating to Voice Grievance Intake (/report)...');
    await page.click('a[href="/report"]');
    await page.waitForURL('**/report', { timeout: 10000 });
    await sleep(2000);

    const micButton = page.locator('button[aria-label="Start recording audio complaint"]');
    if (await micButton.isVisible()) {
      await micButton.click();
      await sleep(3500);
      console.log('  -> Capturing screenshots/voice_recording.png');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'voice_recording.png') });

      const cancelButton = page.locator('button:has-text("Cancel")');
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
      }
      await sleep(1000);
    }

    const typeTextBtn = page.locator('button:has-text("Type Text")');
    if (await typeTextBtn.isVisible()) {
      await typeTextBtn.click();
      await sleep(1000);

      const grievanceText =
        'My credit card was charged twice for the monthly subscription on November 2nd. The duplicate charge of $120 has posted to my account. Please initiate a refund for the extra charge.';
      await typeSlowly(page, '#manual-complaint-text', grievanceText, 25);
      await sleep(1500);

      console.log('  -> Submitting grievance to review stage...');
      await page.click('button:has-text("Continue to Review")');
    }

    // SCENE 3: GRIEVANCE REVIEW
    console.log('[Scene 3] Review Complaint Page (/review)...');
    await page.waitForURL('**/review', { timeout: 10000 });
    await sleep(2500);

    console.log('  -> Capturing screenshots/review_complaint.png');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'review_complaint.png') });
    await sleep(1500);

    const submitBtn = page.locator('button:has-text("Submit Complaint")');
    if (await submitBtn.isVisible()) {
      await submitBtn.hover();
      await sleep(1500);
      await submitBtn.click();
    }

    // SCENE 4: TICKET CONFIRMATION
    console.log('[Scene 4] Awaiting Ticket Confirmation (/confirmation)...');
    await page.waitForURL('**/confirmation', { timeout: 25000 });
    await sleep(3500);

    console.log('  -> Capturing screenshots/ticket_confirmation.png');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'ticket_confirmation.png') });

    let createdTicketNumber = 'VD-10500';
    try {
      const ticketNumEl = page.locator('.font-mono.font-bold').first();
      if (await ticketNumEl.isVisible()) {
        const text = (await ticketNumEl.textContent()).trim();
        if (text.startsWith('VD-')) {
          createdTicketNumber = text;
          console.log(`  ✓ Generated Ticket Number: ${createdTicketNumber}`);
        }
      }
    } catch { }
    await sleep(3000);

    // SCENE 5: PUBLIC TICKET TRACKING
    console.log(`[Scene 5] Navigating to Track Ticket (/track)...`);
    await page.goto(`${BASE_URL}/track`, { waitUntil: 'networkidle' });
    await sleep(2000);

    await typeSlowly(page, 'input[placeholder*="VD-"]', createdTicketNumber, 40);
    await sleep(1000);

    console.log(`  -> Submitting search for ticket ${createdTicketNumber}...`);
    const trackBtn = page.locator('button[type="submit"], button:has-text("Track")').first();
    await trackBtn.click();
    await sleep(3500);

    await smoothScroll(page, 450, 1500);
    await sleep(1800);

    console.log('  -> Capturing screenshots/ticket_tracking.png');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'ticket_tracking.png') });
    await smoothScroll(page, 0, 1000);
    await sleep(1000);

    // SCENE 6: ADMIN AUTHENTICATION
    console.log('[Scene 6] Navigating to Admin Console Login (/admin)...');
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
    await sleep(2000);

    const emailField = page.locator('#admin-email');
    if (await emailField.isVisible({ timeout: 4000 }).catch(() => false)) {
      console.log('  -> Entering demo administrator credentials...');
      await typeSlowly(page, '#admin-email', 'admin@voxdesk.ai', 30);
      await sleep(500);
      await typeSlowly(page, '#admin-password', 'AdminVoxDesk2026!', 30);
      await sleep(800);

      const showPassBtn = page.locator('button[aria-label*="password" i]').first();
      if (await showPassBtn.isVisible().catch(() => false)) {
        await showPassBtn.click();
        await sleep(1000);
      }

      console.log('  -> Capturing screenshots/admin_login.png');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin_login.png') });

      await page.click('button[type="submit"]');
      await sleep(3500);
    }

    // SCENE 7: ADMIN DASHBOARD OVERVIEW
    console.log('[Scene 7] Administrative Operational Console (/admin/dashboard)...');
    await page.waitForSelector('text=Total Tickets', { timeout: 15000 });
    await sleep(2500);

    console.log('  -> Capturing screenshots/admin_dashboard.png');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin_dashboard.png') });

    await smoothScroll(page, 500, 2000);
    await sleep(2500);
    await smoothScroll(page, 0, 1500);
    await sleep(1000);

    // SCENE 8: TICKETS MANAGEMENT
    console.log('[Scene 8] Navigating to Tickets Management (/admin/tickets)...');
    await page.click('button[aria-label="Tickets"]');
    await sleep(2500);

    const searchInput = page.locator('input[placeholder*="Search by ticket" i]').first();
    if (await searchInput.isVisible()) {
      await typeSlowly(page, 'input[placeholder*="Search by ticket" i]', 'payment', 50);
      await sleep(1500);
    }

    const prioritySelect = page.locator('select').nth(1);
    if (await prioritySelect.isVisible()) {
      await prioritySelect.selectOption('high').catch(() => { });
      await sleep(1500);
    }

    console.log('  -> Capturing screenshots/admin_tickets.png');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin_tickets.png') });

    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await sleep(2500);

      await page.mouse.wheel(0, 350);
      await sleep(2000);

      await page.keyboard.press('Escape');
      await sleep(1000);
    }

    // SCENE 9: ANALYTICS & STATISTICAL CHARTS
    console.log('[Scene 9] Navigating to Analytics & Performance (/admin/analytics)...');
    await page.click('button[aria-label="Analytics"]');
    await sleep(3000);

    const filter7D = page.locator('button:has-text("Last 7 Days")').first();
    if (await filter7D.isVisible()) {
      await filter7D.click();
      await sleep(1500);
    }

    const filterAll = page.locator('button:has-text("All Time")').first();
    if (await filterAll.isVisible()) {
      await filterAll.click();
      await sleep(1500);
    }

    console.log('  -> Capturing screenshots/admin_analytics.png');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin_analytics.png') });

    await smoothScroll(page, 700, 2000);
    await sleep(2500);
    await smoothScroll(page, 0, 1500);
    await sleep(1000);

    // SCENE 10: DEPARTMENTS & USERS
    console.log('[Scene 10] Navigating to Departments (/admin/departments)...');
    await page.click('button[aria-label="Departments"]');
    await sleep(2500);

    console.log('  -> Capturing screenshots/admin_departments.png');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin_departments.png') });
    await sleep(1500);

    console.log('  -> Navigating to Users Directory (/admin/users)...');
    await page.click('button[aria-label="Users"]');
    await sleep(2500);

    console.log('  -> Capturing screenshots/admin_users.png');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin_users.png') });
    await sleep(2000);

    console.log('  -> Returning to Admin Dashboard...');
    await page.click('button[aria-label="Dashboard"]');
    await sleep(3000);

  } catch (err) {
    console.error('[Error during recording flow]:', err);
  } finally {
    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n[Finished] Total recorded walkthrough time: ${elapsedSeconds} seconds (~${(elapsedSeconds / 60).toFixed(1)} minutes)`);

    const videoObj = page.video();
    await page.close();
    await context.close();
    await browser.close();

    if (videoObj) {
      const recordedVideoPath = await videoObj.path();
      const targetPath = path.join(PUBLIC_DIR, 'voxdesk_demo_walkthrough.webm');
      fs.copyFileSync(recordedVideoPath, targetPath);
      const stats = fs.statSync(targetPath);
      console.log(`  ✓ Walkthrough video saved: ${targetPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      try {
        fs.rmSync(TEMP_VIDEO_DIR, { recursive: true, force: true });
      } catch { }
    }
  }

  console.log('\n====================================================');
  console.log(' Playwright Demo Video & Screenshot Suite Completed!');
  console.log('====================================================\n');
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
