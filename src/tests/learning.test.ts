/**
 * Learning mode (Phase 6) tests.
 *
 * The learning tab reports informational counters only - these tests check
 * that the counters reflect what the trainee actually did, stay honest
 * (no invented thresholds) and share the same session singletons as the UI.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { procedures, ProcedureTracker, procedureSession } from '../sim/procedures';
import { drills } from '../sim/faults';
import { learning } from '../sim/learning';
import { bus, hmi } from '../sim/runtime';

describe('learning session metrics', () => {
  beforeEach(() => {
    hmi.reset();
    bus.reset();
    for (const k of bus.forcedKeysList()) bus.unforce(k);
    drills.abandon();
    procedureSession.reset();
  });

  it('procedure tracker counts completed, blocked and self-certified actions', () => {
    const t = new ProcedureTracker();
    const proc = procedures[0]; // PROC-START-STOP, PC-001.1 manual
    const blocked = t.completeStep(proc.id, proc.steps[2].id);
    expect(blocked.ok).toBe(false);
    expect(t.sessionStats().blockedAttempts).toBe(1);
    expect(procedures[0].steps[0].manual).toBe(true);
    const ok = t.completeStep(proc.id, proc.steps[0].id);
    expect(ok.ok).toBe(true);
    const st = t.sessionStats();
    expect(st.completedSteps).toBe(1);
    expect(st.selfCertifiedSteps).toBe(1);
    expect(st.proceduresStarted).toBe(1);
    expect(st.proceduresFinished).toBe(0);
    // counters survive a reset (session-level, not state-level)
    t.reset(proc.id);
    expect(t.sessionStats().completedSteps).toBe(1);
  });

  it('records procedure completion through the shared session singleton', () => {
    const before = learning.summary();
    const proc = procedures[0];
    procedureSession.completeStep(proc.id, proc.steps[0].id);
    const after = learning.summary();
    expect(after.procedures.completedSteps).toBe(before.procedures.completedSteps + 1);
    expect(after.procedures.started).toBe(before.procedures.started + 1);
  });

  it('drill recovery + abandon + self-certify are classified separately', () => {
    const before = learning.summary();
    // 1) real recovery
    expect(drills.start('FAULT-LASER').ok).toBe(true);
    hmi.toggle('laserDisabled');
    hmi.tick(0.5);
    drills.poll();
    expect(drills.history()[0].abandoned).toBeUndefined();
    expect(drills.history()[0].selfCertified).toBe(false);
    // 2) abandoned: fault stays (honest manual recovery handling)
    expect(drills.start('FAULT-SCAN').ok).toBe(true);
    drills.abandon();
    const past = drills.history()[0];
    expect(past.abandoned).toBe(true);
    expect(past.selfCertified).toBe(false);
    expect(hmi.faults.damagedCode).toBe(true);
    hmi.toggle('damagedCode');
    hmi.tick(0.5);
    // 3) crack self-certify
    expect(drills.start('FAULT-CRACK').ok).toBe(true);
    expect(drills.selfCertify().ok).toBe(true);
    const last = drills.history()[0];
    expect(last.selfCertified).toBe(true);
    expect(last.abandoned).toBeUndefined();
    const s = learning.summary();
    expect(s.drills.total).toBe(before.drills.total + 3);
    expect(s.drills.recovered).toBe(before.drills.recovered + 1);
    expect(s.drills.abandoned).toBe(before.drills.abandoned + 1);
    expect(s.drills.selfCertified).toBe(before.drills.selfCertified + 1);
    expect(s.drills.avgElapsedSimS).toBeGreaterThanOrEqual(0);
    expect(s.drills.faultsTouched).toContain('FAULT-LASER');
  });

  it('summary reports sim state honestly and invents no thresholds', () => {
    const s = learning.summary();
    expect(s.sim.forcedSignals).toEqual([]);
    expect(s.sim.activeAlarms).toEqual([]);
    expect(s.sim.drillRunning).toBeNull();
    expect(s.sessionLength).toMatch(/^\d+:\d{2}$/);
  });
});
