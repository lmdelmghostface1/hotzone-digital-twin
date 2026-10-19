import * as THREE from 'three';
import { makePalette } from './materials';
import { buildLine, type BuiltLine } from './line';
import type { BuiltStation } from './induction';
import { createScene, type SceneApi } from './scene';
import checklist from '../data/model-checklist.json';
import washChecklist from '../data/model-checklist-wash.json';
import ovenChecklist from '../data/model-checklist-oven.json';
import workpieceChecklist from '../data/model-checklist-workpiece.json';
import lineEndChecklist from '../data/model-checklist-lineend.json';
import identificationChecklist from '../data/model-checklist-identification.json';
import gageChecklist from '../data/model-checklist-gage.json';
import camerasJson from './refCameras.json';
import { buildPartMarker } from './actors';
import * as runtime from '../sim/runtime';
import {
  collectMachineMeshes,
  machineBoxOf,
  machineEvidenceSummary,
  machineForObj,
  type Machine
} from './machines';
import { buildMachineControls, tickMachineControls } from '../hmi/machineControls';
import { openScreenOverlay } from '../hmi/screenOverlay';
import type { ScreenId } from '../hmi/controlScreens';
import { drills } from '../sim/faults';

const sim = runtime.sim;
const bus = runtime.bus;
const hmi = runtime.hmi;
let simMarkers: { group: THREE.Group; material: THREE.MeshStandardMaterial }[] = [];
let simGroup: THREE.Group | null = null;
let markersBuilt = false;
let histTimer = 0;

interface DemoState {
  heat: number;
  ovenHeat: number;
  doorOpen: boolean;
  transparentDoors: boolean;
  cut: boolean;
}

declare global {
  interface Window {
    __sceneReady?: boolean;
    __frames?: number;
    __stats?: { triangles: number; fps: number };
  __simSignals?: unknown;
  __sim?: unknown;
  __hmi?: unknown;
}
}

const rootEl = document.createElement('div');
rootEl.className = 'vp-outer';

let api: SceneApi | null = null;
let raf = 0;

// anchored machine panel (UI/UX rebuild step 2)
let stageEl: HTMLElement | null = null;
let machinePanel: HTMLElement | null = null;
let machineHelper: THREE.Box3Helper | null = null;
let selectedMachine: Machine | null = null;

const state: DemoState = {
  heat: 0,
  ovenHeat: 0,
  doorOpen: false,
  transparentDoors: false,
  cut: false
};

const params = new URLSearchParams(window.location.search);
const capturePose = params.get('pose');
const isCapture = params.get('capture') === '1';

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls = '',
  text?: string
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

interface PartInfo {
  id: string;
  name: string;
  fn: string;
  dimension: string;
  layer: string;
  evidence: Record<string, unknown>;
  obj: THREE.Object3D;
}

function collectParts(station: BuiltStation): PartInfo[] {
  const seen = new Set<string>();
  const out: PartInfo[] = [];
  station.root.traverse((o) => {
    const u = o.userData as { id?: string; name?: string };
    if (!u.id || seen.has(u.id)) return;
    seen.add(u.id);
    const d = o.userData as Record<string, unknown>;
    out.push({
      id: u.id,
      name: String(u.name ?? u.id),
      fn: String(d.function ?? ''),
      dimension: String(d.dimension ?? ''),
      layer: String(d.layer ?? ''),
      evidence: (d.evidence as Record<string, unknown>) ?? {},
      obj: o
    });
  });
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

function evidenceText(e: Record<string, unknown>): string {
  const page = e.page ? ` p.${String(e.page)}` : '';
  return `${String(e.sourceId)}${page} · ${String(e.category)} · ${String(e.confidence)} · ${String(
    e.status
  )} · ${String(e.reviewed)}`;
}

export function mountViewport(container: HTMLElement): void {
  if (api) {
    if (rootEl.parentElement !== container) container.appendChild(rootEl);
    requestAnimationFrame(() => resizeToContainer());
    return;
  }
  container.appendChild(rootEl);

  if (isCapture) rootEl.classList.add('vp-capture');

  const toolbar = el('div', 'vp-toolbar');
  const stage = el('div', 'vp-stage');
  const side = el('div', 'vp-side');
  const canvas = el('canvas');
  canvas.className = 'vp-canvas';
  stage.appendChild(canvas);
  rootEl.append(toolbar, stage, side);
  stageEl = stage;
  mountMachinePanel(stage);

  const palette = makePalette();
  const station = buildLine(palette);
  // jsdom (tests) and very old browsers have no WebGL; degrade gracefully
  // instead of killing the whole app - the registers stay viewable.
  try {
    api = createScene(canvas, station, { poseId: capturePose ?? 'iso-default' });
    machineHelper = new THREE.Box3Helper(
      new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()),
      0x4da3ff
    );
    machineHelper.visible = false;
    api.scene.add(machineHelper);
  } catch {
    toolbar.appendChild(el('span', 'vp-hint', 'no WebGL here - 3D scene unavailable'));
  }

  // Phase 3: part markers travelling the line live on their own group so the
  // layer toggles never hide them.
  sim.reset();
  simGroup = new THREE.Group();
  simGroup.name = 'STATION_Sim';
  station.root.add(simGroup);
  for (let i = 0; i < 12; i++) {
    const mk = buildPartMarker();
    mk.group.visible = false;
    simGroup.add(mk.group);
    simMarkers.push(mk);
  }
  markersBuilt = true;
  (window as unknown as { __sim?: unknown; __hmi?: unknown; __bus?: unknown; __drills?: unknown }).__sim = sim;
  (window as unknown as { __sim?: unknown; __hmi?: unknown; __bus?: unknown; __drills?: unknown }).__hmi = hmi;
  (window as unknown as { __sim?: unknown; __hmi?: unknown; __bus?: unknown; __drills?: unknown }).__bus = bus;
  (window as unknown as { __sim?: unknown; __hmi?: unknown; __bus?: unknown; __drills?: unknown }).__drills = drills;
  (window as unknown as { __api?: SceneApi }).__api = api ?? undefined;
  buildToolbar(toolbar, () => side.classList.toggle('open'));
  const { selectPart, refreshList } = buildSide(side, station);

  canvas.addEventListener('pointerup', (ev) => {
    if (!api) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    const hit = api.pick(x, y);
    api.selectObject(hit);
    selectPart(hit ? String(hit.userData.id) : null);
    // machine-level selection drives the anchored panel (step 2)
    selectMachine(machineForObj(hit), station.root);
  });

  resizeToContainer();
  // jsdom has no ResizeObserver; skip live-resize there
  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(() => resizeToContainer());
    ro.observe(stage);
  }

  refreshList();
  startLoop(station);
}

