import { describe, it, expect, vi } from 'vitest';
import {
  validateIpv4,
  findDuplicateIps,
  editPermission,
  ncAlarmConditions,
  type IpDevice,
  type RoleId
} from '../hmi/controlScreens';

describe('control screens: network editor helpers', () => {
  it('accepts valid IPv4 and rejects malformed addresses', () => {
    expect(validateIpv4('172.38.22.37')).toBe(true);
    expect(validateIpv4('10.0.0.98')).toBe(true);
    expect(validateIpv4('255.255.255.255')).toBe(true);
    expect(validateIpv4('172.38.22.256')).toBe(false);
    expect(validateIpv4('172.38.22')).toBe(false);
    expect(validateIpv4('172.38.22.1.1')).toBe(false);
    expect(validateIpv4('172.38.22.a')).toBe(false);
    expect(validateIpv4('abc')).toBe(false);
    expect(validateIpv4('')).toBe(false);
  });

  it('detects duplicate IPs and ignores invalid ones', () => {
    const devices: IpDevice[] = [
      { id: 'IP-009', name: '2D Camera', ip: '172.38.22.37', online: true },
      { id: 'IP-015', name: 'Reader', ip: '172.38.22.37', online: true },
      { id: 'IP-011', name: 'Laser', ip: '172.38.22.39', online: true },
      { id: 'IP-000', name: 'bad', ip: 'not-an-ip', online: true },
      { id: 'IP-000b', name: 'bad2', ip: 'not-an-ip', online: true }
    ];
    expect(findDuplicateIps(devices).sort()).toEqual(['IP-009', 'IP-015']);
  });

  it('returns no duplicates when all addresses are unique', () => {
    const devices: IpDevice[] = [
      { id: 'a', name: 'a', ip: '1.1.1.1', online: true },
      { id: 'b', name: 'b', ip: '1.1.1.2', online: true }
    ];
    expect(findDuplicateIps(devices)).toEqual([]);
  });
});

describe('control screens: recipe edit permissions', () => {
  it('lets ME / TE approve changes', () => {
    expect(editPermission('ME / TE', {}).allowed).toBe(true);
  });

  it('blocks the operator unless a controlled setup sheet marks the field yellow', () => {
    expect(editPermission('Operator', {}).allowed).toBe(false);
    expect(editPermission('Operator', { operatorYellowConfirmed: true }).allowed).toBe(true);
  });

  it('blocks the non-authorised roles with a reason', () => {
    for (const role of ['Team Leader', 'Quality', 'Metrology', 'Maintenance'] as RoleId[]) {
      const p = editPermission(role, {});
      expect(p.allowed).toBe(false);
      expect(p.reason.length).toBeGreaterThan(0);
    }
  });
});

describe('control screens: SINUMERIK alarm conditions', () => {
  it('raises AL-001 when BRAX is outside the observed 3-3.5 band', () => {
    expect(ncAlarmConditions(3.25, true, 0)).toEqual([]);
    expect(ncAlarmConditions(4.2, true, 0)).toContain('AL-001');
    expect(ncAlarmConditions(2.9, true, 0)).toContain('AL-001');
  });

  it('raises AL-002 when read-in enable is missing', () => {
    expect(ncAlarmConditions(3.25, false, 0)).toEqual(['AL-002']);
  });

  it('raises AL-003 when the F12 dwell is at the observed stuck value', () => {
    expect(ncAlarmConditions(3.25, true, 5.9)).toContain('AL-003');
    expect(ncAlarmConditions(3.25, true, 2.0)).not.toContain('AL-003');
  });
});

// @vitest-environment jsdom
import { mountControlScreens, showControlScreen, SCREENS } from '../hmi/controlScreens';
import { screensForStation } from '../hmi/machineControls';
import { MACHINES } from '../three/machines';

describe('control screens: mounting and switching (step 4)', () => {
  it('mounts with an initial screen and switches via showControlScreen', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    mountControlScreens(host, 'recipe');
    expect(Array.from(host.querySelectorAll('.cs-tab.active')).map((b) => b.textContent)).toEqual(['Recipe / setup']);
    expect(host.textContent).toContain('Recipe / setup editor');
    showControlScreen('roles');
    expect(Array.from(host.querySelectorAll('.cs-tab.active')).map((b) => b.textContent)).toEqual(['Roles / audit']);
    expect(host.textContent).toContain('audit');
    showControlScreen('main');
    expect(host.textContent).toContain('Main');

    host.remove();
    // releasing the interval loop and host state (no crash on re-mount)
    const host2 = document.createElement('div');
    document.body.appendChild(host2);
    mountControlScreens(host2);
    expect(host2.querySelectorAll('[data-screen]').length).toBe(SCREENS.length);
    host2.remove();
  });

  it('shows the simulated alarm lifecycle on the Main HMI card', async () => {
    const { hmi } = await import('../sim/runtime');
    const host = document.createElement('div');
    document.body.appendChild(host);
    vi.useFakeTimers();
    try {
      mountControlScreens(host, 'main');
      expect(host.textContent).toContain('ALARMS (simulated');
      hmi.toggle('laserDisabled');
      hmi.tick(0.5); // the browser sim loop drives the alarm lifecycle
      vi.advanceTimersByTime(600);
      expect(host.textContent).toContain('HMI: 1 active alarm');
      expect(host.textContent).toContain('HMI-019');
      (host.querySelector('[data-action="alarm-ack"]') as HTMLButtonElement).click();
      vi.advanceTimersByTime(600);
      expect(host.textContent).toContain('active-acked');
      (host.querySelector('[data-action="alarm-clear"]') as HTMLButtonElement).click();
      vi.advanceTimersByTime(600);
      expect(host.textContent).toContain('no active alarms');
    } finally {
      hmi.reset();
      vi.useRealTimers();
      host.remove();
    }
  });

  it('maps every operable station to valid, deduplicated screens', () => {
    const ids = new Set(SCREENS.map((s) => s.id));
    for (const machine of MACHINES) {
      if (machine.station === 'WORKPIECE') {
        expect(screensForStation(machine.station)).toEqual([]);
        continue;
      }
      const screens = screensForStation(machine.station);
      expect(screens.length, machine.station).toBeGreaterThan(0);
      expect(new Set(screens).size, machine.station).toBe(screens.length);
      for (const id of screens) expect(ids.has(id), machine.station + ': ' + id).toBe(true);
    }
  });
});
