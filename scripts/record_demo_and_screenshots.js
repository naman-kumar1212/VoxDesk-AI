const fs = require('fs');
const path = require('path');
const { chromium } = require('../frontend/node_modules/@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://voxdesk-web-lac.vercel.app';
const API_BASE = process.env.API_BASE || 'https://voxdesk-api.vercel.app/api';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '9fN2dY7fN4sR6tGjM8vK3pX1bZ';

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
    const nextY = currentY + diff * (i / steps);
    await page.evaluate((y) => window.scrollTo(0, y), nextY);
    await sleep(delay);
  }
}

async function typeSlowly(page, selector, text, delayMs = 30) {
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
      } else {
        console.warn(`  ! Could not download ${chart.file} (${res.status})`);
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
    // ─────────────────────────────────────────────────────────────────────────
    // SCENE 1: LANDING PAGE
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[Scene 1] Visiting Landing Page...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await sleep(2000);

    console.log('  -> Capturing screenshots/landing_hero.png');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'landing_hero.png') });

    await smoothScroll(page, 700, 1600);
    await sleep(1500);
    await smoothScroll(page, 1400, 1600);
    await sleep(1500);
    await smoothScroll(page, 0, 1400);
    await sleep(1000);

    // ─────────────────────────────────────────────────────────────────────────
    // SCENE 2: VOICE GRIEVANCE INTAKE
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[Scene 2] Navigating to Voice Grievance Intake (/report)...');
    const reportLink = page.locator('a[href="/report"], button:has-text("Submit Grievance"), button:has-text("Report")').first();
    await reportLink.click();
    await page.waitForURL('**/report', { timeout: 10000 });
    await sleep(2000);

    // Click Voice Record button to showcase waveform and recording UI
    const micButton = page.locator('button[aria-label="Start recording"], button:has-text("Record"), button[aria-label="Start recording audio complaint"]').first();
    if (await micButton.isVisible({ timeout: 4000 }).catch(() => false)) {
      await micButton.click();
      await sleep(3500);
      console.log('  -> Capturing screenshots/voice_recording.png');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'voice_recording.png') });

      const stopButton = page.locator('button[aria-label="Stop recording"], button:has-text("Stop"), button:has-text("Cancel")').first();
      if (await stopButton.isVisible().catch(() => false)) {
        await stopButton.click().catch(() => {});
      }
      await sleep(1200);
    }

    // Switch to Manual Text Mode
    console.log('  -> Switching to Manual Text tab...');
    const textTabBtn = page.locator('button:has-text("Manual Text"), button:has-text("Type Text")').first();
    if (await textTabBtn.isVisible().catch(() => false)) {
      await textTabBtn.click();
      await sleep(1000);

      const grievanceText =
        'My credit card was charged twice for the monthly subscription on November 2nd. The duplicate charge of $120 has posted to my account. Please initiate a refund for the extra charge.';
      const textarea = page.locator('#manual-transcript, #manual-complaint-text, textarea').first();
      await textarea.fill('');
      await typeSlowly(page, '#manual-transcript, #manual-complaint-text, textarea', grievanceText, 25);
      await sleep(1500);

      console.log('  -> Submitting grievance to review stage...');
      const reviewBtn = page.locator('button:has-text("Review & Submit"), button:has-text("Continue to Review")').first();
      await reviewBtn.click();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCENE 3: GRIEVANCE REVIEW
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[Scene 3] Review Complaint Page (/review)...');
    await page.waitForURL('**/review', { timeout: 12000 });
    await sleep(2500);

    console.log('  -> Capturing screenshots/review_complaint.png');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'review_complaint.png') });
    await sleep(1500);

    const submitBtn = page.locator('button:has-text("Submit Grievance"), button:has-text("Submit Complaint")').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.hover();
      await sleep(1200);
      await submitBtn.click();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCENE 4: TICKET CONFIRMATION
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[Scene 4] Awaiting Ticket Confirmation (/confirmation)...');
    await page.waitForURL('**/confirmation', { timeout: 25000 });
    await sleep(3500);

    console.log('  -> Capturing screenshots/ticket_confirmation.png');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'ticket_confirmation.png') });

    let createdTicketNumber = 'VD-DF852160';
    try {
      const ticketNumEl = page.locator('.font-mono.font-bold').first();
      if (await ticketNumEl.isVisible()) {
        const text = (await ticketNumEl.textContent()).trim();
        if (text.startsWith('VD-')) {
          createdTicketNumber = text;
          console.log(`  ✓ Generated Ticket Number: ${createdTicketNumber}`);
        }
      }
    } catch {}
    await sleep(2500);

    // ─────────────────────────────────────────────────────────────────────────
    // SCENE 5: PUBLIC TICKET TRACKING
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[Scene 5] Navigating to Track Ticket (/track)...');
    const trackLink = page.locator('a:has-text("Track Ticket Online"), a[href*="/track"]').first();
    if (await trackLink.isVisible().catch(() => false)) {
      await trackLink.click();
    } else {
      await page.goto(`${BASE_URL}/track`, { waitUntil: 'networkidle' });
    }
    await page.waitForURL('**/track*', { timeout: 10000 });
    await sleep(2000);

    const trackInput = page.locator('input[placeholder*="VD-"]').first();
    if (await trackInput.isVisible()) {
      const currentVal = await trackInput.inputValue();
      if (!currentVal) {
        await typeSlowly(page, 'input[placeholder*="VD-"]', createdTicketNumber, 35);
        await sleep(1000);
        const trackSubmit = page.locator('button[type="submit"], button:has-text("Track Grievance"), button:has-text("Track")').first();
        await trackSubmit.click();
        await sleep(3000);
      } else {
        await sleep(2500);
      }
    }

    // Keep view properly positioned so tracking lookup form and result are fully visible
    await page.evaluate(() => window.scrollTo({ top: 120, behavior: 'smooth' }));
    await sleep(2000);

    console.log('  -> Capturing screenshots/ticket_tracking.png');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'ticket_tracking.png') });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await sleep(1000);

    // ─────────────────────────────────────────────────────────────────────────
    // SCENE 6: ADMIN AUTHENTICATION (Security Compliant — Pristine Login Screen)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[Scene 6] Navigating to Admin Console Login (/admin)...');
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
    await sleep(2000);

    const emailField = page.locator('#admin-email');
    if (await emailField.isVisible({ timeout: 4000 }).catch(() => false)) {
      // Capture clean, security-compliant login state (empty password, no exposed credentials)
      console.log('  -> Capturing screenshots/admin_login.png (clean & secure)...');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin_login.png') });

      console.log('  -> Entering administrator credentials (masked)...');
      await typeSlowly(page, '#admin-email', 'admin@voxdesk.ai', 25);
      await sleep(400);
      await typeSlowly(page, '#admin-password', 'AdminVoxDesk2026!', 25);
      await sleep(600);

      await page.click('button[type="submit"]');
      await sleep(3500);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCENE 7: ADMIN DASHBOARD OVERVIEW
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[Scene 7] Administrative Operational Console (/admin)...');
    await page.waitForSelector('text=Total Tickets', { timeout: 15000 }).catch(() => {});
    await sleep(2500);

    console.log('  -> Capturing screenshots/admin_dashboard.png');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin_dashboard.png') });

    await smoothScroll(page, 500, 1800);
    await sleep(2000);
    await smoothScroll(page, 0, 1400);
    await sleep(1000);

    // ─────────────────────────────────────────────────────────────────────────
    // SCENE 8: TICKETS MANAGEMENT & TICKET INSPECTOR
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[Scene 8] Navigating to Tickets Management...');
    const ticketsTab = page.locator('button[aria-label="Tickets"], button:has-text("Tickets"), button[title="Tickets"]').first();
    await ticketsTab.click();
    await sleep(2500);

    const searchInput = page.locator('input[placeholder*="Search by ticket" i]').first();
    if (await searchInput.isVisible()) {
      await typeSlowly(page, 'input[placeholder*="Search by ticket" i]', 'support', 40);
      await sleep(1500);
      // Clear back to show full list
      await searchInput.fill('');
      await sleep(1000);
    }

    // Click first row to open the newly top-aligned Ticket Inspector drawer!
    console.log('  -> Opening Ticket Inspector alongside table and search bar...');
    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await sleep(2500);

      console.log('  -> Capturing screenshots/admin_tickets.png (with Ticket Inspector open)');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin_tickets.png') });

      // Highlight Ticket Inspector details
      const inspector = page.locator('text=Ticket Inspector').first();
      if (await inspector.isVisible()) {
        await sleep(2000);
      }
      // Close inspector drawer cleanly before leaving Scene 8
      const closeBtn = page.locator('button[aria-label="Close Inspector"]').first();
      if (await closeBtn.isVisible().catch(() => false)) {
        console.log('  -> Closing Ticket Inspector drawer...');
        await closeBtn.click();
        await sleep(600);
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCENE 9: ANALYTICS & PERFORMANCE CHARTS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[Scene 9] Navigating to Analytics & Performance...');
    const analyticsTab = page.locator('button[aria-label="Analytics"], button:has-text("Analytics"), button[title="Analytics"]').first();
    try {
      await analyticsTab.click({ timeout: 5000, force: true });
    } catch {
      await page.goto(`${BASE_URL}/admin/analytics`);
    }
    await sleep(3500);

    // Switch date filters to showcase reactivity
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

    // Toggle Data Table on Department Workload card to show independent expansion!
    const dataTableBtn = page.locator('button:has-text("Data Table"), button:has-text("Hide Table")').first();
    if (await dataTableBtn.isVisible()) {
      console.log('  -> Expanding accessible Data Table breakdown...');
      await dataTableBtn.click();
      await sleep(1500);
    }

    console.log('  -> Capturing screenshots/admin_analytics.png');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin_analytics.png') });

    await smoothScroll(page, 700, 1800);
    await sleep(2000);
    await smoothScroll(page, 0, 1400);
    await sleep(1000);

    // ─────────────────────────────────────────────────────────────────────────
    // SCENE 10: DEPARTMENTS MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[Scene 10] Navigating to Departments...');
    const deptsTab = page.locator('button[aria-label="Departments"], button:has-text("Departments"), button[title="Departments"]').first();
    await deptsTab.click();
    await sleep(2500);

    console.log('  -> Capturing screenshots/admin_departments.png');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin_departments.png') });
    await sleep(1500);

    // ─────────────────────────────────────────────────────────────────────────
    // SCENE 11: USERS DIRECTORY
    // ─────────────────────────────────────────────────────────────────────────
    console.log('[Scene 11] Navigating to Users Directory...');
    const usersTab = page.locator('button[aria-label="Users"], button:has-text("Users"), button[title="Users"]').first();
    await usersTab.click();
    await sleep(2500);

    console.log('  -> Capturing screenshots/admin_users.png');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin_users.png') });
    await sleep(2000);

    // Return to Admin Dashboard to wrap up video
    console.log('  -> Returning to Admin Dashboard...');
    const dashboardTab = page.locator('button[aria-label="Dashboard"], button:has-text("Dashboard"), button[title="Dashboard"]').first();
    await dashboardTab.click();
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
      } catch {}
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