function resizeToContainer(): void {
  if (!api) return;
  const stage = rootEl.querySelector('.vp-stage') as HTMLElement | null;
  if (!stage) return;
  if (isCapture) {
    api.resize(1600, 900);
    return;
  }
  api.resize(stage.clientWidth, stage.clientHeight);
}

function buildToolbar(toolbar: HTMLElement, togglePanels: () => void): void {
  const addCheckbox = (label: string, layer: string, checked = true): void => {
    const l = el('label', 'vp-check');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = checked;
    cb.addEventListener('change', () => api?.setLayerVisible(layer, cb.checked));
    l.append(cb, document.createTextNode(label));
    toolbar.appendChild(l);
  };
  addCheckbox('L1 silhouette', '1');
  addCheckbox('L2 mechanical', '2');
  addCheckbox('L3 functional', '3');
  addCheckbox('L4 detail', '4');
  addCheckbox('L5 visualisation', '5');
  addCheckbox('conceptual', 'conceptual');

  const sep = el('span', 'vp-sep');
  toolbar.appendChild(sep);

  const poseLabel = el('label', 'vp-check');
  poseLabel.append(document.createTextNode('pose '));
  const poseSel = document.createElement('select');
  for (const c of camerasJson.cameras) {
    const o = document.createElement('option');
    o.value = c.id;
    o.textContent = c.label;
    poseSel.appendChild(o);
  }
  poseSel.value = capturePose ?? 'iso-default';
  poseSel.addEventListener('change', () => api?.setPose(poseSel.value));
  poseLabel.appendChild(poseSel);
  toolbar.appendChild(poseLabel);

  const mkBtn = (text: string, fn: () => void): void => {
    const b = el('button', 'vp-btn', text);
    b.type = 'button';
    b.addEventListener('click', fn);
    toolbar.appendChild(b);
  };

  mkBtn('zoom +', () => api?.zoom(0.8));
  mkBtn('zoom −', () => api?.zoom(1.25));
  mkBtn('fit', () => api?.fit());
  mkBtn('screens', () => openScreenOverlay('main'));

  const hint = el('span', 'vp-hint', 'drag rotate · wheel or zoom +/− · right-drag pan');
  toolbar.appendChild(hint);

  const sep2 = el('span', 'vp-sep');
  toolbar.appendChild(sep2);

  mkBtn('section cut', () => {
    state.cut = !state.cut;
    api?.applyCut(state.cut);
  });
  mkBtn('glass x-ray', () => {
    state.transparentDoors = !state.transparentDoors;
    for (const g of api?.station.rig.glazing ?? []) {
      const m = g.material as THREE.MeshPhysicalMaterial;
      m.opacity = state.transparentDoors ? 0.12 : 0.45;
      m.needsUpdate = true;
    }
  });
  mkBtn('open door', () => {
    state.doorOpen = !state.doorOpen;
  });
  mkBtn('show all', () => {
    api?.station.root.traverse((o) => {
      o.visible = true;
    });
    const list = rootEl.querySelector('.vp-partlist') as HTMLElement | null;
    if (list) list.querySelectorAll('button.active').forEach((b) => b.classList.remove('active'));
  });

  mkBtn('panels', togglePanels);

  const stats = el('span', 'vp-stats', 'triangles: … · fps: …');
  stats.id = 'vp-stats';
  toolbar.appendChild(stats);
}

