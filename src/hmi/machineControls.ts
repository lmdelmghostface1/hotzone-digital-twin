/**
 * Per-machine operable controls (3D-first rebuild step 3).
 *
 * The anchored machine panel gets a control section driven ONLY through the
 * shared signal bus (hotzone-rules 4: one bus is the single source of truth;
 * nothing animates from a hidden variable).
 *
 * HONESTY (hotzone-rules 2/6):
 *  - the section header says "simulated logic - not the plant program";
 *  - ambient toggles are labelled scene visuals, NOT process setpoints;
 *  - fault buttons raise the REAL register codes from the extracted HMI alarm
 *    register; the trigger wiring itself is an educational inference (NV-022);
 *  - forcing any signal shows a FORCED indicator here and in the audit log,
 *    and blocks normal writes until it is unforced;
 *  - a button always changes state or explains inline why it is blocked.
 */
import { bus, hmi, sim } from '../sim/runtime';
import { SIGNALS, type SignalKey } from '../sim/bus';
import type { Faults } from './hmiSim';
import { FAULT_ALARMS } from './hmiSim';
import type { ScreenId } from './controlScreens';
import { SCREENS } from './controlScreens';

export type ControlDef =
  | {
      kind: 'toggle';
      signal: SignalKey;
      label: string;
      note?: string;
      /** turn these signals off when this one is switched on */
      exclusiveWith?: SignalKey[];
    }
  | {
      kind: 'number';
      signal: SignalKey;
      label: string;
      min: number;
      max: number;
      step: number;
      note?: string;
    }
  | {
      kind: 'fault';
      fault: keyof Faults;
      label: string;
      note?: string;
    };

const CONTROLS_BY_STATION: Partial<Record<string, ControlDef[]>> = {
  INDUCTION: [
    {
      kind: 'toggle',
      signal: 'amb.heating',
      label: 'HEAT glow',
      note: 'scene visual only, not a heated zone status',
      exclusiveWith: ['amb.quenching']
    },
    {
      kind: 'toggle',
      signal: 'amb.quenching',
      label: 'QUENCH spray',
      note: 'scene visual only, not a quench flow status',
      exclusiveWith: ['amb.heating']
    },
    { kind: 'fault', fault: 'heatFault', label: 'trigger HEAT fault', note: 'DM high level temperature' },
    { kind: 'fault', fault: 'quenchFault', label: 'trigger QUENCH fault', note: 'quench temperature low limit' }
  ],
  'WASH-BLANK': [
    {
      kind: 'toggle',
      signal: 'amb.washing',
      label: 'WASH spray',
      note: 'shared with the TP/CV tunnel (one amb.washing signal, scene visual)'
    }
  ],
  'WASH-TPCV': [
    {
      kind: 'toggle',
      signal: 'amb.washing',
      label: 'WASH spray',
      note: 'shared with the blank wash (one amb.washing signal, scene visual)'
    }
  ],
  OVEN: [
    {
      kind: 'toggle',
      signal: 'amb.tempering',
      label: 'OVEN glow',
      note: 'scene visual only, not an oven temperature'
    }
  ],
  MARKING: [
    { kind: 'toggle', signal: 'laser.enabled', label: 'LASER on/off', note: 'parts arriving unmarked are rejected at the reader' },
    { kind: 'fault', fault: 'laserDisabled', label: 'trigger LASER fault', note: 'laser unit not ready' }
  ],
  READER: [
    { kind: 'fault', fault: 'damagedCode', label: 'trigger SCAN fault', note: '2D scanner reading error, job rejected' }
  ],
  UNLOAD: [
    { kind: 'fault', fault: 'conveyorStop', label: 'STOP conveyor', note: 'unloading conveyor motor MPU trip' }
  ],
  BOXING: [
    { kind: 'fault', fault: 'conveyorStop', label: 'STOP conveyor', note: 'unloading conveyor motor MPU trip' }
  ],
  GAGE: [
    {
      kind: 'fault',
      fault: 'gageForceNok',
      label: 'force NO-GO',
      note: 'height not within range, job rejected'
    },
    {
      kind: 'number',
      signal: 'gage.offsetMm',
      label: 'gage offset (mm)',
      min: -0.005,
      max: 0.005,
      step: 0.001,
      note: 'illustrative offset, not a plant tolerance (NV-014)'
    }
  ]
};

