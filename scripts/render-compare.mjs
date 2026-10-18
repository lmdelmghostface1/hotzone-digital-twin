#!/usr/bin/env node
/**
 * Fidelity-gate visual verification:
 *  1. serves the production build,
 *  2. captures the saved reference pose with headless Chromium (Playwright),
 *  3. writes docs/compare/induction/model_vN.png,
 *  4. enforces the triangle budget,
 *  5. delegates side-by-side / 50% overlay composition to scripts/compare_images.py.
 * Run: node scripts/render-compare.mjs [version] [poseId] [compareSubdir]
 * e.g. node scripts/render-compare.mjs v1 ref-primary induction
 *      node scripts/render-compare.mjs v1 wb-ref-primary wash-stations
 */
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const version = process.argv[2] ?? 'v1';
const poseId = process.argv[3] ?? 'ref-primary';
const compareSubdir = process.argv[4] ?? 'induction';
const port = 4199;
const outDir = join(root, 'docs', 'compare', compareSubdir);
mkdirSync(outDir, { recursive: true });

const refCam = JSON.parse(
  readFileSync(join(root, 'src', 'three', 'refCameras.json'), 'utf8')
);
const pose = refCam.cameras.find((c) => c.id === poseId);
if (!pose) {
  console.error(`unknown pose "${poseId}" - check src/three/refCameras.json`);
  process.exit(1);
}
// poses with file === null are free inspection views: capture only, no comparison
const hasRef = Boolean(pose.file);
const refPhoto = hasRef ? join(root, 'docs', 'reference', 'photos', pose.file) : null;
const outPng = join(outDir, `model_${version}.png`);

if (!existsSync(join(root, 'dist', 'index.html'))) {
  console.error('dist/index.html missing - run npm run build first');
  process.exit(1);
}

// Guard against a stale preview server left on the port from a previous run.
try {
  const old = await fetch(`http://localhost:${port}/`, { signal: AbortSignal.timeout(800) });
  if (old.ok) {
    console.error(`something is already serving on port ${port} - kill it first`);
    process.exit(1);
  }
} catch {
  /* port free - good */
}

const preview = spawn(
  'npx',
  ['vite', 'preview', '--port', String(port), '--strictPort'],
  { cwd: root, shell: true, stdio: 'pipe' }
);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForServer(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await wait(500);
  }
  throw new Error('preview server did not come up');
}

let failed = false;
try {
  await waitForServer(`http://localhost:${port}/`);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1700, height: 1000 } });
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));

  await page.goto(`http://localhost:${port}/?capture=1&pose=${encodeURIComponent(poseId)}`, {
    waitUntil: 'networkidle'
  });
  await page.waitForFunction(() => window.__sceneReady === true, null, { timeout: 60000 });
  // Headless software rendering is fill-rate bound, so only require a few frames
  // plus one stats sample (fps is computed after ~0.5s of accumulated dt).
  await page.waitForFunction(() => (window.__frames ?? 0) >= 3, null, { timeout: 60000 });
  await page.waitForFunction(() => window.__stats != null, null, { timeout: 60000 });
  await wait(1200);

  const stats = await page.evaluate(() => window.__stats ?? { triangles: -1, fps: -1 });
  const box = await page.locator('.vp-stage').boundingBox();
  if (!box) throw new Error('.vp-stage not found');
  await page.screenshot({
    path: outPng,
    clip: { x: box.x, y: box.y, width: box.width, height: box.height }
  });
  await browser.close();

  console.log(`capture OK -> ${outPng}`);
  console.log(`triangles: ${stats.triangles} (budget 350000) · fps: ${stats.fps}`);
  console.log(`console errors: ${consoleErrors.length}`);
  for (const e of consoleErrors) console.log(`  - ${e}`);

  if (consoleErrors.length > 0) failed = true;
  if (stats.triangles > 350000) {
    console.error('triangle budget exceeded');
    failed = true;
  }

  if (hasRef) {
    const py = spawnSync(
      'python',
      [join(root, 'scripts', 'compare_images.py'), outPng, refPhoto, outDir, `model_${version}`],
      { stdio: 'inherit' }
    );
    if (py.status !== 0) {
      console.error('compare_images.py failed');
      failed = true;
    }
  } else {
    console.log('pose has no reference photo - capture only, no comparison composed');
  }
} catch (err) {
  console.error(err);
  failed = true;
} finally {
  spawnSync('taskkill', ['/F', '/T', '/PID', String(preview.pid)], { stdio: 'ignore' });
  preview.kill();
}

process.exit(failed ? 1 : 0);
