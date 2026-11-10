const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('../frontend/node_modules/@playwright/test');

const DIST_DIR = path.resolve(__dirname, '../frontend/dist');
const OUTPUT_DIR = path.resolve(__dirname, '../screenshots/full_design_larp');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function startServer(port = 4567) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    let filePath = path.join(DIST_DIR, reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      return fs.createReadStream(filePath).pipe(res);
    }

    const indexPath = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return fs.createReadStream(indexPath).pipe(res);
    }

    res.writeHead(404);
    res.end('Not Found');
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function auditDOM(page, viewName, width) {
  return await page.evaluate(({ viewName, width }) => {
    const results = {
      viewName,
      width,
      h1Count: document.querySelectorAll('h1').length,
      h1Texts: Array.from(document.querySelectorAll('h1')).map((h) => h.innerText.trim()),
      fonts: new Set(),
      fontSizes: new Set(),
      fontWeights: new Set(),
      colors: new Set(),
      bgColors: new Set(),
      lowContrastIssues: [],
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      overflowingElements: [],
      loremMatches: [],
      brokenLinks: [],
    };

    if (results.horizontalOverflow) {
      document.querySelectorAll('*').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.right > window.innerWidth + 1) {
          results.overflowingElements.push({
            tag: el.tagName.toLowerCase(),
            class: (el.className || '').slice(0, 80),
            right: Math.round(rect.right),
          });
        }
      });
    }

    const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, button, a, label, input, td, th');
    elements.forEach((el) => {
      if (el.getAttribute('aria-hidden') === 'true' || el.closest('[aria-hidden="true"]')) return;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return;

      if (style.fontFamily) results.fonts.add(style.fontFamily.split(',')[0].trim().replace(/['"]/g, ''));
      if (style.fontSize) results.fontSizes.add(style.fontSize);
      if (style.fontWeight) results.fontWeights.add(style.fontWeight);
      if (style.color) results.colors.add(style.color);
      if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        results.bgColors.add(style.backgroundColor);
      }

      const text = el.innerText || '';
      if (/lorem\s+ipsum/i.test(text)) {
        results.loremMatches.push({ tag: el.tagName.toLowerCase(), text: text.slice(0, 60) });
      }

      if (el.children.length === 0 && text.trim().length > 0) {
        let bgNode = el;
        let effectiveBg = style.backgroundColor;
        while (bgNode && (effectiveBg === 'rgba(0, 0, 0, 0)' || !effectiveBg)) {
          bgNode = bgNode.parentElement;
          if (bgNode && bgNode !== document) {
            effectiveBg = window.getComputedStyle(bgNode).backgroundColor;
          } else {
            effectiveBg = 'rgb(244, 246, 249)';
            break;
          }
        }

        const textColor = style.color;
        const fontSizePx = parseFloat(style.fontSize);
        const isBold = parseInt(style.fontWeight) >= 700;
        const isLarge = fontSizePx >= 24 || (fontSizePx >= 18.5 && isBold);

        function parseRgbLocal(str) {
          const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          return m ? [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])] : null;
        }

        const fg = parseRgbLocal(textColor);
        const bg = parseRgbLocal(effectiveBg);

        if (fg && bg) {
          function lum(rgb) {
            const a = rgb.map((v) => {
              v /= 255;
              return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
          }
          const l1 = lum(fg);
          const l2 = lum(bg);
          const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

          const minRatio = isLarge ? 3.0 : 4.5;
          if (ratio < minRatio && ratio < 3.5) {
            results.lowContrastIssues.push({
              tag: el.tagName.toLowerCase(),
              text: text.slice(0, 40),
              fg: textColor,
              bg: effectiveBg,
              ratio: Math.round(ratio * 100) / 100,
              required: minRatio,
            });
          }
        }
      }
    });

    document.querySelectorAll('a').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || href === '#' || href === 'javascript:void(0)') {
        results.brokenLinks.push({ text: a.innerText.trim(), href });
      }
    });

    return {
      viewName: results.viewName,
      width: results.width,
      h1Count: results.h1Count,
      h1Texts: results.h1Texts,
      fonts: Array.from(results.fonts),
      fontSizes: Array.from(results.fontSizes),
      fontWeights: Array.from(results.fontWeights),
      lowContrastIssues: results.lowContrastIssues.slice(0, 5),
      horizontalOverflow: results.horizontalOverflow,
      scrollWidth: results.scrollWidth,
      innerWidth: results.innerWidth,
      overflowingElements: results.overflowingElements.slice(0, 3),
      loremMatches: results.loremMatches,
      brokenLinks: results.brokenLinks,
    };
  }, { viewName, width });
}