function buildSide(
  side: HTMLElement,
  station: BuiltStation
): { selectPart: (id: string | null) => void; refreshList: () => void } {
  const demo = el('div', 'vp-demo');
  demo.appendChild(el('div', 'vp-h', 'ambient visuals (illustrative)'));
  const note = el(
    'p',
    'vp-note',
    'Ambient scene visuals only (glow, spray, wash, oven, lamps) - illustrative, not the plant program. These controls write onto the typed signal bus (src/sim/bus.ts), the single source of truth for the scene: the same bus carries the tracked parts, the faults and every animation signal - nothing animates from a hidden variable.'
  );
  demo.appendChild(note);

  const row = el('div', 'vp-row');
  const mkBtn = (text: string, fn: () => void): void => {
    const b = el('button', 'vp-btn', text);
    b.type = 'button';
    b.addEventListener('click', fn);
    row.appendChild(b);
  };
  mkBtn('HEAT on/off', () => {
    bus.set('amb.heating', !bus.asBool('amb.heating'));
    if (bus.asBool('amb.heating')) bus.set('amb.quenching', false);
  });
  mkBtn('QUENCH on/off', () => {
    bus.set('amb.quenching', !bus.asBool('amb.quenching'));
    if (bus.asBool('amb.quenching')) bus.set('amb.heating', false);
  });
  mkBtn('WASH on/off', () => {
    bus.set('amb.washing', !bus.asBool('amb.washing'));
  });
  mkBtn('OVEN on/off', () => {
    bus.set('amb.tempering', !bus.asBool('amb.tempering'));
  });
  mkBtn('pause/resume', () => {
    bus.set('line.run', !bus.asBool('line.run'));
  });
  demo.appendChild(row);
  const stateLabel = el(
    'div',
    'vp-state',
    'heat 0 % · quench off · wash on · oven on · idle'
  );
  stateLabel.id = 'vp-state';
  demo.appendChild(stateLabel);
  side.appendChild(demo);

  // Phase 3 line simulation: the tracked part flow, the operator and the
  // (conceptual) GO/NO-GO gage. Educational model - see src/sim/part.ts.
  const simBox = el('div', 'vp-demo');
  simBox.appendChild(el('div', 'vp-h', 'line simulation (Phase 3)'));
  simBox.appendChild(
    el(
      'p',
      'vp-note',
      'Educational trend model. Heat index and GO/NO-GO dimensions are illustrative, not plant values (NV-014). The gage station is not photographed (NV-016) so it is conceptual.'
    )
  );
  const simRow = el('div', 'vp-row');
  const simBtn = (text: string, fn: () => void): HTMLButtonElement => {
    const b = el('button', 'vp-btn', text);
    b.type = 'button';
    b.addEventListener('click', fn);
    simRow.appendChild(b);
    return b;
  };
  const runBtn = simBtn('pause', () => {
    const running = bus.asBool('line.run');
    bus.set('line.run', !running);
    runBtn.textContent = (!running) ? 'pause' : 'run';
  });
  simBtn('step', () => {
    const was = bus.asBool('line.run');
    bus.set('line.run', true);
    for (let i = 0; i < 10; i++) sim.tick(0.1);
    bus.set('line.run', was);
  });
  const speedBtn = simBtn('speed ×1', () => {
    bus.set('line.rate', bus.asNumber('line.rate') === 1 ? 4 : 1);
    speedBtn.textContent = `speed ×${bus.asNumber('line.rate')}`;
  });
  simBtn('reset line', () => {
    sim.reset();
  });
  simBox.appendChild(simRow);
  const simState = el('div', 'vp-state', 'line starting…');
  simState.id = 'vp-sim';
  simBox.appendChild(simState);
  const simHist = el('div', 'vp-note', '');
  simHist.id = 'vp-simhist';
  simHist.style.whiteSpace = 'pre-wrap';
  simHist.style.fontFamily = 'monospace';
  simHist.style.maxHeight = '160px';
  simHist.style.overflow = 'auto';
  simBox.appendChild(simHist);
  side.appendChild(simBox);

  // Interactive HMI - troubleshooting/diagnostics (educational)
  const hmiBox = el('div', 'vp-demo');
  hmiBox.appendChild(el('div', 'vp-h', 'HMI simulation (troubleshooting / diagnostics)'));
  hmiBox.appendChild(
    el(
      'p',
      'vp-note',
      'Educational HMI mimic, not plant I/O. Simulated logic - not the plant program, no PLC/OPC link (see NV-022). Each trigger raises the REAL alarm code from the extracted register (docs/HMI_ERRORS.md) and forces a signal on the local bus, shown as FORCED and written to the audit log. Click an alarm to read what to check and how to fix.'
    )
  );
  const hmiRow = el('div', 'vp-row');
  const hmiBtn = (text: string, fn: () => void): HTMLButtonElement => {
    const b = el('button', 'vp-btn', text);
    b.type = 'button';
    b.addEventListener('click', fn);
    hmiRow.appendChild(b);
    return b;
  };
  const mkFaultBtn = (label: string, fault: keyof typeof hmi.faults): HTMLButtonElement => {
    const b = hmiBtn(label, () => hmi.toggle(fault));
    return b;
  };
  mkFaultBtn('Laser fault (HMI-019)', 'laserDisabled');
  mkFaultBtn('Code/scan fault (HMI-032)', 'damagedCode');
  mkFaultBtn('Size fault (HMI-022)', 'gageForceNok');
  const convBtn = hmiBtn('Stop conveyor (HMI-026)', () => {
    hmi.toggle('conveyorStop');
    convBtn.textContent = hmi.faults.conveyorStop ? 'Resume conveyor' : 'Stop conveyor (HMI-026)';
  });
  mkFaultBtn('Heat fault (HMI-069)', 'heatFault');
  mkFaultBtn('Quench fault (HMI-063)', 'quenchFault');
  hmiBtn('Ack all', () => hmi.ackAll());
  hmiBtn('Clear all', () => {
    hmi.clearAll();
    convBtn.textContent = 'Stop conveyor (HMI-026)';
  });
  hmiBtn('Reset HMI + signals', () => {
    hmi.reset();
    bus.reset();
    convBtn.textContent = 'Stop conveyor (HMI-026)';
    runBtn.textContent = 'pause';
  });
  hmiBox.appendChild(hmiRow);
  const hmiBanner = el('div', 'vp-state', 'HMI: System OK');
  hmiBanner.id = 'vp-hmi-banner';
  hmiBox.appendChild(hmiBanner);
  const hmiList = el('div', 'vp-note', 'no active alarms');
  hmiList.id = 'vp-hmi-list';
  hmiList.style.whiteSpace = 'pre-wrap';
  hmiList.style.fontFamily = 'monospace';
  hmiList.style.maxHeight = '180px';
  hmiList.style.overflow = 'auto';
  hmiBox.appendChild(hmiList);
  const hmiDiag = el('div', 'vp-note', 'Pick an alarm to see the checklist below.');
  hmiDiag.id = 'vp-hmi-diag';
  hmiDiag.style.whiteSpace = 'pre-wrap';
  hmiDiag.style.fontFamily = 'monospace';
  hmiBox.appendChild(hmiDiag);
  const audit = el('div', 'vp-note', '');
  audit.id = 'vp-hmi-audit';
  audit.style.whiteSpace = 'pre-wrap';
  audit.style.fontFamily = 'monospace';
  audit.style.maxHeight = '140px';
  audit.style.overflow = 'auto';
  hmiBox.appendChild(el('div', 'vp-h', 'audit log (simulated)'));
  hmiBox.appendChild(audit);
  side.appendChild(hmiBox);
  const selBox = el('div', 'vp-sel');
  selBox.appendChild(el('div', 'vp-h', 'selection'));
  const selBody = el('div', 'vp-selframe', 'click a part in the 3D view');
  selBody.id = 'vp-selbody';
  selBox.appendChild(selBody);
  const selRow = el('div', 'vp-row');
  const isolateBtn = el('button', 'vp-btn', 'isolate');
  isolateBtn.type = 'button';
  const hideBtn = el('button', 'vp-btn', 'hide');
  hideBtn.type = 'button';
  selRow.append(isolateBtn, hideBtn);
  selBox.appendChild(selRow);
  side.appendChild(selBox);

  let currentId: string | null = null;
  const selectPart = (id: string | null): void => {
    currentId = id;
    const parts = collectParts(station);
    const p = parts.find((x) => x.id === id);
    const body = document.getElementById('vp-selbody');
    if (body) {
      if (!p) {
        body.textContent = 'click a part in the 3D view';
      } else {
        body.innerHTML = `<div class="mono">${escapeHtml(p.id)}</div>
          <div><b>${escapeHtml(p.name)}</b></div>
          <div>${escapeHtml(p.fn)}</div>
          <div class="vp-tag">layer ${escapeHtml(p.layer)} · ${escapeHtml(p.dimension)}</div>
          <div class="vp-ev">${escapeHtml(evidenceText(p.evidence))}</div>`;
      }
    }
    rootEl.querySelectorAll('.vp-partlist button').forEach((b) => {
      b.classList.toggle('active', (b as HTMLElement).dataset.id === id);
    });
  };

  isolateBtn.addEventListener('click', () => {
    if (!api || !currentId) return;
    const target = collectParts(station).find((x) => x.id === currentId);
    if (!target) return;
    station.root.traverse((o) => {
      o.visible = false;
    });
    target.obj.visible = true;
  });
  hideBtn.addEventListener('click', () => {
    if (!api || !currentId) return;
    const target = collectParts(station).find((x) => x.id === currentId);
    if (!target) return;
    target.obj.visible = false;
    api.selectObject(null);
    selectPart(null);
  });

  const listWrap = el('div', 'vp-partlist');
  const refreshList = (): void => {
    listWrap.innerHTML = '';
    listWrap.appendChild(el('div', 'vp-h', `parts (${collectParts(station).length})`));
    for (const p of collectParts(station)) {
      const b = el('button', 'vp-part', `${p.id}  ${p.name}`);
      b.type = 'button';
      b.dataset.id = p.id;
      b.addEventListener('click', () => {
        api?.selectObject(p.obj);
        selectPart(p.id);
      });
      listWrap.appendChild(b);
    }
  };
  side.appendChild(listWrap);

  const cl = el('div', 'vp-checklist');
  cl.appendChild(el('div', 'vp-h', 'fidelity checklist'));
  const boards: [string, unknown][] = [
    ['induction machine (Phase 2a)', checklist.items],
    ['wash stations (Phase 2b)', washChecklist.items],
    ['draw oven (Phase 2b increment 2)', ovenChecklist.items],
    ['CV OR workpiece (Phase 2b increment 3)', workpieceChecklist.items],
    ['line end: cooling / unload + boxing (Phase 2b increment 4)', lineEndChecklist.items],
    [
      'identification: laser marking + 2D code reader (Phase 2b increment 5)',
      identificationChecklist.items
    ],
    ['gage station + operator + line simulation (Phase 3)', gageChecklist.items]
  ];
  for (const [boardTitle, raw] of boards) {
    cl.appendChild(el('div', 'vp-h', boardTitle));
    for (const item of raw as {
      id: string;
      title: string;
      status: string;
      note: string;
    }[]) {
      const rowEl = el('div', `vp-cl vp-cl-${item.status}`);
      rowEl.appendChild(el('span', 'vp-cl-status', item.status.toUpperCase()));
      const txt = el('div', 'vp-cl-body');
      txt.appendChild(el('div', '', `${item.id} · ${item.title}`));
      txt.appendChild(el('div', 'vp-note', item.note));
      rowEl.appendChild(txt);
      cl.appendChild(rowEl);
    }
  }
  side.appendChild(cl);

  return { selectPart, refreshList };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  );
}

