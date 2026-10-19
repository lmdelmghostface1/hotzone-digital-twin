/**
 * Fault drills (Phase 5) - guided troubleshooting scenarios.
 *
 * A drill injects a teaching fault (the same hmi.faults triggers used by the
 * machine panels and the HMI mimic), then waits while the trainee diagnoses
 * and recovers it in the 3D scene (machine panel force/unforce, alarm ack).
 * Timing uses simulation time (hmi.t), not wall-clock time, so pause/step
 * rates work for training.
 *
 * HONESTY (hotzone-rules 6 + faults register):
 *  - the fault/alarm pairings are an educational inference (NV-022);
 *  - every remedy for the simulated faults is a TRAINING SCENARIO - there is
 *    no documented reaction plan in the controlled sources for them;
 *  - only the crack event follows a documented reaction plan (CR-000..015),
 *    and its recovery is not simulated: recovery = self-certified by the
 *    trainee when the documented plan has been read/executed.
 */
import faultsJson from '../data/faults.json';
import type { FaultDef, FaultsFile } from '../types/data';
import { bus, hmi } from './runtime';
import type { SignalKey } from './bus';

const file = faultsJson as unknown as FaultsFile;
export const faultDefs = file.faults;
export const faultsMeta = file.meta;

export function faultById(id: string): FaultDef | null {
  return faultDefs.find((f) => f.id === id) ?? null;
}

export type DrillState = 'idle' | 'injected' | 'recovered';

export interface DrillRecord {
  faultId: string;
  state: DrillState;
  /** hmi.t at injection */
  injectedAt: number;
  /** hmi.t at recovery (0 while injected) */
  recoveredAt: number;
  /** signal bus writes for the trigger signal during the drill */
  signalWrites: number;
  /** watermark: per-signal write counter value at the last count (signalWrites above) */
  countedT: number;
  /** number of reaction hints revealed */
  hintsUsed: number;
  /** crack drills: trainee self-certified the documented plan */
  selfCertified: boolean;
}

export interface DrillManager {
  active(): DrillRecord | null;
  history(): DrillRecord[];
  start(faultId: string): { ok: boolean; message: string };
  /** reveal the next remedy step (training-scenario only) */
  hint(): { ok: boolean; message: string };
  /** trainee confirms a manual recovery (crack drills / self-certification) */
  selfCertify(): { ok: boolean; message: string };
  /** check recovery conditions; call this from the UI tick */
  poll(): void;
  abandon(): { ok: boolean; message: string };
}

class DrillManagerImpl implements DrillManager {
  private record: DrillRecord | null = null;
  private past: DrillRecord[] = [];
  private hintIndex = 0;

  active(): DrillRecord | null {
    return this.record;
  }

  history(): DrillRecord[] {
    return [...this.past].reverse();
  }

