/**
 * Nexteer Plant 78 Hot Zone digital twin - 3D-first shell (UI/UX rebuild step 1).
 *
 * The 3D line IS the site: a full-viewport interactive scene with a slim top
 * bar. All former text tabs moved behind the single "Evidence" button, which
 * opens the registers drawer (src/hmi/evidenceDrawer.ts) so the evidence
 * register stays reviewable without dominating the view (hotzone-rules 2).
 *
 * Machine interaction lives in the anchored panels (step 2/3); the screens
 * replicas open from machine panels or the toolbar via src/hmi/screenOverlay.ts
 * (step 4). The compatibility side panels stay reachable via the "panels"
 * toggle until the re-anchoring is fully done.
 */
import './style.css';
import { mountViewport } from './three/viewport';
import { mountEvidenceDrawer } from './hmi/evidenceDrawer';
import { closeScreenOverlay, isScreenOverlayOpen } from './hmi/screenOverlay';
import { bus } from './sim/runtime';

const DISCLAIMER =
  'Verify against master controlled copies before operational use.';

const app = document.getElementById('app');
if (!app) throw new Error('#app missing');

app.innerHTML = `
  <header id="topbar">
    <div class="brand">
      <span class="brand-title">Nexteer Plant 78 Hot Zone CV joint line</span>
      <span class="brand-sub">digital twin training simulator · educational, not validated</span>
    </div>
    <div id="status-pill" role="alert">${DISCLAIMER}</div>
    <button
      id="force-pill"
      type="button"
      class="force-pill"
      hidden
      title="Signals forced on the simulation bus (affects the simulation only)"
      aria-label="Forced signals indicator, cannot act"
      disabled
    ></button>
    <button
      id="ev-btn"
      type="button"
      class="vp-btn"
      aria-label="Open the evidence registers drawer"
      aria-expanded="false"
      aria-controls="ev-drawer"
    >Evidence</button>
  </header>
  <main id="scene-host" aria-label="Interactive 3D view of the CV-joint line"></main>
  <aside id="ev-drawer" role="dialog" aria-modal="false" aria-label="Evidence registers" hidden></aside>`;

mountEvidenceDrawer(document.getElementById('ev-drawer')!);
mountViewport(document.getElementById('scene-host')!);

document.getElementById('ev-btn')?.addEventListener('click', () => {
  const drawer = document.getElementById('ev-drawer');
  if (drawer) {
    drawer.hidden = !drawer.hidden;
    const btn = document.getElementById('ev-btn');
    if (btn) {
      btn.setAttribute('aria-expanded', String(!drawer.hidden));
      btn.setAttribute('aria-label', drawer.hidden ? 'Open the evidence registers drawer' : 'Close the evidence registers drawer');
    }
  }
});

// FORCED signals must be visible on every HMI (hotzone-rules 4); the top bar
// keeps a global badge that reacts while the drawer/overlay are closed.
const forcePill = document.getElementById('force-pill');
if (forcePill) {
  const updateForcePill = (): void => {
    const f = bus.forcedKeysList();
    forcePill.hidden = f.length === 0;
    forcePill.textContent = f.length === 0 ? '' : `FORCED: ${f.join(', ')}`;
  };
  updateForcePill();
  setInterval(updateForcePill, 500);
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (isScreenOverlayOpen()) {
      closeScreenOverlay();
      return;
    }
    const drawer = document.getElementById('ev-drawer');
    if (drawer && !drawer.hidden) {
      drawer.hidden = true;
      const btn = document.getElementById('ev-btn');
      if (btn) {
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Open the evidence registers drawer');
      }
    }
  }
});