// --- anchored machine panel (step 2) ------------------------------------

/** select a clickable machine; shows the Box3Helper around it and pins the
 *  anchored panel to its top-centre. null deselects. */
function selectMachine(machine: Machine | null, stationRoot: THREE.Object3D): void {
  selectedMachine = machine;
  if (!machinePanel || !stageEl) return;

  if (!selectedMachine || !api || !machineHelper) {
    if (machineHelper) machineHelper.visible = false;
    machinePanel.style.display = 'none';
    return;
  }

  const box = machineBoxOf(stationRoot, selectedMachine);
  if (!box) {
    machineHelper.visible = false;
    machinePanel.style.display = 'none';
    return;
  }
  machineHelper.box.copy(box);
  machineHelper.visible = true;

  const parts = collectMachineMeshes(stationRoot, selectedMachine);
  const summary = machineEvidenceSummary(parts);
  const cats = summary.categories
    .map((c) => `<span class="badge status-unverified">${escapeHtml(c)}</span>`)
    .join(' ');
  machinePanel.innerHTML = `
    <div class="vp-mh">
      <strong>${escapeHtml(selectedMachine.label)}</strong>
      <span class="mono small">${escapeHtml(selectedMachine.id)}</span>
      <button class="vp-btn vp-mclose" type="button" aria-label="close">×</button>
    </div>
    <div class="vp-m-stats">components: <b>${summary.parts}</b> · ${cats}</div>
    <div class="vp-m-note">${escapeHtml(selectedMachine.note)}</div>
    <div class="vp-m-ctl"></div>`;
  machinePanel.style.display = 'block';
  const ctlHost = machinePanel.querySelector('.vp-m-ctl') as HTMLElement;
  const unoperable =
    selectedMachine.station === 'WORKPIECE'
      ? 'The part is carried by the simulated line only; no operator control exists on the part itself.'
      : undefined;
  buildMachineControls(ctlHost, selectedMachine.station, unoperable);
  // step 4: machine panels open the screen replica that observes this machine
  machinePanel.querySelectorAll<HTMLButtonElement>('[data-mscreen]').forEach((b) => {
    b.addEventListener('click', () => {
      openScreenOverlay(b.dataset.mscreen as ScreenId | undefined);
    });
  });
  machinePanel.querySelector('.vp-mclose')?.addEventListener('click', () => {
    selectMachine(null, stationRoot);
    api?.selectObject(null);
  });
}