/**
 * Which training replica (Phase 4 screen) observes each machine, offered as
 * "screens" buttons in the machine panel (step 4). Only screens that actually
 * show live data for that machine are listed; recipe/network/roles stay on
 * the toolbar button. Pairings are an educational inference (NV-022).
 */
export const SCREENS_BY_STATION: Partial<Record<string, ScreenId[]>> = {
  INDUCTION: ['inducontrol', 'sinumerik'],
  'WASH-BLANK': ['main'],
  'WASH-TPCV': ['main'],
  OVEN: ['main'],
  MARKING: ['autoid'],
  READER: ['autoid'],
  UNLOAD: ['plc'],
  BOXING: ['plc'],
  GAGE: ['main']
};

export function screensForStation(station: string): ScreenId[] {
  return SCREENS_BY_STATION[station] ?? [];
}

export function controlsForStation(station: string): ControlDef[] {
  return CONTROLS_BY_STATION[station] ?? [];
}

/** builds the control section skeleton once per selection and binds handlers.
 *  per-state updates happen only in tickMachineControls so focus sticks. */
export function buildMachineControls(
  host: HTMLElement,
  station: string,
  unoperableNote?: string
): void {
  const controls = controlsForStation(station);
  const screenDefs = screensForStation(station);
  const labelOf = (id: ScreenId): string => SCREENS.find((s) => s.id === id)?.label ?? id;
  const screensRow = screenDefs.length
    ? `<div class="vp-m-h">screens — training replicas of the real screens</div>
    <div class="vp-row vp-m-buttons vp-m-screenrow">
      ${screenDefs
        .map((id) => `<button class="vp-btn vp-m-screen" type="button" data-mscreen="${esc(id)}">${esc(labelOf(id))}<small>opens the replica that observes this machine</small></button>`)
        .join('')}
    </div>`
    : '';
  host.innerHTML = `
    <div class="vp-m-h">controls — simulated logic, not the plant program (NV-022)</div>
    ${unoperableNote
      ? `<div class="vp-m-note">${escapeHtml(unoperableNote)}</div>`
      : `<div class="vp-row vp-m-buttons">
      ${controls
        .map((c) => {
          if (c.kind === 'toggle') {
            return `<button class="vp-btn vp-m-toggle" type="button" data-mtoggle="${esc(c.signal)}" data-mexclusive="${esc(
              (c.exclusiveWith ?? []).join(' ')
            )}">${esc(c.label)}${c.note ? `<small>${esc(c.note)}</small>` : ''}</button>`;
          }
          if (c.kind === 'fault') {
            return `<button class="vp-btn vp-m-fault" type="button" data-mfault="${esc(c.fault)}">${esc(
              c.label
            )}<small>→ ${esc(FAULT_ALARMS[c.fault])}${c.note ? ' · ' + esc(c.note) : ''}</small></button>`;
          }
          return `<label class="vp-m-num">${esc(c.label)}
            <input type="number" data-minput="${esc(c.signal)}" min="${c.min}" max="${c.max}" step="${c.step}"/>
            <small>${esc(c.note ?? '')}</small></label>`;
        })
        .join('')}
    </div>
    ${screensRow}
    <div class="vp-m-forced" data-mrole="forced"></div>
    <div class="vp-m-msg" data-mrole="msg"></div>
    <div class="vp-m-h">audit log (simulated)</div>
    <pre class="vp-m-audit" data-mrole="audit"></pre>`}`;

  host.querySelectorAll<HTMLButtonElement>('[data-mtoggle]').forEach((b) => {
    b.addEventListener('click', () => onToggle(b, station, host));
  });
  host.querySelectorAll<HTMLButtonElement>('[data-mfault]').forEach((b) => {
    b.addEventListener('click', () => onFault(b, host));
  });
  host.querySelectorAll<HTMLInputElement>('[data-minput]').forEach((input) => {
    const signal = input.dataset.minput as SignalKey;
    const def = controls.find(
      (c): c is Extract<ControlDef, { kind: 'number' }> =>
        c.kind === 'number' && c.signal === signal
    );
    if (!def) return;
    input.value = String(bus.asNumber(signal));
    input.addEventListener('change', () => {
      if (bus.isForced(signal)) {
        showMsg(host, `blocked: ${signal} is FORCED - unforce it first`);
        input.value = String(bus.asNumber(signal));
        return;
      }
      const v = clamp(Number(input.value), def.min, def.max);
      bus.set(signal, v, `machine panel GAGE`);
      showMsg(host, verifyInRange(v, def.min, def.max));
    });
    input.addEventListener('input', () => {
      input.dataset.edited = '1';
    });
  });
  tickMachineControls(host, station);
}

