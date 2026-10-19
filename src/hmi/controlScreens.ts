/**
 * Phase 4 control screens (training replicas).
 *
 * Reads the extracted registers (src/data/initial-extraction.json and
 * hmi-errors.json) for every documented value and reads/writes the shared
 * signal bus (src/sim/runtime.ts) for every live value.
 *
 * HONESTY (hotzone-rules sections 2 and 6):
 *  - the real PLC/NC program is NOT in the sources: every screen shows
 *    "Simulated logic - not the plant program" and each rule is evidence-tagged.
 *  - forcing a signal shows a forced indicator on every screen and is audit-logged.
 *  - unknown values (subnet masks, gateways, yellow operator fields, thresholds)
 *    are marked, never invented.
 *  - the network screen NEVER scans, pings or touches any real network.
 */
import extractionJson from '../data/initial-extraction.json';
import type { ExtractionFile, ExtractionItem } from '../types/data';
import { SIGNALS, type SignalKey } from '../sim/bus';
import { bus, sim, hmi } from '../sim/runtime';

const extraction = extractionJson as unknown as ExtractionFile;

type Ext = ExtractionItem & { kind: string };

function esc(v: unknown): string {
  return String(v).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  );
}

const byKind = (k: string): Ext[] => (extraction.items as Ext[]).filter((i) => i.kind === k);

// ---------------------------------------------------------------------------
// pure helpers (exported for tests)
// ---------------------------------------------------------------------------

export function validateIpv4(ip: string): boolean {
  const m = ip.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  return m.slice(1).every((p) => {
    const n = Number(p);
    return n >= 0 && n <= 255 && String(n) === p.trim().replace(/^0+(?=\d)/, '');
  });
}

export interface IpDevice {
  id: string;
  name: string;
  ip: string;
  online: boolean;
}

/** ids of devices whose (edited) IP duplicates another device. */
export function findDuplicateIps(devices: IpDevice[]): string[] {
  const seen = new Map<string, string[]>();
  for (const d of devices) {
    const key = d.ip.trim();
    if (!validateIpv4(key)) continue;
    (seen.get(key) ?? seen.set(key, []).get(key)!).push(d.id);
  }
  const dups: string[] = [];
  for (const ids of seen.values()) if (ids.length > 1) dups.push(...ids);
  return dups;
}

export type RoleId = 'Operator' | 'Team Leader' | 'Maintenance' | 'ME / TE' | 'Quality' | 'Metrology';

/** Whether `role` may edit a setup parameter. Operator edits only fields that a
 *  controlled setup document marks "yellow"; none are confirmed here, so the
 *  operator is blocked with the reason shown (never guessed). */
export function editPermission(
  role: RoleId,
  param: { operatorYellowConfirmed?: boolean }
): { allowed: boolean; reason: string } {
  if (role === 'ME / TE') return { allowed: true, reason: 'Manufacturing Engineering may approve parameter changes (RL-004).' };
  if (role === 'Operator') {
    return param.operatorYellowConfirmed
      ? { allowed: true, reason: 'Confirmed operator-yellow setup field (RL-001).' }
      : { allowed: false, reason: 'Not confirmed as an operator-yellow field. No setup document marks it yellow, so the operator edit is blocked (needs controlled setup sheet).' };
  }
  if (role === 'Team Leader' || role === 'Quality' || role === 'Metrology') {
    return { allowed: false, reason: `${role} is not authorised to change setup parameters; escalate to ME / TE (RL-002/RL-005/RL-006).` };
  }
  return { allowed: false, reason: 'Maintenance executes TPM checks, not parameter edits (RL-003).' };
}

/** Alarm conditions the SINUMERIK screen derives from bus signals. */
export function ncAlarmConditions(braxPct: number, readInEnable: boolean, dwellS: number): string[] {
  const out: string[] = [];
  if (braxPct < 3 || braxPct > 3.5) out.push('AL-001');
  if (!readInEnable) out.push('AL-002');
  if (dwellS >= 5.9) out.push('AL-003');
  return out;
}

// ---------------------------------------------------------------------------
// screen state
// ---------------------------------------------------------------------------

const NC = byKind('nc-line');
const OBS = byKind('hmi-observed');
const IP = byKind('ip-device');
const ROLE = byKind('role');
const PARAM = byKind('parameter');
const ALARM = byKind('alarm');

interface UiState {
  screen: ScreenId;
  role: RoleId;
  devices: IpDevice[];
  netHistory: string[];
  recipeHistory: string[];
  paramEdits: Record<string, string>;
  ncIndex: number;
  ncRunning: boolean;
  ncChannel: 'CHAN2' | 'CHAN3';
  feedOverride: number;
  autoidBank: number;
  autoidExposure: number;
  autoidHdr: boolean;
  autoidNoRead: number;
}

export type ScreenId = 'main' | 'sinumerik' | 'inducontrol' | 'autoid' | 'recipe' | 'plc' | 'network' | 'roles';

export const SCREENS: { id: ScreenId; label: string }[] = [
  { id: 'main', label: 'Main HMI' },
  { id: 'sinumerik', label: 'SINUMERIK (NC)' },
  { id: 'inducontrol', label: 'Inducontrol' },
  { id: 'autoid', label: 'AutoID' },
  { id: 'recipe', label: 'Recipe / setup' },
  { id: 'plc', label: 'PLC / IO' },
  { id: 'network', label: 'Network editor' },
  { id: 'roles', label: 'Roles / audit' }
];

