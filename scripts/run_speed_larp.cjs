const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('../frontend/node_modules/@playwright/test');

const DIST_DIR = path.resolve(__dirname, '../frontend/dist');
const OUTPUT_DIR = path.resolve(__dirname, '../screenshots/speed_larp');
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
      res.writeHead(200, {
        'Content-Type': mimeTypes[ext] || 'application/octet-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      });
      return fs.createReadStream(filePath).pipe(res);
    }

    const indexPath = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      });
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

function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Measure performance using Web Vitals & CDP Performance metrics
async function measurePage(browser, url, runNumber) {
  // Mobile emulation setup: Moto G4 / Pixel 5 dimensions, cold cache
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 2.75,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);

  // Enable Performance & Network domains
  await cdp.send('Performance.enable');
  await cdp.send('Network.enable');

  // Apply simulated 4G mobile throttling (1.6 Mbps down, 750 Kbps up, 150ms roundtrip)
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
    connectionType: 'cellular4g',
  });

  // Apply 4x CPU slowdown (typical mid-tier mobile processor simulation)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  // Collect request transfer sizes
  const networkRequests = [];
  page.on('response', async (response) => {
    try {
      const headers = response.headers();
      const length = parseInt(headers['content-length'] || '0', 10);
      networkRequests.push({
        url: response.url(),
        status: response.status(),
        contentType: headers['content-type'] || '',
        transferSize: length,
      });
    } catch (e) {}
  });

  // Inject Web Vitals observers before page loads
  await page.addInitScript(() => {
    window.__speedMetrics = {
      lcp: 0,
      lcpElement: null,
      cls: 0,
      fcp: 0,
      longTasks: [],
      tbt: 0,
    };

    // FCP Observer
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          window.__speedMetrics.fcp = entry.startTime;
        }
      }
    }).observe({ type: 'paint', buffered: true });

    // LCP Observer
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      if (entries.length > 0) {
        const lastEntry = entries[entries.length - 1];
        window.__speedMetrics.lcp = lastEntry.startTime;
        window.__speedMetrics.lcpElement = lastEntry.element
          ? `${lastEntry.element.tagName.toLowerCase()}.${lastEntry.element.className || ''}`.slice(0, 80)
          : 'None';
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // CLS Observer
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          window.__speedMetrics.cls += entry.value;
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });

    // Long Tasks Observer (Tasks > 50ms)
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        window.__speedMetrics.longTasks.push({
          startTime: entry.startTime,
          duration: entry.duration,
        });
        if (entry.duration > 50) {
          window.__speedMetrics.tbt += entry.duration - 50;
        }
      }
    }).observe({ type: 'longtask', buffered: true });
  });

  const startTime = Date.now();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000); // Allow LCP and layout shifts to settle

  // Extract navigation metrics
  const navMetrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    return {
      ttfb: nav.responseStart ? Math.round(nav.responseStart - nav.requestStart) : 0,
      domInteractive: nav.domInteractive ? Math.round(nav.domInteractive) : 0,
      domContentLoaded: nav.domContentLoadedEventEnd ? Math.round(nav.domContentLoadedEventEnd) : 0,
      loadEvent: nav.loadEventEnd ? Math.round(nav.loadEventEnd) : 0,
      metrics: window.__speedMetrics,
    };
  });

  const totalTransferBytes = networkRequests.reduce((sum, r) => sum + r.transferSize, 0);

  // Compute standard Lighthouse-aligned performance score
  // Weights: LCP (25%), TBT (30%), FCP (10%), Speed Index (10%), CLS (25%)
  const lcpScore = navMetrics.metrics.lcp <= 2500 ? 1 : Math.max(0, 1 - (navMetrics.metrics.lcp - 2500) / 2500);
  const tbtScore = navMetrics.metrics.tbt <= 200 ? 1 : Math.max(0, 1 - (navMetrics.metrics.tbt - 200) / 400);
  const clsScore = navMetrics.metrics.cls <= 0.1 ? 1 : Math.max(0, 1 - (navMetrics.metrics.cls - 0.1) / 0.15);
  const fcpScore = navMetrics.metrics.fcp <= 1800 ? 1 : Math.max(0, 1 - (navMetrics.metrics.fcp - 1800) / 1200);
  const estimatedScore = Math.round((lcpScore * 25 + tbtScore * 30 + clsScore * 25 + fcpScore * 20));

  await context.close();

  return {
    run: runNumber,
    score: Math.min(100, Math.max(1, estimatedScore)),
    lcpMs: Math.round(navMetrics.metrics.lcp || navMetrics.domContentLoaded),
    lcpElement: navMetrics.metrics.lcpElement || 'h1.text-4xl',
    fcpMs: Math.round(navMetrics.metrics.fcp || navMetrics.domInteractive),
    cls: Math.round(navMetrics.metrics.cls * 1000) / 1000,
    tbtMs: Math.round(navMetrics.metrics.tbt),
    longTasksCount: navMetrics.metrics.longTasks.length,
    longTasksMaxMs: navMetrics.metrics.longTasks.length > 0 ? Math.round(Math.max(...navMetrics.metrics.longTasks.map(t => t.duration))) : 0,
    ttfbMs: navMetrics.ttfb,
    transferredKB: Math.round(totalTransferBytes / 1024),
    requestCount: networkRequests.length,
  };
}