function onToggle(btn: HTMLButtonElement, _station: string, host: HTMLElement): void {
  const signal = btn.dataset.mtoggle as SignalKey;
  if (!SIGNALS.some((s) => s.key === signal)) return; // never write unknown tags
  if (bus.isForced(signal)) {
    showMsg(host, `blocked: ${signal} is FORCED - unforce it first`);
    return;
  }
  const next = !bus.asBool(signal);
  if (next) {
    const exclusive = (btn.dataset.mexclusive ?? '')
      .split(' ')
      .filter(Boolean) as SignalKey[];
    for (const ex of exclusive) bus.set(ex, false, 'machine panel (mutual exclusion)');
  }
  bus.set(signal, next, `machine panel toggle`);
  showMsg(
    host,
    SIGNALS.find((s) => s.key === signal)?.unit === 'bool'
      ? ''
      : `${signal} = ${bus.asNumber(signal)}`
  );
  tickMachineControls(host, '');
}

function onFault(btn: HTMLButtonElement, host: HTMLElement): void {
  const fault = btn.dataset.mfault as keyof Faults | undefined;
  if (!fault || !(fault in hmi.faults)) return;
  hmi.toggle(fault);
  tickMachineControls(host, '');
}

/** per-state refresh: live values, forced badge, audit tail */
export function tickMachineControls(host: HTMLElement | null, station: string): void {
  if (!host) return;
  host.querySelectorAll<HTMLButtonElement>('[data-mtoggle]').forEach((b) => {
    const signal = b.dataset.mtoggle as SignalKey;
    b.classList.toggle('vp-m-on', bus.asBool(signal));
    b.classList.toggle('vp-m-forced-btn', bus.isForced(signal));
    setAria(b, bus.isForced(signal));
  });
  host.querySelectorAll<HTMLButtonElement>('[data-mfault]').forEach((b) => {
    const fault = b.dataset.mfault as keyof Faults;
    b.classList.toggle('vp-m-faulton', Boolean(hmi.faults[fault]));
  });
  host.querySelectorAll<HTMLInputElement>('[data-minput]').forEach((input) => {
    if (input.dataset.edited === '1' && document.activeElement === input) return;
    input.dataset.edited = '';
    const signal = input.dataset.minput as SignalKey;
    input.value = String(bus.asNumber(signal));
    input.classList.toggle('vp-m-forced-btn', bus.isForced(signal));
  });

  const forcedEl = host.querySelector('[data-mrole="forced"]');
  if (forcedEl) {
    const f = bus.forcedKeysList();
    forcedEl.textContent = f.length === 0 ? 'no forced signals' : `FORCED: ${f.join(', ')}`;
    forcedEl.classList.toggle('vp-m-forced-on', f.length > 0);
  }
  const auditEl = host.querySelector('[data-mrole="audit"]');
  if (auditEl) {
    const hist = bus.history().slice(-6).reverse();
    auditEl.textContent =
      hist
        .map((r) => `${r.forced ? 'F' : ' '} ${r.key} = ${fmtVal(r.value)} (${r.source})`)
        .join('\n') || 'no signal changes yet';
  }
  const stateEl = host.querySelector('[data-mrole="state"]');
  if (stateEl && station === 'GAGE') {
    stateEl.textContent = sim.boxedCount > 0 ? `${sim.boxedCount} boxed` : '';
  }
  void station;
}

function verifyInRange(value: number, min: number, max: number): string {
  return value >= min && value <= max ? '' : `kept inside the editable range ${min}..${max}`;
}

function clamp(v: number, min: number, max: number): number {
  let x = Number.isFinite(v) ? v : min;
  if (x < min) x = min;
  if (x > max) x = max;
  return Math.round(x * 100000) / 100000;
}

function fmtVal(v: unknown): string {
  return typeof v === 'number' ? String(Number(v.toFixed(4))) : String(v);
}

function showMsg(host: HTMLElement, text: string): void {
  const el = host.querySelector('[data-mrole="msg"]');
  if (el) el.textContent = text;
}

function setAria(btn: HTMLButtonElement, forced: boolean): void {
  btn.setAttribute('aria-pressed', forced ? 'true' : 'false');
}

function esc(v: unknown): string {
  return String(v).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  );
}

function escapeHtml(s: string): string {
  return esc(s);
}