let ui: UiState;
/** the one host that currently owns the screen DOM (drawer tab or overlay) */
let activeRender: (() => void) | null = null;
let activeHost: HTMLElement | null = null;
let activeIv: ReturnType<typeof setInterval> | null = null;

/** switch the active screen instance's visible screen (machine overlay + toolbar) */
export function showControlScreen(id: ScreenId): void {
  if (!ui) return;
  ui.screen = id;
  activeRender?.();
}

function resetUi(): void {
  ui = {
    screen: 'main',
    role: 'Operator',
    devices: IP.map((d) => ({ id: d.id, name: d.name, ip: String(d.value), online: true })),
    netHistory: [],
    recipeHistory: [],
    paramEdits: {},
    ncIndex: -1,
    ncRunning: false,
    ncChannel: 'CHAN2',
    feedOverride: 100,
    autoidBank: 1,
    autoidExposure: 120,
    autoidHdr: true,
    autoidNoRead: 0
  };
}

const ABNORMAL: Partial<Record<SignalKey, boolean | number>> = {
  'nc.braxPct': 4.2,
  'nc.dwellS': 8.0,
  'gage.offsetMm': 0.05,
  'line.rate': 8
};

function abnormalValue(key: SignalKey): boolean | number {
  if (ABNORMAL[key] !== undefined) return ABNORMAL[key] as boolean | number;
  const def = SIGNALS.find((s) => s.key === key)?.default ?? false;
  return typeof def === 'boolean' ? !def : 0;
}

// ---------------------------------------------------------------------------
// shared chrome
// ---------------------------------------------------------------------------

function forcedIndicator(): string {
  const f = bus.forcedKeysList();
  if (f.length === 0) return '<span class="badge status-verified">no forced signals</span>';
  return `<span class="badge status-unverified">FORCED: ${f.map(esc).join(', ')}</span>`;
}

function honestyBar(title: string): string {
  return `<div class="cs-honesty">
    <strong>${esc(title)}</strong>
    <span>Simulated logic - not the plant program (NV-022).</span>
    ${forcedIndicator()}
  </div>`;
}

function liveValue(key: SignalKey): string {
  const v = bus.get(key);
  return typeof v === 'number' ? String(Math.round(v * 1000) / 1000) : v ? 'true' : 'false';
}

function auditTable(limit = 20): string {
  const rows = bus.history().slice(-limit).reverse();
  if (rows.length === 0) return '<p class="policy">No signal changes yet.</p>';
  return `<div class="table-wrap"><table><thead><tr><th>t</th><th>signal</th><th>value</th><th>source</th><th>forced</th></tr></thead><tbody>
    ${rows
      .map(
        (r) =>
          `<tr><td class="mono">${r.t.toFixed(1)}</td><td class="mono">${esc(r.key)}</td><td class="value">${esc(
            String(r.value)
          )}</td><td>${esc(r.source)}</td><td>${r.forced ? '<span class="badge status-unverified">forced</span>' : ''}</td></tr>`
      )
      .join('')}
  </tbody></table></div>`;
}

// ---------------------------------------------------------------------------
// screens
// ---------------------------------------------------------------------------

const obsVal = (id: string): string => {
  const o = OBS.find((x) => x.id === id);
  return o ? String(o.value) : '—';
};

