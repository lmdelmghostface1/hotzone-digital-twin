// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import extraction from '../data/initial-extraction.json';
import hmiRegister from '../data/hmi-errors.json';
import proceduresJson from '../data/procedures.json';
import faultsJson from '../data/faults.json';
import {
  ProcedureTracker,
  procedureById,
  procedures
} from '../sim/procedures';
import { drills, faultById, faultDefs } from '../sim/faults';
import { bus, hmi } from '../sim/runtime';

const extractionItems = (extraction as unknown as { items: { id: string; value: unknown }[] }).items;
const hmiEntries = (hmiRegister as unknown as { entries: { id: string; code: string; text: string }[] }).entries;

beforeEach(() => {
  hmi.reset();
  for (const k of bus.forcedKeysList()) bus.unforce(k);
});

describe('procedures register integrity (verbatim, documented steps only)', () => {
  it('every step is a verbatim, ordered segment of its extraction source', () => {
    expect(procedures.length).toBeGreaterThan(8);
    const itemById = new Map(extractionItems.map((i) => [i.id, i]));
    for (const proc of proceduresJson.procedures) {
      const posByItem = new Map<string, number>();
      for (const step of proc.steps) {
        const src = itemById.get(step.sourceItem) as { value: unknown } | undefined;
        expect(src, `${proc.id} step ${step.id}`).toBeDefined();
        const pos = posByItem.get(step.sourceItem) ?? 0;
        const value = String((src as { value: unknown }).value);
        const found = value.indexOf(step.instruction.trim(), pos);
        expect(found, `${proc.id} step ${step.id} verbatim+order`).toBeGreaterThanOrEqual(0);
        posByItem.set(step.sourceItem, found + step.instruction.trim().length);
      }
    }
  });

  it('every step and procedure carries evidence metadata', () => {
    for (const proc of proceduresJson.procedures) {
      expect(proc.evidence).toBeTruthy();
      expect(proc.steps.length).toBeGreaterThan(0);
      for (const step of proc.steps) {
        expect(step.evidence.sourceId.length).toBeGreaterThan(0);
        expect(['document', 'photographic', 'external', 'inference', 'assumption', 'needs-verification']).toContain(step.evidence.category);
      }
    }
  });

  it('safety-critical procedures carry the prominent safety note', () => {
    const loto = procedureById('PROC-LOTO');
    expect(loto?.safetyNote ?? '').toContain('approved site procedure governs real work');
    const manual = loto?.steps.every((s) => s.manual) ?? false;
    expect(manual).toBe(true);
    const crack = procedureById('PROC-CRACK-REACTION');
    expect(crack?.steps.length).toBe(16); // CR-000 + CR-001..CR-015
    expect(crack?.steps[0].sourceItem).toBe('CR-000');
  });
});

describe('procedure tracker (documented order, no skipping)', () => {
  it('completes steps in order and blocks later steps with a reason', () => {
    const tracker = new ProcedureTracker();
    const proc = procedures[0];
    const later = proc.steps[2].id;
    const blocked = tracker.completeStep(proc.id, later);
    expect(blocked.ok).toBe(false);
    expect(blocked.message).toContain('blocked');
    expect(blocked.message).toContain(proc.steps[0].id);
    const first = tracker.completeStep(proc.id, proc.steps[0].id);
    expect(first.ok).toBe(true);
    expect(tracker.stateOf(proc.id).selfCertified.size).toBe(1);
    const wrapped = tracker.completeStep(proc.id, proc.steps[0].id);
    expect(wrapped.ok).toBe(false);
    expect(wrapped.message).toContain('blocked');
  });

  it('finishing the last step blocks further completions', () => {
    const tracker = new ProcedureTracker();
    const proc = procedures[0];
    for (const st of proc.steps) tracker.completeStep(proc.id, st.id);
    const again = tracker.completeStep(proc.id, proc.steps[0].id);
    expect(again.ok).toBe(false);
    expect(again.message).toContain('already completed');
    expect(tracker.currentStep(proc.id)).toBeNull();
  });
});