function mountMachinePanel(stage: HTMLElement): void {
  if (machinePanel) machinePanel.remove();
  machinePanel = document.createElement('div');
  machinePanel.className = 'vp-machine';
  machinePanel.style.display = 'none';
  stage.appendChild(machinePanel);
}

/** project the selected machine's anchor into screen space and pin the panel;
 *  the whole panel rect is kept inside the stage so no button can end up
 *  clipped under the toolbar */
function updateMachinePanel(camera: THREE.PerspectiveCamera): void {
  if (!machinePanel || !machineHelper || !selectedMachine || !api) return;
  if (!machineHelper.visible) return;
  const box = machineHelper.box;
  const anchor = new THREE.Vector3(
    (box.min.x + box.max.x) / 2,
    box.max.y + 0.15,
    (box.min.z + box.max.z) / 2
  ).project(camera);
  if (Math.abs(anchor.z) > 1) {
    machinePanel.style.display = 'none';
    return;
  }
  machinePanel.style.transform = 'none';
  const w = stageEl?.clientWidth ?? 0;
  const h = stageEl?.clientHeight ?? 0;
  const panelW = machinePanel.offsetWidth || 260;
  const panelH = machinePanel.offsetHeight || 200;
  const px = (anchor.x * 0.5 + 0.5) * w;
  const py = (-anchor.y * 0.5 + 0.5) * h;
  machinePanel.style.left = `${clampNum(px - panelW / 2, 8, Math.max(8, w - panelW - 8))}px`;
  const aboveTop = py - 12 - panelH;
  const top = aboveTop >= 8 ? aboveTop : Math.min(py + 12, Math.max(8, h - panelH - 8));
  machinePanel.style.top = `${clampNum(top, 8, Math.max(8, h - panelH - 8))}px`;
  machinePanel.style.display = 'block';
}