function screenMain(): string {
  const param = (label: string, val: string, tick: string) =>
    `<div class="cs-field"><span class="cs-k">${esc(label)}</span><span class="cs-v" data-tick="${tick}">${esc(val)}</span></div>`;
  return `${honestyBar('Main HMI - Nexteer Automotive (training replica)')}
  <p class="policy">Process parameters below are the values <em>observed</em> in the HMI photograph (src/data/hmi-observed). They are screenshot readings only, NOT setpoints, limits or fault conditions. Fields the simulation can drive update live from the signal bus (hotzone-rules section 4).</p>
  <div class="card"><header>PROCESS PARAMETER</header>
    <div class="cs-grid">
      ${param('VOLTAGE %U', obsVal('OB-004'), '')}
      ${param('CURRENT %A', obsVal('OB-005'), '')}
      ${param('POWER %kU', obsVal('OB-006'), '')}
      ${param('FREQUENCY %kHz', obsVal('OB-007'), '')}
      ${param('BELL EXT SHOWER LPM', obsVal('OB-008'), '')}
      ${param('BELL MID SHOWER LPM', obsVal('OB-009'), '')}
      ${param('BELL INT SHOWER LPM', obsVal('OB-010'), '')}
      ${param('STEM SHOWER LPM', obsVal('OB-011'), '')}
      ${param('QUENCH TEMP degC', obsVal('OB-012'), '')}
      ${param('ROTATION RPM', obsVal('OB-013'), '')}
      ${param('BRIX VALUE %', obsVal('OB-014'), '')}
      ${param('DM CONDUCTIVITY uS/cm', obsVal('OB-015'), '')}
    </div></div>
  <div class="cards">
    <article class="card"><header>BELL STN</header>
      <table class="kv">
        <tr><th>JOB ID</th><td class="mono">${esc(obsVal('OB-016'))}</td></tr>
        <tr><th>HEAT TIME (SEC)</th><td class="value" data-tick="bellHeat">${esc(obsVal('OB-018'))}</td></tr>
      </table></article>
    <article class="card"><header>STEM STN</header>
      <table class="kv">
        <tr><th>JOB ID</th><td class="mono">${esc(obsVal('OB-017'))}</td></tr>
        <tr><th>HEAT TIME (SEC)</th><td class="value" data-tick="stemHeat">${esc(obsVal('OB-019'))}</td></tr>
      </table></article>
    <article class="card"><header>live (simulated)</header>
      <table class="kv">
        <tr><th>line run</th><td data-tick="line.run">${liveValue('line.run')}</td></tr>
        <tr><th>laser enabled</th><td data-tick="laser.enabled">${liveValue('laser.enabled')}</td></tr>
        <tr><th>parts tracked</th><td data-tick="parts">${sim.parts.length}</td></tr>
        <tr><th>boxed good</th><td data-tick="boxed">${sim.boxedCount}</td></tr>
      </table></article>
  </div>
  <p class="policy">Navigation (from HM-004): <button class="cs-tab" data-goto="inducontrol">TRACEABILITY</button>
    <button class="cs-tab" data-goto="plc">OPERATIONS</button>
    <button class="cs-tab" data-goto="recipe">RECIPE</button> — PRESS indicators in the original.</p>
  <div class="card"><header>ALARMS (simulated - lifecycle check)</header>
    <div class="cs-row"><span class="cs-v" data-tick="alarm-banner">HMI: System OK</span></div>
    <pre class="cs-log" data-tick="alarm-list">no active alarms</pre>
    <div class="cs-row">
      <button class="vp-btn" data-action="alarm-ack">ack all</button>
      <button class="vp-btn" data-action="alarm-clear">clear all</button>
    </div>
    <p class="policy">Triggers live on the machine panels of the 3D line (step 3). Each alarm carries the REAL code from the extracted register; the ack/clear lifecycle here is simulated - not the plant program (NV-022).</p>
  </div>`;
}

function screenSinumerik(): string {
  const chan = ui.ncChannel;
  const chanLines = NC.filter((l) => l.name.toUpperCase().includes(chan === 'CHAN2' ? 'BELL' : 'STEM'));
  const prog = chan === 'CHAN2' ? 'NC/MPF/BELL' : 'NC/MPF/STEM';
  const alarms = ncAlarmConditions(bus.asNumber('nc.braxPct'), bus.asBool('nc.readInEnable'), bus.asNumber('nc.dwellS'));
  const alarmRows = alarms
    .map((id) => {
      const a = ALARM.find((x) => x.id === id);
      return a
        ? `<tr><td class="mono">${esc(id)}</td><td class="value">${esc(String(a.value))}</td><td>${esc(a.notes ?? '')}</td></tr>`
        : '';
    })
    .join('');
  const blockRows = chanLines
    .map((l, i) => {
      const active = i === ui.ncIndex ? ' class="cs-active"' : '';
      const illegible = l.name.includes('illegible');
      return `<tr${active}><td class="mono small">${esc(l.name)}</td><td class="value">${esc(
        String(l.value)
      )}${illegible ? ' <span class="badge status-unverified">illegible in source (NV-005)</span>' : ''}</td></tr>`;
    })
    .join('');
  return `${honestyBar(`SINUMERIK-style control (training replica) · machine label 700826 (HM-001)`)}
  <div class="cs-row">
    <label>channel
      <select data-action="nc-channel">
        <option value="CHAN2"${chan === 'CHAN2' ? ' selected' : ''}>CHAN2 - ${'NC/MPF/BELL'}</option>
        <option value="CHAN3"${chan === 'CHAN3' ? ' selected' : ''}>CHAN3 - ${'NC/MPF/STEM'}</option>
      </select></label>
    <span class="badge">program: ${esc(prog)}</span>
    <span class="cs-k">read-in enable: <span data-tick="nc.readInEnable">${liveValue('nc.readInEnable')}</span></span>
    <button class="vp-btn" data-force="nc.readInEnable">Force read-in</button>
  </div>
  <div class="cs-row">
    <button class="vp-btn" data-action="nc-run">${ui.ncRunning ? 'Stop' : 'Run'}</button>
    <button class="vp-btn" data-action="nc-step">Single block</button>
    <button class="vp-btn" data-action="nc-reset">NC reset</button>
    <span class="cs-k">state: <strong>${ui.ncRunning ? 'RUN' : ui.ncIndex < 0 ? 'RESET' : 'STOP'}</strong></span>
    <label class="cs-k">feed override <input type="number" min="0" max="150" step="5" value="${ui.feedOverride}" data-action="nc-feed" style="width:70px"/> %</label>
  </div>
  <div class="cards">
    <article class="card"><header>NC program editor (documented lines only)</header>
      <p class="policy">Only lines legible in the supplied photograph are shown (NC-001..NC-010). Everything else would be a simulation assumption and is not invented here.</p>
      <div class="table-wrap"><table><thead><tr><th>block</th><th>line</th></tr></thead><tbody>${blockRows || '<tr><td colspan="2">no documented lines for this channel</td></tr>'}</tbody></table></div></article>
    <article class="card"><header>machine status / axes</header>
      <table class="kv">
        <tr><th>Z2 position</th><td class="mono">${esc(obsVal('OB-001'))}</td></tr>
        <tr><th>A2 position</th><td class="mono">${esc(obsVal('OB-002'))}</td></tr>
        <tr><th>Z3 position</th><td class="mono">${esc(obsVal('OB-003'))}</td></tr>
      </table>
      <p class="policy">Positions are the observed values (dist-to-go 0.000). Editing a block to change motion is Phase 5.</p></article>
    <article class="card"><header>alarm list (produced by live bus conditions)</header>
      ${alarmRows
        ? `<div class="table-wrap"><table><thead><tr><th>id</th><th>text</th><th>source</th></tr></thead><tbody>${alarmRows}</tbody></table></div>`
        : '<p class="policy">No NC alarms active.</p>'}
      <div class="cs-row">
        <label class="cs-k">BRAX % <input type="number" step="0.05" value="${bus.asNumber('nc.braxPct')}" data-action="nc-brax" style="width:80px"/></label>
        <button class="vp-btn" data-force="nc.braxPct">Force BRAX</button>
        <label class="cs-k">F12 dwell s <input type="number" step="0.1" value="${bus.asNumber('nc.dwellS')}" data-action="nc-dwell" style="width:80px"/></label>
        <button class="vp-btn" data-force="nc.dwellS">Force dwell</button>
      </div>
      <p class="policy">Observed status texts: AL-001 "BRAX % OUT OF RANGE: 3 - 3.5", AL-002 "Wait: Read-in enable missing", AL-003 "F12 dwell time still 5.9s" (photo 4.20.44 PM.jpeg). Band 3-3.5 is an observed reading, not a validated limit.</p></article>
  </div>`;
}

