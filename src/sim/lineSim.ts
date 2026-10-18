/**
 * Phase 3 simulation core - tracked CV OR parts.
 *
 * HONESTY: this is an EDUCATIONAL trend model. The heat index and the GO/NO-GO
 * dimensions are illustrative values used to demonstrate the flow and the
 * inspection principle. They are NOT plant setpoints, tolerances or thermal
 * results. The gage station itself is never photographed (NV-016) and the pin
 * diameters are only an example in the source, not a program table (NV-014).
 * See docs/NEEDS_VERIFICATION.md and docs/model-checklist/gage-station.md.
 */
import {
  GAGE_LIMITS,
  createPart,
  logHistory,
  resetSerials,
  type StageId,
  type TrackedPart
} from './part';
import { SignalBus } from './bus';

export interface Waypoint {
  stage: StageId;
  label: string;
  /** position along the line, metres (matches the 3D model x axis) */
  x: number;
  /** seconds the part stays at this station */
  dwell: number;
  /** station effect - runs once on arrival */
  effect?: (p: TrackedPart, sim: LineSim) => void;
}

export interface SimSignals {
  running: boolean;
  timeScale: number;
  laserEnabled: boolean;
  partsOnLine: number;
  boxed: number;
  rejected: number;
  headline: string;
  lastMeasurement: string;
}

/** illustrative travel speed along the line, m/s */
export const TRAVEL_SPEED = 1.6;
/** illustrative sim-seconds between parts */
export const SPAWN_INTERVAL = 4.5;
/** seconds a finished part lingers on the belt before it is removed */
const LINGER = 3;

interface PartSimState {
  idx: number;
  dwell: number;
  /** waypoint index whose effect has already run */
  applied: number;
  /** once set, the part is finished and counting down to removal */
  done: number | null;
}

export const GAGE_BENCH_X = 9.9;
export const BOX_BENCH_X = 11.0;

const WAYPOINTS: Waypoint[] = [
  {
    stage: 'WASH',
    label: 'blank wash (PF-002)',
    x: -7.0,
    dwell: 3,
    effect: (p, sim) => logHistory(p, sim.t, 'WASH', 'blank wash - rinsed and de-greased (educational)')
  },
  {
    stage: 'WASH2',
    label: 'TP/CV wash tunnel',
    x: -4.1,
    dwell: 2.5,
    effect: (p, sim) => logHistory(p, sim.t, 'WASH2', 'TP/CV wash tunnel')
  },
  {
    stage: 'MARKING',
    label: 'laser marking station (EQ-005)',
    x: -2.05,
    dwell: 1.2,
    effect: (p, sim) => {
      if (!sim.bus.asBool('laser.enabled')) {
        logHistory(p, sim.t, 'MARKING', 'laser DISABLED - no 2D code written (EP-003)');
      } else {
        logHistory(p, sim.t, 'MARKING', `2D DataMatrix marked: ${p.code2d ?? 'n/a'}`);
      }
    }
  },
  {
    stage: 'READING',
    label: '2D code reader (EQ-006)',
    x: -1.1,
    dwell: 1.0,
    effect: (p, sim) => {
      if (!p.code2d || p.damagedCode) {
        p.rejected = true;
        p.rejectReason = p.damagedCode ? 'damaged 2D code (EP-004)' : 'no 2D code (laser disabled, EP-003)';
        sim.rejectedCount += 1;
        logHistory(p, sim.t, 'REJECTED', `rejected at the reader: ${p.rejectReason}`);
      } else {
        logHistory(p, sim.t, 'READING', `2D code verified OK: ${p.code2d}`);
      }
    }
  },
  {
    stage: 'HEATING',
    label: 'induction heating (EQ-001/002)',
    x: -0.2,
    dwell: 4,
    effect: (p, sim) => {
      p.heatIndex = 0.9;
      logHistory(p, sim.t, 'HEATING', 'stem / bell heating (illustrative heat index, not a thermal result)');
    }
  },
  {
    stage: 'QUENCHING',
    label: 'polymer quench shower',
    x: 0.4,
    dwell: 2,
    effect: (p, sim) => {
      p.heatIndex = 0.35;
      logHistory(p, sim.t, 'QUENCHING', 'quenched (educational)');
    }
  },
  {
    stage: 'TEMPERING',
    label: 'draw oven (EQ-004)',
    x: 3.5,
    dwell: 5,
    effect: (p, sim) => {
      p.heatIndex = 0.55;
      logHistory(p, sim.t, 'TEMPERING', 'draw oven soak (illustrative)');
    }
  },
  {
    stage: 'COOLING',
    label: 'cooling / unload conveyor (PF-009)',
    x: 8.5,
    dwell: 4,
    effect: (p, sim) => {
      p.heatIndex = 0.1;
      logHistory(p, sim.t, 'COOLING', 'cooling on the unload conveyor');
    }
  },
  {
    stage: 'GAGING',
    label: 'gage station (EQ-007, conceptual - NV-016)',
    x: GAGE_BENCH_X,
    dwell: 4,
    effect: (p, sim) => {
      const seed = parseInt(p.serial.slice(-3), 10) || 0;
      const jitter = ((seed % 7) - 3) * 0.0006; // -0.0018 .. +0.0018 mm
      const measured = GAGE_LIMITS.nominalMm + jitter + sim.bus.asNumber('gage.offsetMm');
      const go = measured >= GAGE_LIMITS.goLimitMm && measured <= GAGE_LIMITS.noGoLimitMm;
      p.measurement = {
        measuredMm: measured,
        goLimitMm: GAGE_LIMITS.goLimitMm,
        noGoLimitMm: GAGE_LIMITS.noGoLimitMm,
        result: go ? 'GO' : 'NO-GO'
      };
      logHistory(
        p,
        sim.t,
        'GAGING',
        `operator gages the part: ${go ? 'GO' : 'NO-GO'} (${measured.toFixed(3)} mm illustrative, NV-014)`
      );
      if (!go) {
        p.rejected = true;
        p.rejectReason = 'gage NO-GO (size out of the illustrative limit)';
        sim.rejectedCount += 1;
        logHistory(p, sim.t, 'REJECTED', `rejected by the gage: ${p.rejectReason}`);
      }
    }
  },
  {
    stage: 'BOXED',
    label: 'boxing bench (PF-012)',
    x: BOX_BENCH_X,
    dwell: 2,
    effect: (p, sim) => logHistory(p, sim.t, 'BOXED', 'operator boxes the GO part and scans the 2D code')
  }
];