function clampNum(v: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(v, min), max);
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && machinePanel && selectedMachine) {
    machinePanel.style.display = 'none';
  }
});


// belt / bench geometry used to place the travelling parts (matches the model)
const MARK_LINE_Z = -0.15;
const MARK_BELT_Y = 1.055;
const MARK_GAGE_Y = 0.975;
const MARK_GAGE_Z = 0.95;
const HEAT_COLD = 0x9aa1a8;
const HEAT_REJECT = 0xb02121;

function updateActors(station: BuiltLine, dt: number): void {
  if (!markersBuilt || !simGroup) return;
  const k = Math.min(1, dt * 4);

  for (let i = 0; i < simMarkers.length; i++) {
    const mk = simMarkers[i];
    const p: any = sim.parts[i];
    if (!p) {
      mk.group.visible = false;
      continue;
    }
    const gaging = p.stage === 'GAGING';
    const tx = p.x;
    const ty = gaging ? MARK_GAGE_Y : MARK_BELT_Y;
    const tz = gaging ? MARK_GAGE_Z : MARK_LINE_Z;
    if (!mk.group.visible) {
      mk.group.position.set(tx, ty, tz);
      mk.group.visible = true;
    } else {
      mk.group.position.x += (tx - mk.group.position.x) * k;
      mk.group.position.y += (ty - mk.group.position.y) * k;
      mk.group.position.z += (tz - mk.group.position.z) * k;
    }
    const h = p.heatIndex;
    mk.material.emissive.setRGB(h * 0.9, h * 0.3, 0.05);
    mk.material.emissiveIntensity = 1.1 * h;
    mk.material.color.setHex(p.rejected ? HEAT_REJECT : HEAT_COLD);
  }

  // operator reaches down while a part is being gaged
  const reaching = sim.parts.some((p: any) => p.stage === 'GAGING' && !p.measurement);
  const op = station.operator;
  const armTarget = reaching ? -1.15 : -0.25;
  op.rightArm.rotation.z += (armTarget - op.rightArm.rotation.z) * Math.min(1, dt * 5);

  // gage plunger + result flag
  const gage = station.gageRig;
  const plungerTarget = reaching ? 0.92 : 0.99;
  gage.plunger.position.y += (plungerTarget - gage.plunger.position.y) * Math.min(1, dt * 6);
  const measured = [...sim.parts].reverse().find((p: any) => p.measurement);
  const res = measured?.measurement?.result;
  const flag = res === 'NO-GO' ? 0xb02121 : res === 'GO' ? 0x1f8f3a : 0x333333;
  gage.flagMaterial.color.setHex(flag);
  gage.flagMaterial.emissive.setHex(flag);

  // readouts
  const sig = sim.signals();
  window.__simSignals = sig;
  const hmiBannerEl = document.getElementById('vp-hmi-banner');
  if (hmiBannerEl) {
    const forced = bus.forcedKeysList();
    hmiBannerEl.textContent =
      hmi.signals().bannerText + (forced.length ? `  · FORCED: ${forced.join(', ')}` : '');
  }
  const stateEl = document.getElementById('vp-sim');
  if (stateEl) {
    stateEl.textContent = `parts on line ${sig.partsOnLine} · boxed ${sig.boxed} · rejected ${sig.rejected} · ${sig.headline} · last gage ${sig.lastMeasurement}`;
  }
  histTimer += dt;
  if (histTimer >= 0.3) {
    histTimer = 0;
    renderHmiAlarms();
    drills.poll();
    if (machinePanel && selectedMachine) {
      const ctlHost = machinePanel.querySelector('.vp-m-ctl') as HTMLElement | null;
      if (ctlHost) tickMachineControls(ctlHost, selectedMachine.station);
    }
    const histEl = document.getElementById('vp-simhist');
    const lead = sim.parts.find((p) => p.stage !== 'BOXED' && p.stage !== 'REJECTED');
    if (histEl) {
      histEl.textContent = lead
        ? `${lead.serial} ${lead.lot} ${lead.recipe} code ${lead.code2d ?? 'none'}\n` +
          lead.history
            .slice(-6)
            .map((h: any) => `  t${h.t.toFixed(1)} ${h.stage}: ${h.note}`)
            .join('\n')
        : 'no part on the line';
    }
  }
}