describe('faults register integrity', () => {
  it('alarm texts match the HMI register verbatim', () => {
    for (const f of faultsJson.faults) {
      if (!f.alarm) continue;
      const reg = hmiEntries.find((e) => e.id === f.alarm?.id);
      expect(reg, f.id).toBeDefined();
      expect(f.alarm.code).toBe(reg?.code);
      expect(f.alarm.text).toBe(reg?.text);
    }
  });

  it('only the crack event has a documented reaction; others are labelled training scenarios', () => {
    const crack = faultById('FAULT-CRACK');
    expect(crack).toBeDefined();
    const react = crack!.reaction as unknown as { kind: string; procedureId?: string };
    expect(react.kind).toBe('documented');
    expect(react.procedureId).toBe('PROC-CRACK-REACTION');
    for (const f of faultDefs) {
      if (f.id !== 'FAULT-CRACK' && f.reaction.kind === 'training-scenario') {
        expect(f.reaction.note).toContain('TRAINING SCENARIO');
        expect(f.reaction.steps.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('drill lifecycle (simulated faults)', () => {
  it('inject, diagnose, unforce â†’ auto-recovery with elapsed sim time', () => {
    const res = drills.start('FAULT-LASER');
    expect(res.ok).toBe(true);
    const rec = drills.active();
    expect(rec?.state).toBe('injected');
    expect(hmi.faults.laserDisabled).toBe(true);
    hmi.tick(0.5); // alarm lifecycle requires the sim loop tick
    const a = hmi.activeAlarms();
    expect(a.map((x) => x.id)).toContain('HMI-019');
    drills.poll();
    expect(drills.active()?.state).toBe('injected'); // still forced
    // trainee recovers on the machine panel: unforce the trigger
    hmi.toggle('laserDisabled');
    hmi.tick(0.5);
    drills.poll();
    const done = drills.history()[0];
    expect(done.state).toBe('recovered');
    expect(hmi.activeAlarms().length).toBe(0);
    expect(done.recoveredAt - done.injectedAt).toBeGreaterThan(0);
    expect(done.signalWrites).toBeGreaterThanOrEqual(2); // laser.enabled forced false by the drill, unforced by the "panel"
    const hintBlocked = drills.hint();
    expect(hintBlocked.ok).toBe(false);
    const hist = drills.history();
    expect(hist[0].faultId).toBe('FAULT-LASER');
  });

  it('hints reveal the remedy steps in order and are counted', () => {
    const s = drills.start('FAULT-SCAN');
    expect(s.ok).toBe(true);
    const h1 = drills.hint();
    expect(h1.ok).toBe(true);
    const h2 = drills.hint();
    expect(h2.ok).toBe(true);
    expect(drills.active()?.hintsUsed).toBe(2);
    // recover: unforce via the drill trigger
    hmi.toggle('damagedCode');
    hmi.tick(0.5);
    drills.poll();
    expect(drills.history()[0].state).toBe('recovered');
  });

  it('blocks a second drill while one is running', () => {
    drills.start('FAULT-HEAT');
    const again = drills.start('FAULT-CONVEYOR');
    expect(again.ok).toBe(false);
    expect(again.message).toContain('already running');
    drills.abandon();
    // fault stays in place: recovery is manual (honest handling)
    expect(hmi.faults.heatFault).toBe(true);
    hmi.toggle('heatFault');
    hmi.tick(0.5);
  });

  it('crack drill self-certifies the documented plan', () => {
    const s = drills.start('FAULT-CRACK');
    expect(s.ok).toBe(true);
    const hint = drills.hint();
    expect(hint.ok).toBe(false);
    drills.poll();
    expect(drills.active()?.state).toBe('injected');
    const self = drills.selfCertify();
    expect(self.ok).toBe(true);
    const rec = drills.history()[0];
    expect(rec.selfCertified).toBe(true);
    expect(rec.state).toBe('recovered');
    expect(drills.active()).toBeNull();
  });

  it('guards: unknown fault / already-active fault', () => {
    expect(drills.start('NOPE').ok).toBe(false);
    hmi.toggle('quenchFault');
    const res = drills.start('FAULT-QUENCH');
    expect(res.ok).toBe(false);
    expect(res.message).toContain('already');
    hmi.toggle('quenchFault');
    hmi.tick(0.5);
  });
});

describe('drill data wiring', () => {
  it('every training-scenario fault maps to an injectable hmi fault key', () => {
    for (const f of faultDefs) {
      if (f.reaction.kind !== 'training-scenario') continue;
      const m = f.trigger.via.match(/hmi fault "([^"]+)"/);
      expect(m, f.id).toBeTruthy();
      expect(Object.keys(hmi.faults), f.id).toContain(m![1]);
    }
    expect(faultById('FAULT-SIZE')?.trigger.signal).toBe('gage.offsetMm');
  });
});
