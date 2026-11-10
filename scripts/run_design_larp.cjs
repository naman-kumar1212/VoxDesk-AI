const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('../frontend/node_modules/@playwright/test');

const DIST_DIR = path.resolve(__dirname, '../frontend/dist');
const OUTPUT_DIR = path.resolve(__dirname, '../screenshots/design_larp');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Simple SPA static server for frontend/dist
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

    // SPA fallback
    const indexPath = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return fs.createReadStream(indexPath).pipe(res);
    }

    res.writeHead(404);
    res.end('Not Found');
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      console.log(`[Server] Serving dist on http://127.0.0.1:${port}`);
      resolve(server);
    });
  });
}

// Color contrast helper (sRGB luminance)
function getLuminance(r, g, b) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrast(rgb1, rgb2) {
  const lum1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const lum2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function parseRgb(colorStr) {
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  }
  return null;
}

async function auditPage(page, pageName, width) {
  return await page.evaluate(({ pageName, width }) => {
    const results = {
      pageName,
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
      buttons: [],
      inputs: [],
      loremMatches: [],
      linksWithoutHrefs: [],
    };

    // Check horizontal overflow culprits
    if (results.horizontalOverflow) {
      document.querySelectorAll('*').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.right > window.innerWidth + 1) {
          results.overflowingElements.push({
            tag: el.tagName.toLowerCase(),
            class: el.className ? el.className.slice(0, 80) : '',
            right: Math.round(rect.right),
          });
        }
      });
    }

    // Inspect text nodes for styling, contrast, lorem ipsum
    const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, button, a, label, input, td, th');
    elements.forEach((el) => {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return;

      if (style.fontFamily) results.fonts.add(style.fontFamily.split(',')[0].trim().replace(/['"]/g, ''));
      if (style.fontSize) results.fontSizes.add(style.fontSize);
      if (style.fontWeight) results.fontWeights.add(style.fontWeight);
      if (style.color) results.colors.add(style.color);
      if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        results.bgColors.add(style.backgroundColor);
      }

      // Check for Lorem ipsum
      const text = el.innerText || '';
      if (/lorem\s+ipsum/i.test(text)) {
        results.loremMatches.push({ tag: el.tagName.toLowerCase(), text: text.slice(0, 60) });
      }

      // Check contrast if element has visible non-empty direct text
      if (el.children.length === 0 && text.trim().length > 0) {
        // Find effective background
        let bgNode = el;
        let effectiveBg = style.backgroundColor;
        while (bgNode && (effectiveBg === 'rgba(0, 0, 0, 0)' || !effectiveBg)) {
          bgNode = bgNode.parentElement;
          if (bgNode && bgNode !== document) {
            effectiveBg = window.getComputedStyle(bgNode).backgroundColor;
          } else {
            effectiveBg = 'rgb(255, 255, 255)'; // Default document canvas
            break;
          }
        }

        const textColor = style.color;
        const fontSizePx = parseFloat(style.fontSize);
        const isBold = parseInt(style.fontWeight) >= 700;
        const isLarge = fontSizePx >= 24 || (fontSizePx >= 18.5 && isBold);

        // Helper inside browser context
        function parseRgbLocal(str) {
          const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          return m ? [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])] : null;
        }

        const fgRgb = parseRgbLocal(textColor);
        const bgRgb = parseRgbLocal(effectiveBg);

        if (fgRgb && bgRgb) {
          function lum(rgb) {
            const a = rgb.map((v) => {
              v /= 255;
              return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
          }
          const l1 = lum(fgRgb);
          const l2 = lum(bgRgb);
          const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

          const minRatio = isLarge ? 3.0 : 4.5;
          if (ratio < minRatio && ratio < 3.8) {
            results.lowContrastIssues.push({
              tag: el.tagName.toLowerCase(),
              text: text.slice(0, 40),
              fg: textColor,
              bg: effectiveBg,
              ratio: Math.round(ratio * 100) / 100,
              required: minRatio,
              fontSize: style.fontSize,
            });
          }
        }
      }
    });

    // Inspect buttons
    document.querySelectorAll('button, a[class*="btn"], a[role="button"]').forEach((btn) => {
      const style = window.getComputedStyle(btn);
      results.buttons.push({
        text: (btn.innerText || '').trim().slice(0, 30),
        bg: style.backgroundColor,
        color: style.color,
        borderRadius: style.borderRadius,
        padding: `${style.paddingTop} ${style.paddingRight}`,
      });
    });

    // Inspect links without href or href="#"
    document.querySelectorAll('a').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || href === '#' || href === 'javascript:void(0)') {
        results.linksWithoutHrefs.push({ text: a.innerText.trim(), href });
      }
    });

    return {
      pageName: results.pageName,
      width: results.width,
      h1Count: results.h1Count,
      h1Texts: results.h1Texts,
      fonts: Array.from(results.fonts),
      fontSizes: Array.from(results.fontSizes),
      fontWeights: Array.from(results.fontWeights),
      colors: Array.from(results.colors).slice(0, 25),
      lowContrastIssues: results.lowContrastIssues.slice(0, 10),
      horizontalOverflow: results.horizontalOverflow,
      scrollWidth: results.scrollWidth,
      innerWidth: results.innerWidth,
      overflowingElements: results.overflowingElements.slice(0, 5),
      buttonCount: results.buttons.length,
      loremMatches: results.loremMatches,
      brokenLinks: results.linksWithoutHrefs,
    };
  }, { pageName, width });
}

async function run() {
  const server = await startServer(4567);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const auditLog = [];

  const pagesToTest = [
    { name: 'landing_home', path: '/' },
    { name: 'voice_report', path: '/report' },
    { name: 'ticket_track', path: '/track' },
  ];

  const viewports = [
    { label: 'desktop_1440', width: 1440, height: 900 },
    { label: 'mobile_390', width: 390, height: 844 },
  ];

  try {
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      for (const p of pagesToTest) {
        console.log(`[Capture] ${p.name} at ${vp.width}px...`);
        await page.goto(`http://127.0.0.1:4567${p.path}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const shotPath = path.join(OUTPUT_DIR, `${p.name}_${vp.label}.png`);
        await page.screenshot({ path: shotPath, fullPage: true });

        const metrics = await auditPage(page, p.name, vp.width);
        auditLog.push(metrics);
        console.log(`  ✓ Saved ${shotPath}`);
      }
    }

    // Additional state captures:
    console.log('[Capture] Capturing states on /track...');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://127.0.0.1:4567/track', { waitUntil: 'networkidle' });

    // 1. Initial / Empty State
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'track_state_empty_1440.png'), fullPage: true });

    // 2. Invalid Input State
    const input = page.locator('input[placeholder*="VD-"]');
    if (await input.count() > 0) {
      await input.fill('invalid');
      const submitBtn = page.locator('button:has-text("Track Ticket")');
      if (await submitBtn.count() > 0) await submitBtn.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'track_state_invalid_1440.png'), fullPage: true });

      // 3. Not Found Error State
      await input.fill('VD-99999999');
      if (await submitBtn.count() > 0) await submitBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'track_state_notfound_1440.png'), fullPage: true });
    }

    // Write audit summary JSON
    fs.writeFileSync(path.join(OUTPUT_DIR, 'audit_metrics.json'), JSON.stringify(auditLog, null, 2));
    console.log(`[Audit] Completed. Results written to ${path.join(OUTPUT_DIR, 'audit_metrics.json')}`);

  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((err) => {
  console.error('[Error]', err);
  process.exit(1);
});
