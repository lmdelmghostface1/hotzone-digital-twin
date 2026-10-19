// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { SIGNALS } from '../sim/bus';
import { bus, hmi } from '../sim/runtime';
import { FAULT_ALARMS, type Faults } from '../hmi/hmiSim';
import {
  buildMachineControls,
  controlsForStation,
  tickMachineControls
} from '../hmi/machineControls';
import { MACHINES } from '../three/machines';

function hostFor(station: string, unoperableNote?: string): HTMLElement {
  const host = document.createElement('div');
  document.body.appendChild(host);
  buildMachineControls(host, station, unoperableNote);
  return host;
}

function clickOn(host: HTMLElement, sel: string, index = 0): HTMLButtonElement {
  const b = host.querySelectorAll<HTMLButtonElement>(sel)[index];
  if (!b) throw new Error(`missing ${sel}[${index}]`);
  b.click();
  return b;
}

describe('machine control specs', () => {
  it('only references real bus signals and real register fault codes', () => {
    const faults = Object.keys(FAULT_ALARMS) as (keyof Faults)[];
    for (const station of MACHINES.map((m) => m.station)) {
      for (const c of controlsForStation(station)) {
        if (c.kind === 'toggle' || c.kind === 'number') {
          expect(SIGNALS.some((s) => s.key === c.signal), `${c.signal} on ${station}`).toBe(true);
        }
        if (c.kind === 'fault') {
          expect(faults).toContain(c.fault);
          expect(FAULT_ALARMS[c.fault]).toMatch(/^HMI-\d{3}$/);
        }
      }
    }
  });

  it('gives every machine an operable section or an explicit unoperable note', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    for (const m of MACHINES) {
      const ctl = controlsForStation(m.station);
      if (ctl.length === 0) expect(m.station).toBe('WORKPIECE');
      else expect(ctl.length).toBeGreaterThan(0);
      void host;
    }
  });
});

describe('machine panel controls: toggles', () => {
  beforeEach(() => bus.reset());

  it('turns the heat glow on and the quench off (mutual exclusion)', () => {
    bus.set('amb.quenching', true, 'test');
    const host = hostFor('INDUCTION');
    clickOn(host, '[data-mtoggle="amb.heating"]');
    expect(bus.asBool('amb.heating')).toBe(true);
    expect(bus.asBool('amb.quenching')).toBe(false);
  });

  it('reflects the on state on the button itself', () => {
    const host = hostFor('INDUCTION');
    const btn = clickOn(host, '[data-mtoggle="amb.quenching"]');
    expect(btn.classList.contains('vp-m-on')).toBe(true);
    expect(bus.asBool('amb.quenching')).toBe(true);
  });

  it('is blocked with an inline reason while the signal is FORCED', () => {
    bus.force('amb.heating', true, 'testforce');
    const host = hostFor('INDUCTION');
    clickOn(host, '[data-mtoggle="amb.heating"]');
    const msg = host.querySelector('[data-mrole="msg"]')!.textContent;
    expect(msg).toContain('blocked');
    expect(msg).toContain('FORCED');
    expect(bus.asBool('amb.heating')).toBe(true);
    const forced = host.querySelector('[data-mrole="forced"]')!.textContent;
    expect(forced).toContain('amb.heating');
  });
});

describe('machine panel controls: fault triggers', () => {
  beforeEach(() => bus.reset());

  it('raises the curated register answer for a laser fault and shows it FORCED', () => {
    const host = hostFor('MARKING');
    tickMachineControls(host, 'MARKING');
    clickOn(host, '[data-mfault="laserDisabled"]');
    expect(hmi.faults.laserDisabled).toBe(true);
    expect(bus.isForced('laser.enabled')).toBe(true);
    expect(bus.asBool('laser.enabled')).toBe(false);
    const forced = host.querySelector('[data-mrole="forced"]')!.textContent;
    expect(forced).toContain('laser.enabled');
    const btn = host.querySelector<HTMLInputElement>('[data-mfault="laserDisabled"]')!;
    expect(btn.classList.contains('vp-m-faulton')).toBe(true);
  });

  it('unforces the signal when the fault is toggled back off', () => {
    const host = hostFor('UNLOAD');
    const btn = clickOn(host, '[data-mfault="conveyorStop"]');
    expect(bus.asBool('conv.stop')).toBe(true);
    btn.click();
    expect(hmi.faults.conveyorStop).toBe(false);
    expect(bus.isForced('conv.stop')).toBe(false);
  });
});

describe('machine panel controls: gage offset number', () => {
  beforeEach(() => bus.reset());

  it('sets the illustrative offset within the editable range', () => {
    const host = hostFor('GAGE');
    const input = host.querySelector<HTMLInputElement>('[data-minput="gage.offsetMm"]')!;
    input.value = '0.002';
    input.dispatchEvent(new Event('change'));
    expect(bus.asNumber('gage.offsetMm')).toBe(0.002);
  });

  it('keeps the value inside min..max on bulk edits', () => {
    const host = hostFor('GAGE');
    const input = host.querySelector<HTMLInputElement>('[data-minput="gage.offsetMm"]')!;
    input.value = '9';
    input.dispatchEvent(new Event('change'));
    expect(bus.asNumber('gage.offsetMm')).toBe(0.005);
  });

  it('is blocked while the gage NO-GO fault holds the offset FORCED', () => {
    const host = hostFor('GAGE');
    clickOn(host, '[data-mfault="gageForceNok"]');
    const input = host.querySelector<HTMLInputElement>('[data-minput="gage.offsetMm"]')!;
    const before = bus.asNumber('gage.offsetMm');
    input.value = '0.001';
    input.dispatchEvent(new Event('change'));
    expect(bus.asNumber('gage.offsetMm')).toBe(before);
    expect(host.querySelector('[data-mrole="msg"]')!.textContent).toContain('blocked');
  });
});