async function run() {
  const server = await startServer(4567);
  const browser = await chromium.launch({ headless: true });

  const viewsToAudit = [
    { name: 'public_home', path: '/', auth: false },
    { name: 'public_report', path: '/report', auth: false },
    { name: 'public_track', path: '/track', auth: false },
    { name: 'admin_login', path: '/admin', auth: false },
    { name: 'admin_dashboard', path: '/admin/dashboard', auth: true },
    { name: 'admin_tickets', path: '/admin/tickets', auth: true },
    { name: 'admin_departments', path: '/admin/departments', auth: true },
    { name: 'admin_users', path: '/admin/users', auth: true },
    { name: 'admin_analytics', path: '/admin/analytics', auth: true },
  ];

  const viewports = [
    { label: 'desktop_1440', width: 1440, height: 900 },
    { label: 'mobile_390', width: 390, height: 844 },
  ];

  const auditReport = [];

  try {
    for (const vp of viewports) {
      console.log(`\n=== Auditing Viewport: ${vp.label} (${vp.width}px) ===`);

      for (const view of viewsToAudit) {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
        });

        const page = await context.newPage();

        if (view.auth) {
          // Intercept auth verification
          await page.route('**/api/auth/me', (route) =>
            route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                success: true,
                data: {
                  user: { id: '1', email: 'admin@voxdesk.ai', name: 'Chief Operations Officer', role: 'admin' },
                },
              }),
            })
          );

          // Mock dashboard summary
          await page.route('**/api/admin/dashboard/summary*', (route) =>
            route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                success: true,
                data: {
                  total_tickets: 156,
                  open_tickets: 42,
                  in_progress_tickets: 28,
                  resolved_tickets: 74,
                  escalated_tickets: 12,
                  category_distribution: { payment: 45, delivery: 38, technical: 32, account: 25, orders: 16 },
                  department_workload: [
                    { name: 'Billing', total: 43, open: 12, resolved: 28 },
                    { name: 'Logistics', total: 38, open: 10, resolved: 24 },
                    { name: 'Technical Support', total: 32, open: 8, resolved: 20 },
                    { name: 'General Support', total: 43, open: 12, resolved: 28 },
                  ],
                },
              }),
            })
          );

          // Mock recent activity
          await page.route('**/api/admin/dashboard/recent-activity*', (route) =>
            route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                success: true,
                data: {
                  activities: [
                    { id: '1', event_type: 'TICKET_CREATED', ticket_number: 'VD-10482', created_at: new Date().toISOString() },
                    { id: '2', event_type: 'STATUS_CHANGED', ticket_number: 'VD-10481', details: { from_status: 'open', to_status: 'in_progress' }, created_at: new Date().toISOString() },
                  ],
                },
              }),
            })
          );

          // Mock tickets list
          await page.route('**/api/admin/tickets*', (route) =>
            route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                success: true,
                data: {
                  tickets: [
                    { id: '1', ticket_number: 'VD-10482', category: 'payment', priority: 'high', department: 'Billing', status: 'escalated', customer_name: 'Sarah Connor', created_at: new Date().toISOString() },
                    { id: '2', ticket_number: 'VD-10481', category: 'delivery', priority: 'medium', department: 'Logistics', status: 'in_progress', customer_name: 'John Doe', created_at: new Date().toISOString() },
                  ],
                  pagination: { total: 156, page: 1, page_size: 25, total_pages: 7 },
                },
              }),
            })
          );

          // Mock departments
          await page.route('**/api/admin/departments*', (route) =>
            route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                success: true,
                data: {
                  departments: [
                    { id: '1', name: 'Billing', description: 'Payment processing, charges, and refunds', staff_count: 8, open_tickets: 12, resolved_tickets: 28, escalated_tickets: 3, total_tickets: 43 },
                    { id: '2', name: 'Logistics', description: 'Order shipping, parcel dispatch, and tracking', staff_count: 6, open_tickets: 10, resolved_tickets: 24, escalated_tickets: 4, total_tickets: 38 },
                    { id: '3', name: 'Technical Support', description: 'Network connectivity and system troubleshooting', staff_count: 7, open_tickets: 8, resolved_tickets: 20, escalated_tickets: 4, total_tickets: 32 },
                    { id: '4', name: 'General Support', description: 'General customer inquiries and complaints', staff_count: 5, open_tickets: 12, resolved_tickets: 28, escalated_tickets: 3, total_tickets: 43 },
                  ],
                },
              }),
            })
          );

          // Mock users
          await page.route('**/api/admin/users*', (route) =>
            route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                success: true,
                data: {
                  users: [
                    { id: '1', name: 'Elena Rostova', email: 'elena@voxdesk.ai', role: 'admin', department: 'Executive', status: 'active', created_at: '2026-01-15T10:00:00Z', last_active: 'Just now' },
                    { id: '2', name: 'Marcus Vance', email: 'marcus@voxdesk.ai', role: 'staff', department: 'Billing', status: 'active', created_at: '2026-02-01T10:00:00Z', last_active: '12m ago' },
                  ],
                },
              }),
            })
          );

          // Mock analytics
          await page.route('**/api/admin/analytics/summary*', (route) =>
            route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                success: true,
                data: {
                  summary: {
                    total_tickets: 156,
                    resolution_rate: 68.4,
                    escalation_rate: 8.2,
                    avg_resolution_hours: 4.2,
                    whisper_success_rate: 98.7,
                    median_transcription_ms: 610,
                  },
                },
              }),
            })
          );

          await page.addInitScript(() => {
            localStorage.setItem('voxdesk_admin_token', '9fN2dY7fN4sR6tGjM8vK3pX1bZ');
            localStorage.setItem(
              'voxdesk_admin_user',
              JSON.stringify({
                id: '1',
                email: 'admin@voxdesk.ai',
                name: 'Operations Director',
                role: 'admin',
              })
            );
          });
        }

        console.log(`  Capturing ${view.name} at ${vp.width}px...`);
        await page.goto(`http://127.0.0.1:4567${view.path}`, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(600);

        const shotPath = path.join(OUTPUT_DIR, `${view.name}_${vp.label}.png`);
        await page.screenshot({ path: shotPath, fullPage: true });

        const metrics = await auditDOM(page, view.name, vp.width);
        auditReport.push(metrics);
        console.log(`    ✓ ${view.name}: h1=${metrics.h1Count} ('${metrics.h1Texts.join(', ')}'), overflow=${metrics.horizontalOverflow}, contrastIssues=${metrics.lowContrastIssues.length}`);

        await context.close();
      }
    }

    fs.writeFileSync(path.join(OUTPUT_DIR, 'full_design_audit.json'), JSON.stringify(auditReport, null, 2));
    console.log(`\n[Design LARP] Complete. Saved to ${path.join(OUTPUT_DIR, 'full_design_audit.json')}`);

  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((err) => {
  console.error('[Error during Design LARP audit]', err);
  process.exit(1);
});