function screenInducontrol(): string {
  const field = (k: string, v: string) =>
    `<div class="cs-field"><span class="cs-k">${esc(k)}</span><span class="cs-v">${esc(v)}</span></div>`;
  return `${honestyBar('Inducontrol-style dashboard (training replica)')}
  <div class="card"><header>NEXTEER AUTOMOTIVE — logs SMITA / SAET / IBI (HM-002)</header>
    <div class="cs-grid">
      ${field('VOLTAGE %U', obsVal('OB-004'))}
      ${field('CURRENT %A', obsVal('OB-005'))}
      ${field('POWER %kU', obsVal('OB-006'))}
      ${field('FREQUENCY %kHz', obsVal('OB-007'))}
      ${field('BELL EXT SHOWER LPM', obsVal('OB-008'))}
      ${field('BELL MID SHOWER LPM', obsVal('OB-009'))}
      ${field('BELL INT SHOWER LPM', obsVal('OB-010'))}
      ${field('STEM SHOWER LPM', obsVal('OB-011'))}
      ${field('QUENCH TEMP degC', obsVal('OB-012'))}
      ${field('ROTATION RPM', obsVal('OB-013'))}
      ${field('BRIX VALUE %', obsVal('OB-014'))}
      ${field('DM CONDUCTIVITY uS/cm', obsVal('OB-015'))}
    </div>
    <p class="policy">All fields are observed screenshot readings (src/data/hmi-observed), not setpoints. They are not yet wired to the sim (Phase 5) and stay labelled observed.</p></div>
  <div class="card"><header>shower-flow trend (observed)</header>
    <svg viewBox="0 0 520 120" class="cs-graph" role="img" aria-label="shower flow trend">
      <rect x="40" y="30" width="450" height="20" fill="#1f8f3a" opacity="0.25"/>
      <line x1="40" y1="40" x2="490" y2="40" stroke="#1f8f3a" stroke-width="1"/>
      <line x1="40" y1="100" x2="490" y2="100" stroke="#555" stroke-width="1"/>
      <text x="4" y="44" font-size="9" fill="#ccc">105</text>
      <text x="4" y="104" font-size="9" fill="#ccc">100</text>
      <circle cx="300" cy="18" r="4" fill="#b02121"/>
      <text x="250" y="14" font-size="9" fill="#b02121">Bell ext 117.9 LPM observed</text>
    </svg>
    <p class="policy">The green band is the documented Bell External Shower band 100-105 LPM (PR-013). The observed 117.9 LPM (OB-008) sits above it — preserved as NV-010, not corrected. The caption threshold "300 L/min" is NOT legible in the photo file (NV-013) and is not plotted.</p></div>
  <div class="cs-row">
    <button class="cs-tab" data-goto="recipe">RECIPE</button>
    <button class="cs-tab" data-goto="main">TRACEABILITY</button>
    <button class="vp-btn" data-action="learn">Learn</button>
    <span class="badge">Learn function = Phase 6 (not built)</span>
  </div>`;
}

function autoidPattern(seed: number): string {
  let cells = '';
  for (let y = 0; y < 14; y++) {
    for (let x = 0; x < 14; x++) {
      const on = ((x * 7 + y * 13 + seed * 3) % 5) < 2;
      if (on) cells += `<rect x="${x * 10 + 40}" y="${y * 10 + 10}" width="10" height="10" fill="#ddd"/>`;
    }
  }
  return cells;
}

