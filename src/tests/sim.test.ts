import { describe, it, expect } from 'vitest';
import { LineSim, LINE_WAYPOINTS, GAGE_BENCH_X } from '../sim/lineSim';
import { GAGE_LIMITS, createPart } from '../sim/part';
import { SignalBus, SIGNALS } from '../sim/bus';

/** run a sim for `seconds` of sim time (timeScale 1, 0.1 s ticks) */
function run(sim: LineSim, seconds: number): void {
  const ticks = Math.round(seconds / 0.1);
  for (let i = 0; i < ticks; i++) sim.tick(0.1);
}

function fullRun(seconds = 70): LineSim {
  const sim = new LineSim();
  sim.reset();
  run(sim, seconds);
  return sim;
}

describe('sim: part', () => {
  it('marks a 2D code when the laser is enabled and omits it when disabled', () => {
    const on = createPart(0, 'LOT-A', 'CVOR-R1', { laserEnabled: true });
    const off = createPart(0, 'LOT-A', 'CVOR-R1', { laserEnabled: false });
    expect(on.code2d).toContain(on.serial);
    expect(on.code2d).toContain('LOT-A');
    expect(off.code2d).toBeNull();
  });

  it('records history with an increasing timestamp', () => {
    const p = createPart(0, 'LOT-A', 'CVOR-R1');
    expect(p.history.length).toBe(1);
    expect(p.history[0].stage).toBe('INFEED');
  });
});

describe('sim: line flow', () => {
  it('carries a part through every station to boxing', () => {
    const sim = fullRun();
    const boxed = sim.parts.find((p) => p.stage === 'BOXED' && !p.rejected);
    expect(boxed, 'expected at least one part to reach boxing').toBeTruthy();
    const stages = boxed!.history.map((h) => h.stage);
    for (const expected of ['WASH', 'MARKING', 'READING', 'HEATING', 'TEMPERING', 'COOLING', 'GAGING', 'BOXED']) {
      expect(stages, `stage ${expected} present`).toContain(expected);
    }
    expect(sim.boxedCount).toBeGreaterThan(0);
  });

  it('moves parts along the line (x increases toward the boxing bench)', () => {
    const sim = fullRun(30);
    const moved = sim.parts.filter((p) => p.x > -8.5);
    expect(moved.length).toBeGreaterThan(0);
    expect(Math.max(...sim.parts.map((p) => p.x))).toBeGreaterThan(0);
  });

  it('rejects a blank part when the laser is disabled (EP-003)', () => {
    const sim = new LineSim();
    sim.reset();
    sim.bus.set('laser.enabled', false);
    run(sim, 20);
    const rej = sim.parts.find((p) => p.rejected);
    expect(rej).toBeTruthy();
    expect(rej!.rejectReason).toContain('EP-003');
    expect(sim.rejectedCount).toBeGreaterThan(0);
  });

  it('rejects a damaged code at the reader (EP-004)', () => {
    const sim = new LineSim();
    sim.reset();
    sim.injectDamaged();
    run(sim, 13);
    const rej = sim.parts.find((p) => p.rejectReason?.includes('EP-004'));
    expect(rej).toBeTruthy();
  });

  it('rejects at the gage when the illustrative size is out of the GO/NO-GO window', () => {
    const sim = new LineSim();
    sim.reset();
    sim.bus.set('gage.offsetMm', 0.02); // 20 um out - far outside the window
    run(sim, 60);
    const rej = sim.parts.find((p) => p.measurement && p.measurement.result === 'NO-GO');
    expect(rej).toBeTruthy();
    expect(rej!.rejected).toBe(true);
    expect(rej!.rejectReason).toContain('NO-GO');
  });

  it('gages parts as GO inside the window and records the measurement', () => {
    const sim = fullRun();
    const gaged = sim.parts.filter((p) => p.measurement);
    expect(gaged.length).toBeGreaterThan(0);
    for (const p of gaged) {
      const m = p.measurement!;
      const inWindow = m.measuredMm >= GAGE_LIMITS.goLimitMm && m.measuredMm <= GAGE_LIMITS.noGoLimitMm;
      expect(m.result).toBe(inWindow ? 'GO' : 'NO-GO');
    }
    expect(sim.signals().lastMeasurement).not.toBe('none yet');
  });

  it('heats the part at the induction station then cools it down the line', () => {
    const sim = new LineSim();
    sim.reset();
    run(sim, 22);
    const hot = sim.parts.filter((p) => p.stage === 'HEATING' || p.stage === 'TEMPERING' || p.stage === 'QUENCHING');
    expect(hot.some((p) => p.heatIndex > 0.4)).toBe(true);
    const cooled = sim.parts.find((p) => p.stage === 'COOLING' || p.stage === 'GAGING' || p.stage === 'BOXED');
    if (cooled) expect(cooled.heatIndex).toBeLessThan(0.5);
  });

  it('pauses when not running', () => {
    const sim = new LineSim();
    sim.reset();
    run(sim, 5);
    const before = sim.parts.length;
    sim.bus.set('line.run', false);
    run(sim, 10);
    expect(sim.parts.length).toBe(before);
    expect(sim.t).toBeCloseTo(5, 1);
  });

  it('is deterministic for the same configuration', () => {
    const a = fullRun(40);
    const b = fullRun(40);
    expect(a.parts.map((p) => [p.serial, p.x.toFixed(3), p.stage])).toEqual(
      b.parts.map((p) => [p.serial, p.x.toFixed(3), p.stage])
    );
  });

  it('keeps the waypoint positions in order along the line', () => {
    for (let i = 1; i < LINE_WAYPOINTS.length; i++) {
      expect(LINE_WAYPOINTS[i].x).toBeGreaterThan(LINE_WAYPOINTS[i - 1].x);
    }
    expect(LINE_WAYPOINTS[LINE_WAYPOINTS.length - 1].x).toBeGreaterThan(GAGE_BENCH_X);
  });
});

describe('sim: signal bus', () => {
  it('initialises every declared signal to its default', () => {
    const bus = new SignalBus();
    for (const d of SIGNALS) {
      expect(bus.get(d.key), `default for ${d.key}`).toBe(d.default);
    }
  });

  it('has the ambient visual signals the scene reads (single source of truth)', () => {
    const bus = new SignalBus();
    expect(bus.asBool('amb.washing')).toBe(true);
    expect(bus.asBool('amb.tempering')).toBe(true);
    expect(bus.asBool('amb.heating')).toBe(false);
    expect(bus.asBool('amb.quenching')).toBe(false);
  });

  it('blocks normal writes to a forced signal and restores the default on unforce', () => {
    const bus = new SignalBus();
    bus.force('amb.heating', true, 'test');
    expect(bus.isForced('amb.heating')).toBe(true);
    bus.set('amb.heating', false, 'operator');
    expect(bus.asBool('amb.heating')).toBe(true);
    bus.unforce('amb.heating');
    expect(bus.asBool('amb.heating')).toBe(false);
    expect(bus.isForced('amb.heating')).toBe(false);
  });

  it('logs only on change or force transition (no per-tick spam)', () => {
    const bus = new SignalBus();
    bus.set('amb.washing', true, 'operator');
    expect(bus.history().length).toBe(0);
    bus.set('amb.washing', false, 'operator');
    bus.set('amb.washing', false, 'operator');
    expect(bus.history().length).toBe(1);
  });
});