  start(faultId: string): { ok: boolean; message: string } {
    if (this.record && this.record.state === 'injected') {
      return { ok: false, message: 'a drill is already running - finish or abandon it first' };
    }
    if (this.record && this.record.state === 'recovered') this.past.push(this.record);
    const def = faultById(faultId);
    if (!def) return { ok: false, message: `unknown fault ${faultId}` };
    if (def.reaction.kind === 'documented') {
      // crack event: no bus trigger to inject honestly; trainee reads the plan
      this.record = {
        faultId,
        state: 'injected',
        injectedAt: hmi.t,
        recoveredAt: 0,
        countedT: bus.writesOf((def.trigger.signal ?? '') as SignalKey),
        signalWrites: 0,
        hintsUsed: 0,
        selfCertified: false
      };
      this.hintIndex = 0;
      return {
        ok: true,
        message:
          'crack event started (documented reaction plan GWI34417543); the recovery is self-certified: read/execute the CR plan, then confirm manually. No alarm is raised - the register documents off-line detection.'
      };
    }
    // simulated fault: find the hmi fault key from the trigger "via" text
    const keyMatch = def.trigger.via.match(/hmi fault "([^"]+)"/);
    if (!keyMatch) return { ok: false, message: `${def.id} has no injectable hmi fault trigger` };
    const faultKey = keyMatch[1] as keyof typeof hmi.faults;
    if (hmi.faults[faultKey]) {
      return { ok: false, message: `${faultKey} is already active - clear it before starting the drill` };
    }
    // watermark BEFORE injecting so the drill's own write is counted too
    const watermark = bus.writesOf((def.trigger.signal ?? '') as SignalKey);
    hmi.toggle(faultKey);
    this.record = {
      faultId,
      state: 'injected',
      injectedAt: hmi.t,
      recoveredAt: 0,
      countedT: watermark,
      signalWrites: 0,
      hintsUsed: 0,
      selfCertified: false
    };
    this.hintIndex = 0;
    return {
      ok: true,
      message: `${def.id} injected: watch the FORCED indicator and the alarm; recover it on the machine panel`
    };
  }

  hint(): { ok: boolean; message: string } {
    const rec = this.record;
    if (!rec || rec.state !== 'injected') {
      return { ok: false, message: 'no running drill to give hints for' };
    }
    const def = faultById(rec.faultId);
    if (!def) return { ok: false, message: 'drill fault not found' };
    if (def.reaction.kind !== 'training-scenario') {
      return { ok: false, message: 'the documented Crack Reaction Plan lives in the procedures register (no extra hints)' };
    }
    const steps = def.reaction.steps;
    if (this.hintIndex >= steps.length) {
      return { ok: false, message: 'all remedy steps already revealed' };
    }
    const step = steps[this.hintIndex];
    this.hintIndex++;
    rec.hintsUsed = this.hintIndex;
    return { ok: true, message: `remedy step ${step.id}: ${step.instruction}` };
  }

  selfCertify(): { ok: boolean; message: string } {
    const rec = this.record;
    const def = rec ? faultById(rec.faultId) : null;
    if (!rec || !def) return { ok: false, message: 'no running drill' };
    if (rec.state !== 'injected') return { ok: false, message: 'drill already recovered' };
    // self-certified recovery is only for the documented crack event
    if (def.reaction.kind !== 'documented') {
      return { ok: false, message: 'simulated fault drills recover through the bus (unforce), not by self-certification' };
    }
    rec.state = 'recovered';
    rec.recoveredAt = hmi.t;
    rec.selfCertified = true;
    this.past.push(rec);
    this.record = null;
    return { ok: true, message: 'crack drill closed as SELF-CERTIFIED (documented plan executed); not validated by the simulation' };
  }

  poll(): void {
    const rec = this.record;
    if (!rec || rec.state !== 'injected') return;
    const def = faultById(rec.faultId);
    if (!def) return;
    // monotonic per-key counters survive log eviction (maxLog=300)
    rec.signalWrites = bus.writesOf((def.trigger.signal ?? '') as SignalKey) - rec.countedT;
    if (def.reaction.kind === 'documented') return; // waits for selfCertify()
    // recovered when the alarm is gone AND nothing of it is forced on the bus
    const alarmGone = hmi.activeAlarms().length === 0;
    const notForced =
      !def.trigger.signal || !bus.isForced(def.trigger.signal as SignalKey);
    if (alarmGone && notForced) {
      rec.state = 'recovered';
      rec.recoveredAt = hmi.t;
      this.past.push(rec);
      this.record = null;
    }
  }

  abandon(): { ok: boolean; message: string } {
    const rec = this.record;
    if (!rec) return { ok: false, message: 'no running drill' };
    const def = faultById(rec.faultId);
    if (def && !rec.selfCertified) {
      // do NOT auto-clear the fault for the trainee: recovery stays manual
      rec.state = 'recovered';
      rec.recoveredAt = hmi.t;
      this.past.push(rec);
      this.record = null;
    }
    return {
      ok: true,
      message:
        'drill abandoned: the injected fault and its alarm stay in place until you recover it on the machine panel or clear it on the screens'
    };
  }
}

export const drills: DrillManager = new DrillManagerImpl();