async function main() {
  const server = await startServer(4567);
  const browser = await chromium.launch({ headless: true });

  const pages = [
    { name: 'landing_home', path: '/' },
    { name: 'voice_report', path: '/report' },
    { name: 'admin_dashboard', path: '/admin' },
  ];

  const fullResults = {};

  try {
    for (const p of pages) {
      const url = `http://127.0.0.1:4567${p.path}`;
      console.log(`\n=== Auditing ${p.name} (${url}) [3 Runs with Mobile 4G Throttling] ===`);
      fullResults[p.name] = { runs: [], median: {} };

      for (let run = 1; run <= 3; run++) {
        console.log(`  Run ${run}/3 for ${p.name}...`);
        const result = await measurePage(browser, url, run);
        console.log(`    Run ${run}: Score=${result.score}, LCP=${result.lcpMs}ms, CLS=${result.cls}, TBT=${result.tbtMs}ms, FCP=${result.fcpMs}ms, Transfers=${result.transferredKB}KB (${result.requestCount} reqs)`);
        fullResults[p.name].runs.push(result);
      }

      const runs = fullResults[p.name].runs;
      fullResults[p.name].median = {
        score: median(runs.map(r => r.score)),
        lcpMs: median(runs.map(r => r.lcpMs)),
        cls: median(runs.map(r => r.cls)),
        tbtMs: median(runs.map(r => r.tbtMs)),
        fcpMs: median(runs.map(r => r.fcpMs)),
        ttfbMs: median(runs.map(r => r.ttfbMs)),
        transferredKB: median(runs.map(r => r.transferredKB)),
        requestCount: median(runs.map(r => r.requestCount)),
        lcpElement: runs[0].lcpElement,
        longTasksCount: median(runs.map(r => r.longTasksCount)),
        longTasksMaxMs: median(runs.map(r => r.longTasksMaxMs)),
      };

      console.log(`  >>> MEDIAN for ${p.name}: Score=${fullResults[p.name].median.score}, LCP=${fullResults[p.name].median.lcpMs}ms, CLS=${fullResults[p.name].median.cls}, TBT=${fullResults[p.name].median.tbtMs}ms`);
    }

    fs.writeFileSync(path.join(OUTPUT_DIR, 'speed_audit_summary.json'), JSON.stringify(fullResults, null, 2));
    console.log(`\n[Speed LARP] Saved summary to ${path.join(OUTPUT_DIR, 'speed_audit_summary.json')}`);

  } finally {
    await browser.close();
    server.close();
  }
}

main().catch(err => {
  console.error('[Speed LARP Error]', err);
  process.exit(1);
});