function readRate(): number {
  const bankScore = [0, 1, 1, 0.9, 0.8, 0.7][ui.autoidBank] ?? 0.7;
  const expo = ui.autoidExposure;
  const expoScore = expo >= 94 && expo <= 153 ? 1 : expo < 94 ? 0.5 : 0.6;
  const hdr = ui.autoidHdr ? 1 : 0.7;
  return Math.round(bankScore * expoScore * hdr * 100);
}

function screenAutoid(): string {
  const rate = readRate();
  return `${honestyBar('AutoID (KEYENCE AutoID Network Navigator) - illustrative')}
  <p class="policy">Illustrative reader mimic. The reader designation observed in the photograph is "SR-20AH", which the manufacturer lists as a high-resolution lens attachment, NOT a standalone reader (NV-023). Setup software "AutoID Network Navigator" and the tuning banks / exposure fields are documented in HM-003.</p>
  <div class="cards">
    <article class="card"><header>virtual camera image</header>
      <svg viewBox="0 0 200 170" class="cs-cam">
        <rect x="0" y="0" width="200" height="170" fill="#101418"/>
        <g>${autoidPattern(ui.autoidBank)}</g>
        <rect x="38" y="8" width="144" height="144" fill="none" stroke="#1f8f3a" stroke-dasharray="4 3"/>
      </svg>
      <p class="policy">A synthetic DataMatrix-like pattern, not a real part image.</p></article>
    <article class="card"><header>read result</header>
      <table class="kv">
        <tr><th>virtual read rate</th><td class="value">${rate} %</td></tr>
        <tr><th>last read</th><td>${rate > 80 ? '<span class="badge status-verified">OK</span>' : '<span class="badge status-unverified">NO-READ → reject</span>'}</td></tr>
        <tr><th>no-read rejects</th><td>${ui.autoidNoRead}</td></tr>
      </table>
      <div class="cs-row">
        <label class="cs-k">tuning bank
          <select data-action="autoid-bank">${[1, 2, 3, 4, 5].map((b) => `<option value="${b}"${ui.autoidBank === b ? ' selected' : ''}>${b}</option>`).join('')}</select></label>
        <label class="cs-k">exposure us
          <input type="number" min="50" max="200" step="1" value="${ui.autoidExposure}" data-action="autoid-expo" style="width:80px"/></label>
        <button class="vp-btn" data-action="autoid-hdr">HDR ${ui.autoidHdr ? 'on' : 'off'}</button>
        <button class="vp-btn" data-action="autoid-test">Test read</button>
      </div>
      <p class="policy">Observed exposure range 94-153 us (HM-003). Poor exposure or tuning lowers the virtual read rate and produces no-read rejects. Verification status of these controls is illustrative only.</p></article>
  </div>`;
}

