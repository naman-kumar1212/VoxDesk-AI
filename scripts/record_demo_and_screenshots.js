/**
 * VoxDesk AI — Unified Demo & Asset Generation Entrypoint
 *
 * Runs the modern Playwright demo workflow (`scripts/demo.mjs`).
 * Records a 30–45 second interactive product walkthrough at 1440×900 with deviceScaleFactor 2.
 * Captures high-resolution screenshots and animated GIF preview.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const demoScript = path.resolve(__dirname, 'demo.mjs');

console.log('[VoxDesk AI] Executing Playwright Demo Workflow (scripts/demo.mjs)...');
const child = spawn(process.execPath, [demoScript], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