export const LINE_WAYPOINTS = WAYPOINTS;

export class LineSim {
  parts: TrackedPart[] = [];
  t = 0;
  boxedCount = 0;
  rejectedCount = 0;
  bus: SignalBus;

  private lot = 'LOT-A';
  private recipe = 'CVOR-R1';
  private spawnTimer = 1.5;
  private acc = 0;
  private state = new WeakMap<TrackedPart, PartSimState>();

  constructor(bus: SignalBus = new SignalBus()) {
    this.bus = bus;
  }

  injectBlank(): void {
    this.spawn(false, true);
  }

  injectDamaged(): void {
    this.spawn(true, false);
  }

  reset(): void {
    this.parts = [];
    this.t = 0;
    this.boxedCount = 0;
    this.rejectedCount = 0;
    this.spawnTimer = 1.5;
    this.acc = 0;
    resetSerials();
  }

  /** Stage the leading part is at, for readouts. */
  stageOf(p: TrackedPart): StageId {
    return p.stage;
  }

  /** Advance by a real-time delta; respects pause, time scale and fixed step. */
  tick(realDt: number): void {
    const running = this.bus.asBool('line.run') && !this.bus.asBool('conv.stop');
    if (!running) return;
    const rate = this.bus.asNumber('line.rate') || 1;
    this.acc += Math.min(realDt, 0.1) * rate;
    const step = 1 / 60;
    while (this.acc >= step) {
      this.step(step);
      this.acc -= step;
    }
  }

  signals(): SimSignals {
    const onLine = this.parts.filter((p) => !p.rejected && p.stage !== 'BOXED').length;
    const lead = this.parts.find((p) => p.stage !== 'BOXED' && p.stage !== 'REJECTED');
    const measured = [...this.parts].reverse().find((p) => p.measurement);
    return {
      running: this.bus.asBool('line.run'),
      timeScale: this.bus.asNumber('line.rate'),
      laserEnabled: this.bus.asBool('laser.enabled'),
      partsOnLine: onLine,
      boxed: this.boxedCount,
      rejected: this.rejectedCount,
      headline: lead ? `${lead.serial} · ${lead.stage}` : 'line empty',
      lastMeasurement: measured
        ? `${measured.serial} ${measured.measurement!.result} (${measured.measurement!.measuredMm.toFixed(3)} mm)`
        : 'none yet'
    };
  }

  private spawn(damaged: boolean, laserAlwaysOff: boolean): void {
    const p = createPart(this.t, this.lot, this.recipe, {
      laserEnabled: this.bus.asBool('laser.enabled') && !laserAlwaysOff,
      damagedCode: damaged || this.bus.asBool('fault.damagedCode'),
      gageOffsetMm: this.bus.asNumber('gage.offsetMm')
    });
    this.state.set(p, { idx: 0, dwell: 0, applied: -1, done: null });
    this.parts.push(p);
  }

  private step(dt: number): void {
    this.t += dt;

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawn(false, false);
      this.spawnTimer = SPAWN_INTERVAL;
    }

    for (const p of this.parts) {
      p.age += dt;
      this.advance(p, dt);
    }

    this.parts = this.parts.filter((p) => {
      const st = this.state.get(p)!;
      if (st.done === null) return true;
      st.done += dt;
      return st.done < LINGER;
    });
  }

  private advance(p: TrackedPart, dt: number): void {
    const st = this.state.get(p)!;
    if (st.done !== null) return;

    const w = WAYPOINTS[st.idx];
    if (p.x < w.x) {
      p.x = Math.min(w.x, p.x + TRAVEL_SPEED * dt);
      return;
    }

    if (st.applied !== st.idx) {
      st.applied = st.idx;
      logHistory(p, this.t, w.stage, `arrived at ${w.label}`);
      w.effect?.(p, this);
      if (p.rejected) {
        st.done = 0;
        return;
      }
    }

    st.dwell += dt;
    if (st.dwell < w.dwell) return;

    if (st.idx < WAYPOINTS.length - 1) {
      st.idx += 1;
      st.dwell = 0;
      return;
    }
    logHistory(p, this.t, 'BOXED', 'part boxed and removed to WIP');
    this.boxedCount += 1;
    st.done = 0;
  }
}