let hmiSelected: string | null = null;
let hmiSignature = '';

function renderHmiAlarms(): void {
  const listEl = document.getElementById('vp-hmi-list');
  const diagEl = document.getElementById('vp-hmi-diag');
  const auditEl = document.getElementById('vp-hmi-audit');
  if (auditEl) {
    const hist = bus.history().slice(-12);
    auditEl.textContent = hist.length
      ? hist.map((r) => `t${r.t.toFixed(1)} ${r.forced ? 'FORCED ' : '        '}${r.key} = ${String(r.value)} (${r.source})`).join('\n')
      : 'simulated logic - not the plant program. no signal changes yet.';
  }
  if (!listEl) return;
  const active = hmi.activeAlarms();
  const sig = active.map((a) => `${a.id}:${a.state}`).join('|') + `#${hmiSelected}`;
  if (sig === hmiSignature) return;
  hmiSignature = sig;

  listEl.innerHTML = '';
  if (active.length === 0) {
    listEl.textContent = 'no active alarms — trigger a fault above to see troubleshooting';
    if (diagEl) diagEl.textContent = 'Pick a fault button; the matching register alarm appears here with what to check and how to fix.';
    return;
  }
  for (const a of active) {
    const b = el('button', 'vp-btn', `${a.state === 'active-unacked' ? '🔴' : '🟠'} ${a.id} [${a.code}] ${a.text.slice(0, 54)}`);
    b.type = 'button';
    b.style.display = 'block';
    b.style.width = '100%';
    b.style.textAlign = 'left';
    b.style.margin = '2px 0';
    b.addEventListener('click', () => {
      hmiSelected = a.id;
      hmiSignature = '';
      renderHmiAlarms();
    });
    listEl.appendChild(b);
    const ack = el('button', 'vp-btn', 'ack');
    ack.type = 'button';
    ack.style.margin = '0 0 4px 8px';
    ack.addEventListener('click', () => hmi.ack(a.id));
    const clr = el('button', 'vp-btn', 'clear');
    clr.type = 'button';
    clr.style.margin = '0 0 4px 4px';
    clr.addEventListener('click', () => hmi.clear(a.id));
    listEl.append(ack, clr);
  }

  const sel = active.find((a) => a.id === hmiSelected) ?? active[0];
  hmiSelected = sel.id;
  if (diagEl) {
    diagEl.textContent =
      `${sel.id}  code ${sel.code}\n` +
      `ALARM: ${sel.text}\n` +
      `state: ${sel.state}${sel.activeSince !== undefined ? ` (t${sel.activeSince.toFixed(1)}s)` : ''}\n\n` +
      `WHAT TO CHECK:\n  ${sel.pairing || '(not extracted)'}\n\n` +
      `HOW TO FIX:\n  ${sel.fixStatus || '(not extracted - look up the controlled procedure)'}\n\n` +
      `seen in ${sel.sources.length} screenshot(s)\n` +
      `note: educational - verify against the controlled documents before any real action.`;
  }
}


