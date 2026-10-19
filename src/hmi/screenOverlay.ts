/**
 * Machine/toolbar screen overlay (UI/UX rebuild step 4).
 *
 * The Phase 4 HMI/NC/PLC/recipe/network training replicas open here instead of
 * living as text tabs: each machine panel carries "screens" buttons that open
 * the replica that observes that machine, and the viewport toolbar keeps all
 * global screens (recipe, network, roles) reachable. The 3D line stays visible
 * behind the window; nothing is re-mounted while it is open, so recipe edits,
 * device state and NC position persist between openings.
 *
 * HONESTY (hotzone-rules 2/6): the screens mount inside carries the
 * "simulated logic - not the plant program (NV-022)" bar and the FORCED
 * indicator; the whole overlay is a training replica only and never touches
 * a real network.
 */
import { mountControlScreens, showControlScreen, type ScreenId } from './controlScreens';

let overlay: HTMLElement | null = null;

export function openScreenOverlay(screenId?: ScreenId): void {
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'screen-overlay';
    overlay.innerHTML = `<div class="so-window" role="dialog" aria-label="Simulated screen replica">
      <div class="so-head">
        <strong>screen replica — simulated logic, not the plant program (NV-022)</strong>
        <button type="button" class="vp-btn so-close" aria-label="close">×</button>
      </div>
      <div class="so-host"></div>
    </div>`;
    document.body.appendChild(overlay);
    const host = overlay.querySelector('.so-host') as HTMLElement;
    mountControlScreens(host, screenId);
    overlay.querySelector('.so-close')?.addEventListener('click', closeScreenOverlay);
    overlay.addEventListener('mousedown', (e) => {
      if (e.target === overlay) closeScreenOverlay();
    });
  } else if (screenId) {
    showControlScreen(screenId);
  }
  if (overlay) overlay.hidden = false;
}

export function closeScreenOverlay(): void {
  if (overlay) overlay.hidden = true;
}

export function isScreenOverlayOpen(): boolean {
  return overlay != null && !overlay.hidden;
}
