const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('../frontend/node_modules/@playwright/test');

const DIST_DIR = path.resolve(__dirname, '../frontend/dist');

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

async function benchmarkHandoff(runs = 3) {
  const server = await startServer(4567);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  });

  const latencies = [];

  try {
    for (let i = 1; i <= runs; i++) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
      });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);

      // Emulate 4G Mobile network latency
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 150,
        downloadThroughput: (1.6 * 1024 * 1024) / 8,
        uploadThroughput: (750 * 1024) / 8,
        connectionType: 'cellular4g',
      });

      // Mock the /api/voice/transcribe response with a typical Groq Whisper response time (500ms)
      // to isolate and measure the frontend pipeline + chunk fetching latency reliably
      await page.route('**/api/voice/transcribe', async (route) => {
        await new Promise((r) => setTimeout(r, 450)); // Simulating remote Groq Whisper API time
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              transcript: 'My home broadband router stopped working yesterday.',
              language: 'en',
              provider: 'groq',
            },
          }),
        });
      });

      await page.goto('http://127.0.0.1:4567/report', { waitUntil: 'networkidle' });

      // Click to start recording
      const recordBtn = page.locator('button[aria-label="Click to start voice recording"]');
      await recordBtn.click();

      // Record for 1.5 seconds
      await page.waitForTimeout(1500);

      // Stop recording and start stopwatch
      const stopBtn = page.locator('button:has-text("Done & Submit")');
      const t0 = Date.now();
      await stopBtn.click();

      // Wait until /review page renders its heading
      await page.waitForSelector('h1:has-text("Review Your Grievance")', { timeout: 10000 });
      const t1 = Date.now();

      const elapsed = t1 - t0;
      console.log(`[Run ${i}] Handoff latency: ${elapsed}ms`);
      latencies.push(elapsed);

      await context.close();
    }

    const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
    console.log(`\n>>> BASELINE MEDIAN HANDOFF LATENCY: ${avg}ms (Runs: ${latencies.join(', ')}ms)`);
    return { latencies, avg };

  } finally {
    await browser.close();
    server.close();
  }
}

benchmarkHandoff().catch(console.error);