function startLoop(station: BuiltLine): void {
  const clock = new THREE.Clock();
  let frames = 0;
  let fpsTime = 0;
  let fpsFrames = 0;
  let fps = 0;

  const update = (dt: number): void => {
    const rig = station.rig;
    const heating = bus.asBool('amb.heating');
    const quenching = bus.asBool('amb.quenching');
    const washing = bus.asBool('amb.washing');
    const tempering = bus.asBool('amb.tempering');
    const paused = !bus.asBool('line.run');
    if (heating) state.heat = Math.min(1, state.heat + dt * 0.3);
    if (quenching) state.heat = Math.max(0, state.heat - dt * 0.5);

    const heat = state.heat;
    rig.coilMaterial.emissive.setRGB(heat * 1.0, heat * 0.35, 0.0);
    rig.coilMaterial.emissiveIntensity = 1.3 * heat;

    rig.sprayGroup.visible = quenching;
    if (quenching) {
      rig.droplets.forEach((d, i) => {
        const phase = ((clock.elapsedTime * 1.6 + (d.userData.phase as number)) % 1);
        d.position.set(
          0.05 + Math.sin(i * 2.1) * 0.09 * (1 - phase),
          1.24 - phase * 0.22,
          -0.15 + Math.cos(i * 2.1) * 0.09 * (1 - phase)
        );
      });
    }

    const targetDoor = state.doorOpen ? -1.35 : 0;
    rig.doorPivot.rotation.y += (targetDoor - rig.doorPivot.rotation.y) * Math.min(1, dt * 6);

    const wr = station.washRig;
    if (wr) {
      for (const s of wr.sprays) {
        s.group.visible = washing;
        if (washing) {
          s.droplets.forEach((d, i) => {
            const phase = (clock.elapsedTime * 1.4 + (d.userData.phase as number)) % 1;
            const home = d.userData.home as THREE.Vector3;
            d.position.set(
              home.x + Math.sin(i * 2.1) * 0.05,
              1.9 - phase * 0.85,
              home.z + Math.cos(i * 1.7) * 0.04
            );
          });
        }
      }
      if (washing) {
        for (const c of wr.partCarriers) {
          c.position.x = (clock.elapsedTime * 0.15) % 0.3;
        }
      }
      for (const b of wr.beams) b.visible = washing;
    }

    const ov = station.ovenRig;
    if (ov) {
      const target = tempering ? 1 : 0;
      state.ovenHeat += (target - state.ovenHeat) * Math.min(1, dt * 1.5);
      const oh = state.ovenHeat;
      ov.chamberMaterial.emissive.setRGB(oh * 0.85, oh * 0.28, oh * 0.04);
      ov.chamberMaterial.emissiveIntensity = 1.2 * oh;
    }

    // CV OR workpiece (Phase 2b increment 3): the L5 bell colour and stem heat
    // band follow the ambient heating signal only (QN-004 / QN-005 placeholders -
    // not a thermal result, see docs/model-checklist/cv-or-workpiece.md).
    const wp = station.workpieceRig;
    if (wp) {
      wp.heat.emissive.setRGB(heat * 0.9, heat * 0.3, 0.05);
      wp.heat.emissiveIntensity = 1.1 * heat;
    }

    // Line end (Phase 2b increment 4): the cooling-conveyor parts drift while the
    // line runs and the unload stack light follows the run signal. Both are demo
    // placeholders - the station is not photographed (NV-019).
    const le = station.lineEndRig;
    if (le) {
      le.beltParts.children.forEach((child, i) => {
        if (paused) return;
        const span = 2.4;
        child.position.x = 7.45 + 0.55 + ((clock.elapsedTime * 0.16 + i * 0.8) % (span - 0.7));
      });
      le.lamps.green.emissiveIntensity = paused ? 0.05 : 1.4;
      le.lamps.amber.emissiveIntensity = paused ? 1.4 : 0.05;
      le.lamps.red.emissiveIntensity = 0.05;
    }

    // Identification stations (Phase 2b increment 5): the marking beam and the
    // read-OK lamp are demo placeholders driven by the run signal only.
    // Neither station is photographed, so no real marking or read timing is
    // claimed (see docs/model-checklist/identification.md and NV-021).
    const id = station.identRig;
    if (id) {
      id.laserBeam.visible = !paused;
      const pulse = 0.75 + 0.35 * Math.sin(clock.elapsedTime * 6);
      id.laserBeam.scale.y = paused ? 1 : pulse;
      id.markingLamp.emissiveIntensity = paused ? 0.05 : 1.4;
      id.readerLamp.emissiveIntensity = paused ? 0.05 : 1.2;
      id.screen.emissiveIntensity = paused ? 0.5 : 1.1;
    }

    const lens = rig.beaconLens.material as THREE.MeshStandardMaterial;
    const color = heating ? 0xb02121 : quenching ? 0xd9a400 : 0x1f8f3a;
    lens.color.setHex(color);
    lens.emissive.setHex(color);

    // Phase 3: advance the part flow, move the markers, animate the operator and
    // the GO/NO-GO gage. the bus line.run signal freezes the ambient demo too.
    sim.tick(dt);
    hmi.tick(dt);
    updateActors(station, dt);

    const label = document.getElementById('vp-state');
    if (label) {
      label.textContent = `heat ${Math.round(state.heat * 100)} % · quench ${
        quenching ? 'on' : 'off'
      } · wash ${washing ? 'on' : 'off'} · oven ${
        tempering ? 'on' : 'off'
      } · ${
        heating ? 'heating' : quenching ? 'quenching' : washing ? 'washing' : tempering ? 'tempering' : 'idle'
      }${paused ? ' · paused' : ''}`;
    }
  };

  const loop = (): void => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.1);
    if (bus.asBool('line.run')) update(dt);
    api?.render();
    if (api) updateMachinePanel(api.camera);
    frames += 1;
    fpsFrames += 1;
    fpsTime += dt;
    if (fpsTime >= 0.5) {
      fps = Math.round(fpsFrames / fpsTime);
      fpsFrames = 0;
      fpsTime = 0;
      const s = document.getElementById('vp-stats');
      const tris = api?.triangles() ?? 0;
      if (s) s.textContent = `triangles: ${tris.toLocaleString()} · fps: ${fps}`;
      window.__stats = { triangles: tris, fps };
    }
    window.__frames = frames;
    if (frames === 1) window.__sceneReady = true;
  };
  loop();
}

export function disposeViewport(): void {
  cancelAnimationFrame(raf);
  api?.dispose();
  api = null;
  rootEl.remove();
  window.__sceneReady = false;
}