function screenRecipe(): string {
  const rows = PARAM.map((p) => {
    const edit = ui.paramEdits[p.id];
    const perm = editPermission(ui.role, {});
    return `<tr>
      <td class="mono">${esc(p.id)}</td>
      <td>${esc(p.name)}</td>
      <td class="value">${esc(edit ?? String(p.value))}${edit ? ' <span class="badge status-unverified">edited</span>' : ''}</td>
      <td>${esc(p.evidence.sourceId)}${p.evidence.page ? ' p.' + esc(p.evidence.page) : ''}</td>
      <td><span class="badge cat-${esc(p.evidence.category)}">${esc(p.evidence.category)}</span>
          <span class="badge status-${esc(p.evidence.status)}">${esc(p.evidence.status)}</span></td>
      <td>${perm.allowed ? `<button class="vp-btn" data-edit="${esc(p.id)}">edit (${esc(ui.role)})</button>` : `<span class="notes">blocked: ${esc(perm.reason)}</span>`}</td>
    </tr>`;
  }).join('');
  return `${honestyBar('Recipe / setup editor')}
  <p class="policy">Editing rule (RL-001, RL-004): the Operator may change only fields a controlled setup document marks "yellow"; none are confirmed in the sources, so every operator edit is blocked with that reason. ME / TE may approve changes. All edits here are simulation-only and are logged. GD-002 (OPD pin diameters) is an example, not a program table (NV-014).</p>
  <div class="table-wrap"><table>
    <thead><tr><th>id</th><th>parameter</th><th>value</th><th>source</th><th>verification</th><th>edit</th></tr></thead>
    <tbody>${rows}</tbody></table></div>
  <div class="card"><header>change history (simulated)</header>
    ${ui.recipeHistory.length ? `<ul class="cs-log">${ui.recipeHistory.slice().reverse().map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : '<p class="policy">No changes.</p>'}</div>`;
}

function interlockChain(): string {
  const door = bus.asBool('io.doorClosed');
  const air = bus.asBool('io.airPressureOk');
  const ep = bus.asBool('io.epResult');
  const quench = bus.asBool('io.quenchFlowOk');
  const safetyRelay = door;
  const axisEnable = door && safetyRelay;
  const cycleStart = air && axisEnable;
  const inductionEnable = ep && cycleStart;
  const heatPermission = quench && inductionEnable;
  const node = (label: string, on: boolean) => `<span class="cs-node ${on ? 'on' : 'off'}">${esc(label)}</span>`;
  const arrow = (on: boolean) => `<span class="cs-arrow ${on ? 'on' : 'off'}">→</span>`;
  return `
    <div class="cs-chain">${node('door latch', door)}${arrow(door)}${node('safety relay', safetyRelay)}${arrow(safetyRelay)}${node('axis enable', axisEnable)}</div>
    <div class="cs-chain">${node('air pressure', air)}${arrow(cycleStart)}${node('cycle start', cycleStart)}</div>
    <div class="cs-chain">${node('EP result', ep)}${arrow(inductionEnable)}${node('induction enable', inductionEnable)}</div>
    <div class="cs-chain">${node('quench flow', quench)}${arrow(heatPermission)}${node('heat permission', heatPermission)}</div>`;
}

function screenPlc(): string {
  const ioRows = SIGNALS.map((s) => {
    const forced = bus.isForced(s.key);
    return `<tr>
      <td class="mono">${esc(s.key)}</td>
      <td>${esc(s.label)}</td>
      <td class="value" data-live="${esc(s.key)}">${esc(liveValue(s.key))}</td>
      <td>${esc(s.unit)}</td>
      <td>${forced ? '<span class="badge status-unverified">FORCED</span>' : '<span class="badge status-verified">normal</span>'}</td>
      <td><button class="vp-btn" data-force="${esc(s.key)}">${forced ? 'unforce' : 'force'}</button></td>
    </tr>`;
  }).join('');
  const stageCount = new Map<string, number>();
  for (const p of sim.parts) stageCount.set(p.stage, (stageCount.get(p.stage) ?? 0) + 1);
  const seq = ['INFEED', 'WASH', 'WASH2', 'MARKING', 'READING', 'HEATING', 'QUENCHING', 'TEMPERING', 'COOLING', 'GAGING', 'BOXED', 'REJECTED']
    .map((st) => `<tr><td class="mono">${esc(st)}</td><td class="value">${stageCount.get(st) ?? 0}</td></tr>`)
    .join('');
  return `${honestyBar('PLC / IO screens (training replica)')}
  <div class="cs-row">
    <button class="vp-btn" data-action="unforce-all">unforce all</button>
    <button class="vp-btn" data-action="bus-reset">reset bus</button>
    <span class="cs-k">audit log entries: ${bus.history().length}</span>
  </div>
  <div class="cards">
    <article class="card"><header>IO table with Force</header>
      <p class="policy">Forcing sets a simulated signal only. A forced signal is blocked from normal writes, shown as FORCED on every screen, and written to the audit log. There is no physical IO here.</p>
      <div class="table-wrap"><table><thead><tr><th>tag</th><th>label</th><th>value</th><th>unit</th><th>state</th><th>force</th></tr></thead><tbody>${ioRows}</tbody></table></div></article>
    <article class="card"><header>ladder / interlock (simulated logic)</header>
      ${interlockChain()}
      <div class="cs-row">
        ${['io.doorClosed', 'io.airPressureOk', 'io.epResult', 'io.quenchFlowOk']
          .map((k) => `<button class="vp-btn" data-force="${k}">toggle ${esc(k.replace('io.', ''))}</button>`)
          .join('')}
      </div>
      <p class="policy">Energised (green) path is computed from the bus booleans. The real interlock program is not in the sources (NV-022) — these are scenario rules, not the plant program.</p></article>
    <article class="card"><header>sequencer (from the tracked part flow)</header>
      <div class="table-wrap"><table><thead><tr><th>stage</th><th>parts</th></tr></thead><tbody>${seq}</tbody></table></div></article>
    <article class="card"><header>alarm / event history</header>${auditTable(16)}</article>
  </div>`;
}

function screenNetwork(): string {
  const dups = new Set(findDuplicateIps(ui.devices));
  const rows = ui.devices.map((d) => {
    const valid = validateIpv4(d.ip);
    const dup = dups.has(d.id);
    const shared = d.id === 'IP-009' || d.id === 'IP-015';
    return `<tr>
      <td class="mono">${esc(d.id)}</td>
      <td>${esc(d.name)}</td>
      <td><input class="cs-ip ${valid ? '' : 'invalid'}" data-ip="${esc(d.id)}" value="${esc(d.ip)}" style="width:130px"/>
          ${!valid ? '<span class="badge status-unverified">invalid IPv4</span>' : ''}
          ${dup ? '<span class="badge status-unverified">duplicate IP</span>' : ''}
          ${shared ? '<span class="badge">IP-009 & IP-015 share this address (NV-002)</span>' : ''}</td>
      <td><button class="vp-btn" data-online="${esc(d.id)}">${d.online ? 'online' : 'offline'}</button></td>
    </tr>`;
  }).join('');
  return `${honestyBar('Virtual network editor')}
  <p class="policy">Offline training only. <strong>Never scan, ping, connect to, or send traffic to any real Nexteer or industrial network.</strong> Changing a virtual IP affects this simulation only. Subnet masks and gateways are NOT in the sources and are deliberately not shown (NV-002).</p>
  <div class="table-wrap"><table><thead><tr><th>id</th><th>device</th><th>IP address (editable)</th><th>state</th></tr></thead><tbody>${rows}</tbody></table></div>
  <div class="cards">
    <article class="card"><header>scenarios</header>
      <div class="cs-row">
        <button class="vp-btn" data-action="net-reader-loss">reader loss (IP-015)</button>
        <button class="vp-btn" data-action="net-laser-loss">laser loss (IP-011)</button>
        <button class="vp-btn" data-action="net-profinet">PROFINET fault</button>
        <button class="vp-btn" data-action="net-reset">reset scenario</button>
      </div></article>
    <article class="card"><header>change history</header>
      ${ui.netHistory.length ? `<ul class="cs-log">${ui.netHistory.slice().reverse().map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : '<p class="policy">No changes.</p>'}</article>
  </div>`;
}

function screenRoles(): string {
  const roles = ROLE.map((r) => `<tr>
    <td class="mono">${esc(r.id)}</td>
    <td>${esc(r.name)}</td>
    <td>${esc(String(r.value))}</td>
    <td>${r.name.startsWith(ui.role) || esc(r.name).includes(esc(ui.role)) ? '<span class="badge status-verified">logged in</span>' : ''}</td>
  </tr>`).join('');
  return `${honestyBar('Roles and audit log')}
  <div class="cs-row">
    <label class="cs-k">login as
      <select data-action="role">
        ${(['Operator', 'Team Leader', 'Maintenance', 'ME / TE', 'Quality', 'Metrology'] as RoleId[])
          .map((r) => `<option value="${esc(r)}"${ui.role === r ? ' selected' : ''}>${esc(r)}</option>`)
          .join('')}
      </select></label>
    <span class="cs-k">current role: <strong>${esc(ui.role)}</strong></span>
  </div>
  <div class="table-wrap"><table><thead><tr><th>id</th><th>role</th><th>permissions (documented)</th><th>session</th></tr></thead><tbody>${roles}</tbody></table></div>
  <div class="card"><header>audit log (all screens share one bus)</header>${auditTable(20)}</div>`;
}

function screenHtml(): string {
  switch (ui.screen) {
    case 'main': return screenMain();
    case 'sinumerik': return screenSinumerik();
    case 'inducontrol': return screenInducontrol();
    case 'autoid': return screenAutoid();
    case 'recipe': return screenRecipe();
    case 'plc': return screenPlc();
    case 'network': return screenNetwork();
    case 'roles': return screenRoles();
  }
}

// ---------------------------------------------------------------------------
// mount
// ---------------------------------------------------------------------------

export function mountControlScreens(host: HTMLElement, initialScreen?: ScreenId): void {
  // only one mounted instance owns the shared ui state; a previous instance's
  // DOM is gone once its host is detached, so take over cleanly
  if (activeIv !== null) {
    clearInterval(activeIv);
    activeIv = null;
  }
  activeHost = host;
  resetUi();
  if (initialScreen) ui.screen = initialScreen;
  host.classList.add('cs-root');

  const render = (): void => {
    if (activeHost !== host) return;
    const nav = SCREENS.map(
      (s) => `<button class="cs-tab${ui.screen === s.id ? ' active' : ''}" data-screen="${s.id}">${esc(s.label)}</button>`
    ).join('');
    host.innerHTML = `<div class="cs-nav">${nav}</div>
      <p class="policy">Educational training replicas of the plant HMI/PLC/NC screens. ${esc(
        'Verify against master controlled copies before operational use.'
      )}</p>
      <div class="cs-screen">${screenHtml()}</div>`;
  };

  const tick = (): void => {
    // stop the loop when this host was replaced/released (tab switch, overlay close)
    if (!host.isConnected) {
      if (activeIv !== null) clearInterval(activeIv);
      activeIv = null;
      if (activeHost === host) {
        activeHost = null;
        activeRender = null;
      }
      return;
    }
    host.querySelectorAll<HTMLElement>('[data-live]').forEach((el) => {
      const k = el.dataset.live as SignalKey | undefined;
      if (k) el.textContent = liveValue(k);
    });
    host.querySelectorAll<HTMLElement>('[data-tick]').forEach((el) => {
      const t = el.dataset.tick;
      if (t === 'line.run') el.textContent = liveValue('line.run');
      else if (t === 'laser.enabled') el.textContent = liveValue('laser.enabled');
      else if (t === 'parts') el.textContent = String(sim.parts.length);
      else if (t === 'boxed') el.textContent = String(sim.boxedCount);
      else if (t === 'bellHeat') el.textContent = sim.parts.find((p) => p.stage === 'HEATING')?.heatIndex.toFixed(2) ?? '0.00';
      else if (t === 'stemHeat') el.textContent = sim.parts.find((p) => p.stage === 'TEMPERING')?.heatIndex.toFixed(2) ?? '0.00';
      else if (t === 'alarm-banner') {
        const act = hmi.activeAlarms();
        el.textContent = act.length === 0 ? 'HMI: System OK' : `HMI: ${act.length} active alarm${act.length === 1 ? '' : 's'}`;
      } else if (t === 'alarm-list') {
        const act = hmi.activeAlarms();
        el.textContent =
          act.length === 0
            ? 'no active alarms'
            : act
                .map((a) => `${a.code}  ${a.id}  ${a.state}${a.text ? ' - ' + a.text : ''}`)
                .join('\n');
      }
    });
  };

  host.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const screenBtn = t.closest<HTMLElement>('[data-screen]');
    if (screenBtn) { ui.screen = screenBtn.dataset.screen as ScreenId; render(); return; }
    const goto = t.closest<HTMLElement>('[data-goto]');
    if (goto) { ui.screen = goto.dataset.goto as ScreenId; render(); return; }

    const forceBtn = t.closest<HTMLElement>('[data-force]');
    if (forceBtn) {
      const key = forceBtn.dataset.force as SignalKey;
      if (bus.isForced(key)) bus.unforce(key);
      else bus.force(key, abnormalValue(key), `PLC force (${ui.role})`);
      render(); return;
    }
    const onlineBtn = t.closest<HTMLElement>('[data-online]');
    if (onlineBtn) {
      const d = ui.devices.find((x) => x.id === onlineBtn.dataset.online);
      if (d) { d.online = !d.online; ui.netHistory.push(`${d.id} (${d.name}) → ${d.online ? 'online' : 'offline'}`); render(); }
      return;
    }
    const editBtn = t.closest<HTMLElement>('[data-edit]');
    if (editBtn) {
      const id = editBtn.dataset.edit!;
      const p = PARAM.find((x) => x.id === id);
      if (p) {
        const perm = editPermission(ui.role, {});
        if (!perm.allowed) { window.alert(`Edit blocked: ${perm.reason}`); return; }
        const next = window.prompt(`New value for ${p.id} — ${p.name} (currently ${ui.paramEdits[id] ?? p.value})`, ui.paramEdits[id] ?? String(p.value));
        if (next !== null && next.trim() !== '') {
          ui.paramEdits[id] = next.trim();
          ui.recipeHistory.push(`${p.id} ${p.name}: ${p.value} → ${next.trim()} (simulated, by ${ui.role})`);
        }
        render();
      }
      return;
    }
    const action = t.closest<HTMLElement>('[data-action]')?.dataset.action;
    if (!action) return;
    switch (action) {
      case 'nc-run': ui.ncRunning = !ui.ncRunning; if (ui.ncRunning && ui.ncIndex < 0) ui.ncIndex = 0; render(); break;
      case 'nc-step': {
        const lines = NC.filter((l) => l.name.toUpperCase().includes(ui.ncChannel === 'CHAN2' ? 'BELL' : 'STEM'));
        ui.ncRunning = false;
        ui.ncIndex = lines.length ? (ui.ncIndex + 1) % lines.length : -1;
        render(); break;
      }
      case 'nc-reset': ui.ncRunning = false; ui.ncIndex = -1; render(); break;
      case 'autoid-hdr': ui.autoidHdr = !ui.autoidHdr; render(); break;
      case 'autoid-test': if (readRate() <= 80) ui.autoidNoRead += 1; render(); break;
      case 'learn': window.alert('Learn function is Phase 6 and is not built yet.'); break;
      case 'unforce-all': for (const k of bus.forcedKeysList()) bus.unforce(k); render(); break;
      case 'bus-reset': bus.reset(); render(); break;
      case 'alarm-ack': hmi.ackAll(); render(); break;
      case 'alarm-clear': hmi.clearAll(); render(); break;
      case 'net-reader-loss': ui.netHistory.push('scenario: reader IP-015 offline (simulated)'); setOffline('IP-015'); render(); break;
      case 'net-laser-loss': ui.netHistory.push('scenario: laser IP-011 offline (simulated)'); setOffline('IP-011'); render(); break;
      case 'net-profinet': ui.netHistory.push('scenario: PROFINET fault on IP-005..IP-008 (simulated)'); ['IP-005', 'IP-006', 'IP-007', 'IP-008'].forEach(setOffline); render(); break;
      case 'net-reset': ui.devices.forEach((d) => (d.online = true)); ui.netHistory.push('reset all devices to online'); render(); break;
      default: break;
    }
  });

  host.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement | HTMLSelectElement;
    const action = t.dataset.action;
    if (!action) return;
    if (action === 'nc-channel') { ui.ncChannel = t.value as 'CHAN2' | 'CHAN3'; ui.ncIndex = -1; ui.ncRunning = false; }
    else if (action === 'nc-feed') ui.feedOverride = Number(t.value);
    else if (action === 'nc-brax') bus.set('nc.braxPct', Number(t.value), 'SINUMERIK entry');
    else if (action === 'nc-dwell') bus.set('nc.dwellS', Number(t.value), 'SINUMERIK entry');
    else if (action === 'autoid-bank') ui.autoidBank = Number(t.value);
    else if (action === 'autoid-expo') ui.autoidExposure = Number(t.value);
    else if (action === 'role') ui.role = t.value as RoleId;
    render();
  });

  host.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    const id = t.dataset.ip;
    if (!id) return;
    const d = ui.devices.find((x) => x.id === id);
    if (!d) return;
    const next = t.value.trim();
    ui.netHistory.push(`${id} (${d.name}): ${d.ip} → ${next}${validateIpv4(next) ? '' : ' (invalid IPv4, kept for training)'}`);
    d.ip = next;
    render();
  });

  function setOffline(id: string): void {
    const d = ui.devices.find((x) => x.id === id);
    if (d) d.online = false;
  }

  render();
  activeRender = render;
  activeIv = setInterval(tick, 500);
}
